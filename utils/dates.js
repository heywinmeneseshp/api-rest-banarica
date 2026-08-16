/**
 * Utilidades de fecha para la API.
 * Colombia no tiene horario de verano — siempre UTC-5.
 */

const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000;

/**
 * Convierte un valor de fecha/datetime de MySQL a un objeto Date en UTC.
 * MySQL devuelve strings sin zona horaria ("2026-07-29 17:45:15").
 * Sin este fix, new Date() los interpreta como hora local del servidor (UTC),
 * lo que da el valor correcto si el servidor es UTC. Si el servidor no es UTC,
 * forzamos el parse como UTC añadiendo 'Z'.
 */
function toUtcDate(value) {
  if (!value) return null;

  if (value instanceof Date) return value;

  const str = String(value).trim();
  if (!str) return null;

  // Si ya trae offset explícito (Z, +HH:MM, -HH:MM), parsear directo
  const hasOffset = str.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(str);
  const normalized = hasOffset ? str : str.replace(' ', 'T') + 'Z';

  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Devuelve un string ISO 8601 con offset Colombia explícito.
 * Ejemplo: "2026-07-29T12:45:15.000-05:00"
 * Ideal para APIs consumidas por clientes que entienden ISO 8601 (Excel Power Query, apps móviles, etc.).
 */
function toColombiaIso(value) {
  const d = toUtcDate(value);
  if (!d) return null;

  const local = new Date(d.getTime() + COLOMBIA_OFFSET_MS);

  const pad = (n) => String(n).padStart(2, '0');
  const year  = local.getUTCFullYear();
  const month = pad(local.getUTCMonth() + 1);
  const day   = pad(local.getUTCDate());
  const h     = pad(local.getUTCHours());
  const m     = pad(local.getUTCMinutes());
  const s     = pad(local.getUTCSeconds());

  return `${year}-${month}-${day}T${h}:${m}:${s}-05:00`;
}

/**
 * Devuelve solo la parte de fecha en hora Colombia: "YYYY-MM-DD".
 */
function toColombiaDate(value) {
  const iso = toColombiaIso(value);
  return iso ? iso.slice(0, 10) : null;
}

/**
 * Devuelve solo la hora en Colombia: "HH:MM:SS".
 */
function toColombiaTime(value) {
  const iso = toColombiaIso(value);
  return iso ? iso.slice(11, 19) : null;
}

/**
 * Convierte una fecha calendario en hora Colombia ("YYYY-MM-DD", tal como la
 * elige el usuario en un filtro) al rango UTC que cubre ese dia completo en
 * Bogota. Util para filtrar columnas createdAt/updatedAt (guardadas en UTC)
 * por un dia "de Colombia" sin desfasarse 5 horas.
 * Ejemplo: "2026-08-16" -> { start: 2026-08-16T05:00:00.000Z, end: 2026-08-17T04:59:59.999Z }
 */
function colombiaDayStartUtc(dateStr) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return new Date(d.getTime() - COLOMBIA_OFFSET_MS);
}

function colombiaDayEndUtc(dateStr) {
  const d = new Date(`${dateStr}T23:59:59.999Z`);
  return new Date(d.getTime() - COLOMBIA_OFFSET_MS);
}

module.exports = {
  toUtcDate,
  toColombiaIso,
  toColombiaDate,
  toColombiaTime,
  colombiaDayStartUtc,
  colombiaDayEndUtc,
};
