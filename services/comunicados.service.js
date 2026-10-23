const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../models');
const sanitizeHtml = require('sanitize-html');
const EmailService = require('./email.service');

const emailService = new EmailService();

function escaparHtml(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// El mensaje es texto plano escrito a mano en un textarea: se escapa antes de
// meterlo al HTML y los saltos de linea pasan a <br>.
function escaparYFormatearMensaje(texto) {
  return escaparHtml(texto).replace(/\n/g, '<br>');
}

const MAX_MENSAJE_TEXTO = 5000;

// El mensaje se escribe con una barra de formato (negrita, cursiva,
// subrayado, color, listas y enlaces) y llega como HTML: SOLO se aceptan esas
// etiquetas y atributos; cualquier otra cosa (scripts, estilos arbitrarios,
// eventos, imagenes...) se descarta antes de guardar y de enviar.
const OPCIONES_SANITIZAR = {
  allowedTags: ['b', 'strong', 'i', 'em', 'u', 'br', 'p', 'div', 'span', 'ul', 'ol', 'li', 'a', 'font'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    span: ['style'],
    font: ['color'],
  },
  allowedStyles: {
    span: { color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i] },
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href'],
  transformTags: {
    a: (tagName, attribs) => ({ tagName, attribs: { href: attribs.href, target: '_blank', rel: 'noopener noreferrer' } }),
  },
};

// Texto plano de un mensaje (para vistas previas y para validar que no quede
// vacio): saltos de bloque a salto de linea y sin etiquetas.
function aTextoPlano(html) {
  const conSaltos = String(html || '').replace(/<\/(p|div|li)>|<br\s*\/?>/gi, '\n');
  return sanitizeHtml(conSaltos, { allowedTags: [], allowedAttributes: {} })
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Un mensaje sin etiquetas (texto plano) se convierte a HTML seguro; uno con
// etiquetas se limpia con la lista blanca.
function limpiarMensaje(mensaje) {
  const texto = String(mensaje || '');
  if (!/<[a-z][\s\S]*>/i.test(texto)) return escaparYFormatearMensaje(texto.trim());
  return sanitizeHtml(texto, OPCIONES_SANITIZAR).trim();
}

class ComunicadosService {
  // Roles (valores distintos de usuarios.id_rol) y usuarios activos con correo,
  // para armar la lista de destinatarios en la pantalla.
  async destinatariosDisponibles() {
    const usuarios = await db.usuarios.findAll({
      where: { isBlock: { [Op.not]: true } },
      attributes: ['username', 'nombre', 'apellido', 'email', 'id_rol'],
      order: [['nombre', 'ASC']],
    });
    const roles = [...new Set(usuarios.map((u) => u.id_rol).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return {
      roles,
      usuarios: usuarios
        .filter((u) => u.email)
        .map((u) => ({
          username: u.username,
          nombre: `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.username,
          email: u.email,
          id_rol: u.id_rol,
        })),
    };
  }

  // Correos sueltos + roles + usuarios puntuales -> personas reales,
  // deduplicadas por email (si alguien aparece por rol Y por seleccion
  // puntual, recibe un solo correo).
  async resolverDestinatarios({ correos = [], roles = [], usuarios = [] }) {
    const porEmail = new Map();

    for (const email of correos) {
      const limpio = String(email || '').trim().toLowerCase();
      if (limpio && !porEmail.has(limpio)) porEmail.set(limpio, { email: limpio, nombre: null });
    }

    const condiciones = [];
    if (roles.length) condiciones.push({ id_rol: { [Op.in]: roles } });
    if (usuarios.length) condiciones.push({ username: { [Op.in]: usuarios } });

    if (condiciones.length) {
      const personas = await db.usuarios.findAll({
        where: { [Op.and]: [{ isBlock: { [Op.not]: true } }, { [Op.or]: condiciones }] },
        attributes: ['username', 'nombre', 'apellido', 'email'],
      });
      for (const u of personas) {
        if (!u.email) continue;
        const limpio = u.email.trim().toLowerCase();
        const nombre = `${u.nombre || ''} ${u.apellido || ''}`.trim() || null;
        const existente = porEmail.get(limpio);
        if (!existente) {
          porEmail.set(limpio, { email: u.email.trim(), nombre, username: u.username });
        } else if (!existente.username) {
          // el correo ya estaba como correo suelto: igual es un usuario, tambien recibe el mensaje en la app
          existente.username = u.username;
          existente.nombre = existente.nombre || nombre;
        }
      }
    }

    return [...porEmail.values()];
  }

  construirHtml({ marca, nombre, asunto, mensaje }) {
    const saludo = nombre ? `Hola <strong style="color: #166534;">${escaparHtml(nombre)}</strong>,` : 'Hola,';
    return `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08);">
        <div style="background: linear-gradient(135deg, #166534 0%, #22a35e 100%); padding: 28px 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">${escaparHtml(marca)}</h1>
          <p style="color: rgba(255,255,255,.85); margin: 4px 0 0; font-size: 13px;">Comunicado</p>
        </div>
        <div style="padding: 32px;">
          <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.5;">${saludo}</p>
          <p style="margin: 0 0 4px; color: #166534; font-weight: 700; font-size: 15px;">${escaparYFormatearMensaje(asunto)}</p>
          <div style="color: #374151; font-size: 14px; line-height: 1.6;">
            ${mensaje}
          </div>
        </div>
        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 11px;">Este mensaje se genero automaticamente, por favor no respondas a este correo.</p>
        </div>
      </div>
    `;
  }

  async enviar(payload, actor, archivos = []) {
    const asunto = String(payload?.asunto || '').trim();
    const mensaje = limpiarMensaje(payload?.mensaje);
    const correos = Array.isArray(payload?.correos) ? payload.correos : [];
    const roles = Array.isArray(payload?.roles) ? payload.roles.map(String) : [];
    const usuarios = Array.isArray(payload?.usuarios) ? payload.usuarios.map(String) : [];

    if (!asunto) throw boom.badRequest('El asunto es obligatorio');
    const textoMensaje = aTextoPlano(mensaje);
    if (!textoMensaje) throw boom.badRequest('El mensaje es obligatorio');
    if (textoMensaje.length > MAX_MENSAJE_TEXTO) throw boom.badRequest(`El mensaje no puede superar ${MAX_MENSAJE_TEXTO} caracteres`);
    if (asunto.length > 200) throw boom.badRequest('El asunto no puede superar 200 caracteres');

    const destinatarios = await this.resolverDestinatarios({ correos, roles, usuarios });
    if (destinatarios.length === 0) {
      throw boom.badRequest('No se pudo resolver ningun destinatario real (correos/roles/usuarios): revise la seleccion');
    }

    const config = await emailService.getEmailConfig();
    const marca = config.email_from_name || 'Bana Rica';

    const archivosCorreo = archivos.map((f) => ({
      nombre: f.originalname,
      tipo: f.mimetype,
      contenido: f.buffer.toString('base64'),
    }));
    const adjuntosResumen = archivos.map((f) => ({ nombre: f.originalname, tamanioBytes: f.size, tipo: f.mimetype }));

    const resultados = [];
    for (const destinatario of destinatarios) {
      try {
        const respuesta = await emailService.send({
          destinatario: destinatario.email,
          asunto: `${marca} - ${asunto}`,
          cuerpo: this.construirHtml({ marca, nombre: destinatario.nombre, asunto, mensaje }),
          archivos: archivosCorreo,
        });
        if (respuesta?.success) {
          resultados.push({ email: destinatario.email, nombre: destinatario.nombre, ok: true });
        } else {
          resultados.push({ email: destinatario.email, nombre: destinatario.nombre, ok: false, error: respuesta?.message || 'No se pudo enviar' });
        }
      } catch (error) {
        resultados.push({ email: destinatario.email, nombre: destinatario.nombre, ok: false, error: error.message });
      }
    }

    const enviadosOk = resultados.filter((r) => r.ok).length;

    // Snapshot de lo elegido (nombres), independiente de los correos ya resueltos.
    const usuariosInfo = usuarios.length
      ? await db.usuarios.findAll({ where: { username: { [Op.in]: usuarios } }, attributes: ['username', 'nombre', 'apellido'] })
      : [];

    const creado = await db.comunicados.create({
      asunto,
      mensaje,
      destinatarios_resumen: {
        correos,
        roles,
        usuarios: usuariosInfo.map((u) => ({ username: u.username, nombre: `${u.nombre || ''} ${u.apellido || ''}`.trim() })),
      },
      resultados,
      adjuntos: adjuntosResumen,
      total_destinatarios: resultados.length,
      enviados_ok: enviadosOk,
      enviados_error: resultados.length - enviadosOk,
      created_by: actor || null,
    });

    // Bandeja dentro de la app: el mensaje tambien le llega a cada usuario
    // (no solo al correo). Los correos sueltos que no son de un usuario solo
    // reciben el correo.
    const usernamesApp = [...new Set(destinatarios.map((d) => d.username).filter(Boolean))];
    if (usernamesApp.length) {
      await db.comunicado_destinatarios.bulkCreate(
        usernamesApp.map((username) => ({ comunicado_id: creado.id, username })),
      );
    }

    return creado;
  }

  // ---- Mensajes del usuario autenticado (icono junto al nombre) ----
  async contarNoLeidos(username) {
    return db.comunicado_destinatarios.count({ where: { username, leido_at: null } });
  }

  async misMensajes(username, { page = 1, limit = 20 } = {}) {
    const parsedLimit = Math.min(50, parseInt(limit, 10) || 20);
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const { rows, count } = await db.comunicado_destinatarios.findAndCountAll({
      where: { username },
      include: [{
        model: db.comunicados,
        as: 'comunicado',
        attributes: ['id', 'asunto', 'mensaje', 'adjuntos', 'created_by', 'createdAt'],
      }],
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        leido: Boolean(r.leido_at),
        leido_at: r.leido_at,
        recibido: r.createdAt,
        asunto: r.comunicado?.asunto || '',
        mensaje: r.comunicado?.mensaje || '',
        mensaje_texto: aTextoPlano(r.comunicado?.mensaje),
        adjuntos: (r.comunicado?.adjuntos || []).map((a) => ({ nombre: a.nombre, tamanioBytes: a.tamanioBytes })),
        enviado_por: r.comunicado?.created_by || '',
      })),
      meta: { page: parsedPage, limit: parsedLimit, total: count, totalPages: Math.max(1, Math.ceil(count / parsedLimit)) },
    };
  }

  async marcarLeido(username, id) {
    const item = await db.comunicado_destinatarios.findOne({ where: { id, username } });
    if (!item) throw boom.notFound('Mensaje no encontrado');
    if (!item.leido_at) await item.update({ leido_at: new Date() });
    return { id: item.id, leido: true };
  }

  async marcarTodosLeidos(username) {
    const [actualizados] = await db.comunicado_destinatarios.update(
      { leido_at: new Date() },
      { where: { username, leido_at: null } },
    );
    return { actualizados };
  }

  async list({ page = 1, limit = 20, search = '' } = {}) {
    const parsedLimit = Math.min(100, parseInt(limit, 10) || 20);
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const where = search ? { asunto: { [Op.like]: `%${search}%` } } : {};
    const { rows, count } = await db.comunicados.findAndCountAll({
      where,
      attributes: { exclude: ['resultados', 'mensaje'] },
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
    });
    return {
      items: rows,
      meta: { page: parsedPage, limit: parsedLimit, total: count, totalPages: Math.max(1, Math.ceil(count / parsedLimit)) },
    };
  }

  async findOne(id) {
    const item = await db.comunicados.findByPk(id);
    if (!item) throw boom.notFound('Comunicado no encontrado');
    return item;
  }
}

// Expuestos para pruebas del sanitizador.
ComunicadosService.limpiarMensaje = limpiarMensaje;
ComunicadosService.aTextoPlano = aTextoPlano;

module.exports = ComunicadosService;
