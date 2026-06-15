/**
 * MySQL HTTP Bridge v2 — Reemplazo DROP-IN para mysql2 en Sequelize
 *
 * Uso:
 *   const mysqlHttpBridge = require('./mysql-http-bridge');
 *
 *   // En config/config.js:
 *   {
 *     dialect: 'mysql',
 *     dialectModule: mysqlHttpBridge,
 *     bridgeUrl: process.env.BRIDGE_URL,
 *     bridgeApiKey: process.env.BRIDGE_API_KEY,
 *   }
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const fakeResult = { setMaxListeners: () => fakeResult, on: () => fakeResult, emit: () => fakeResult };

// ─── UUID v4 ───
const randomUUID = crypto.randomUUID || (() => {
    const hex = crypto.randomBytes(16);
    hex[6] = (hex[6] & 0x0f) | 0x40;
    hex[8] = (hex[8] & 0x3f) | 0x80;
    const s = hex.toString('hex');
    return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
});

// ─── Regex de transacciones ───
const TXN_BEGIN_RE    = /^\s*(?:BEGIN|START\s+TRANSACTION)\s*;?\s*$/i;
const TXN_COMMIT_RE   = /^\s*COMMIT\s*;?\s*$/i;
const TXN_ROLLBACK_RE = /^\s*ROLLBACK\s*;?\s*$/i;

// ─── HTTP POST vía fetch con reintentos ───
async function httpPost(url, body, apiKey, timeoutMs = 120000, retries = 2) {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['X-API-Key'] = apiKey;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            const text = await res.text();
            try {
                return { status: res.status, body: JSON.parse(text) };
            } catch (_) {
                // Non-JSON response (Cloudflare 520, etc.) — reintentar si quedan intentos
                if (attempt < retries && (res.status === 520 || res.status >= 500 || res.status === 0)) {
                    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                    continue;
                }
                throw Object.assign(
                    new Error(`Bridge non-JSON (HTTP ${res.status})`),
                    { statusCode: res.status, raw: text.slice(0, 500) }
                );
            }
        } catch (err) {
            if (attempt < retries && (err.name === 'AbortError' || err.message?.includes('non-JSON'))) {
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                continue;
            }
            throw err;
        } finally {
            clearTimeout(timer);
        }
    }
}

// ─── Connection class ───
class HttpBridgeConnection extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.threadId = Math.floor(Math.random() * 100000) + 1;
        this._destroyed = false;
        this._transactionId = null;
        this.stream = { destroyed: false };
        this._fatalError = false;
        this._protocolError = false;
        this._closing = false;

        const dopts = config.dialectOptions || {};
        this._bridgeUrl = dopts.bridgeUrl || config.bridgeUrl || process.env.BRIDGE_URL;
        this._apiKey   = dopts.bridgeApiKey || config.bridgeApiKey || process.env.BRIDGE_API_KEY;

        if (!this._bridgeUrl) throw new Error(
            'BRIDGE_URL required. Set in .env, config.bridgeUrl, or dialectOptions.bridgeUrl');
        if (!this._apiKey) throw new Error(
            'BRIDGE_API_KEY required. Set in .env, config.bridgeApiKey, or dialectOptions.bridgeApiKey');
    }

    connect(callback) {
        if (this._destroyed) return this._error(new Error('Connection destroyed'), callback);
        this._send({ action: 'query', sql: 'SELECT 1 AS test', params: [] }, (err) => {
            if (err) { this.emit('error', err); return callback && callback(err); }
            this.emit('connect');
            callback && callback(null);
        });
    }

    query(sql, params, callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        if (typeof sql === 'object') {
            params = sql.values || sql.parameters || [];
            sql = sql.sql || sql.query || '';
        }
        callback = callback || (() => {});

        if (TXN_BEGIN_RE.test(sql))    return this._begin(callback) || fakeResult;
        if (TXN_COMMIT_RE.test(sql))   return this._commit(callback) || fakeResult;
        if (TXN_ROLLBACK_RE.test(sql)) return this._rollback(callback) || fakeResult;

        const body = { action: 'query', sql, params: params || [] };
        if (this._transactionId) body.transactionId = this._transactionId;

        this._send(body, (err, resp) => {
            if (err) return callback(err);
            this._fmt(sql, resp, callback);
        });
        return fakeResult;
    }

    execute(sql, params, callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        callback = callback || (() => {});
        const body = { action: 'query', sql, params: params || [] };
        if (this._transactionId) body.transactionId = this._transactionId;
        this._send(body, (err, resp) => {
            if (err) return callback(err);
            this._fmt(sql, resp, callback);
        });
        return fakeResult;
    }

    // ─── Transacciones ───
    _begin(callback) {
        if (this._transactionId) return callback(null, { affectedRows: 0, insertId: 0 });
        this._transactionId = randomUUID();
        this._send({ action: 'begin', transactionId: this._transactionId }, (err) => {
            if (err) { this._transactionId = null; return callback(err); }
            callback(null, { affectedRows: 0, insertId: 0 });
        });
    }

    _commit(callback) {
        const txnId = this._transactionId;
        if (!txnId) return callback(null, { affectedRows: 0, insertId: 0 });
        this._transactionId = null;
        this._send({ action: 'commit', transactionId: txnId }, (err) => {
            if (err) return callback(err);
            callback(null, { affectedRows: 0, insertId: 0 });
        });
    }

    _rollback(callback) {
        const txnId = this._transactionId;
        if (!txnId) return callback(null, { affectedRows: 0, insertId: 0 });
        this._transactionId = null;
        this._send({ action: 'rollback', transactionId: txnId }, () => {
            callback(null, { affectedRows: 0, insertId: 0 });
        });
    }

    // ─── Envío al bridge ───
    _send(body, callback) {
        if (this._destroyed) return this._error(new Error('Connection destroyed'), callback);
        body.apiKey = this._apiKey;

        httpPost(this._bridgeUrl, body, this._apiKey)
            .then(({ body: resp }) => {
                if (!resp.success) {
                    const err = new Error(resp.error || 'Bridge query failed');
                    err.code = resp.code || 'ER_BRIDGE_ERROR';
                    err.sqlState = resp.sqlState || 'HY000';
                    return callback(err, resp);
                }
                callback(null, resp);
            })
            .catch((err) => {
                this.emit('error', err);
                callback(err);
            });
    }

    // ─── Formateo de resultados ───
    _fmt(sql, resp, callback) {
        const isSelect = /^(SELECT|SHOW|DESCRIBE|EXPLAIN)\b/i.test(sql.trim());
        if (isSelect) {
            const rows = resp.rows || [];
            const fields = (resp.fields || (rows.length ? Object.keys(rows[0]) : []))
                .map((name) => ({ name, type: 253 }));
            callback(null, rows, fields);
        } else {
            callback(null, {
                fieldCount: 0, affectedRows: resp.affectedRows || 0,
                insertId: resp.insertId != null ? Number(resp.insertId) : 0,
                serverStatus: 2, warningCount: 0, message: '',
                protocol41: true, changedRows: resp.affectedRows || 0,
            });
        }
    }

    end(callback) {
        if (this._transactionId) {
            this._rollback(() => { this._destroyed = true; callback && callback(null); });
        } else {
            this._destroyed = true;
            callback && callback(null);
        }
    }

    destroy() { this._destroyed = true; this._transactionId = null; }

    ping(cb)            { cb && cb(null); }
    changeUser(o, cb)   { if (typeof o === 'function') cb = o; cb && cb(null); }
    pause() {}
    resume() {}
    _error(err, cb) { this.emit('error', err); cb && cb(err); }

    escape(v) {
        if (v == null) return 'NULL';
        if (typeof v === 'number') return String(v);
        if (typeof v === 'boolean') return v ? '1' : '0';
        if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
        return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    }
    escapeId(v) { return '`' + String(v).replace(/`/g, '``') + '`'; }
    format(sql, values) {
        if (!values) return sql;
        const copy = [...values];
        return sql.replace(/\?/g, () => this.escape(copy.shift()));
    }
}

module.exports = {
    createConnection: (config) => {
        const conn = new HttpBridgeConnection(config);
        conn.connect();
        return conn;
    },
    createPool: (config) => {
        const conn = new HttpBridgeConnection(config);
        return {
            getConnection: (cb) => cb(null, conn),
            query: (sql, p, cb) => conn.query(sql, p, cb),
            execute: (sql, p, cb) => conn.execute(sql, p, cb),
            end: (cb) => { conn.destroy(); cb && cb(); },
            on: () => {},
        };
    },
};
