const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../models');
const emailService = require('./email.service');

const serviceEmail = new emailService();

class HistorialMovimientosService {
  constructor() {}

   async create(data, transaction = null) {
    let t;
    try {
      // Usa la transacción proporcionada o crea una nueva si no se proporciona
      if (!transaction) {
        t = await db.sequelize.transaction();
      } else {
        t = transaction;
      }

      // Enviar alerta si es necesario
      if (data.cantidad > 20 && data.cons_lista_movimientos === 'AJ') {
        await this.sendAdjustmentAlert(data, t);
      }

      // Crear historial de movimientos dentro de la transacción
      await db.historial_movimientos.create(data, { transaction: t });

      // Si la transacción fue creada dentro de esta función, confírmala
      if (!transaction) {
        await t.commit();
      }

      return data;
    } catch (error) {
      // Si se creó una transacción, realiza un rollback en caso de error
      if (t) {
        await t.rollback();
      }
      // Maneja el error
      throw boom.badRequest(error.message || 'Error al crear el historial de movimientos');
    }
  }

 
  async sendAdjustmentAlert(data) {
    const recipients = [
      'hmeneses@banarica.com',
      'ydavila@banarica.com',
      'practicantesantamarta@banarica.com',
      'mhernandezp@banarica.com'
    ];
    const subject = `Alerta de Ajuste - ${data.cons_movimiento} - ${new Date().toISOString()}`;
    const body = `
      <h3>Ajuste <b>${data.cons_movimiento}</b></h3>
      <p>El almacén <b>${data.cons_almacen_gestor}</b> ha realizado un ajuste mayor a 20 unidades en el artículo con código <b>${data.cons_producto}</b>.</p>
    `;
    await serviceEmail.send(recipients.join(', '), subject, body);
  }

  async find() {
    return db.historial_movimientos.findAll({ include: ['Producto', 'movimiento'] });
  }

  async findOne(consecutivo) {
    const items = await db.historial_movimientos.findAll({
      where: { cons_movimiento: consecutivo },
      include: ['Producto', 'movimiento']
    });
    if (items.length === 0) throw boom.notFound('El item no existe');
    return items;
  }

  async filter(body) {
    return db.historial_movimientos.findAll({
      where: body,
      include: [{ model: db.productos }, { model: db.movimientos }]
    });
  }

  async generalFilter(body) {
    const { producto = {}, historial = {}, movimiento = {}, pagination = {} } = body;
  
    // Definir límite y desplazamiento para la paginación
    const limit = parseInt(pagination.limit, 10) || 10; // Valor por defecto si pagination.limit no está presente
    const offset = ((parseInt(pagination.offset, 10) || 1) - 1) * limit;
  
    // Construir la cláusula WHERE para la consulta
    const whereClause = {
      cons_lista_movimientos: { [Op.ne]: 'TR' },
      ...historial,
      '$Producto.name$': { [Op.like]: `%${producto.name || ''}%` },
      '$Producto.cons_categoria$': { [Op.like]: `%${producto.cons_categoria || ''}%` }
    };
  
    // Agregar condición para fecha si está presente
    if (movimiento.fecha) {
      whereClause.fecha = { [Op.like]: `%${movimiento.fecha}%` };
    }
  
    // Opciones de consulta iniciales
    const queryOptions = {
      where: whereClause,
      include: [
         'Producto',
        'movimiento'
      ],
      limit,
      offset,
      order: [ ['id', 'DESC']],
    };
  
    // Si se proporcionan filtros de movimiento, ajustar la consulta
    if (Object.keys(movimiento).length > 0) {
      const moveList = await db.movimientos.findAll({ where: movimiento });
      const list = moveList.map(item => item.consecutivo);
      queryOptions.where.cons_movimiento = { [Op.in]: list };
    }
  
    // Ejecutar la consulta
    const { count, rows: items } = await db.historial_movimientos.findAndCountAll(queryOptions);
  
    // Devolver los resultados
    return { data: items, total: count };
  }
  

  async update(id, changes) {
    const item = await db.historial_movimientos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.update(changes);
    return item;
  }

  async delete(id) {
    const item = await db.historial_movimientos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy();
    return { message: 'El item fue eliminado' };
  }

  async paginate(offset, limit, almacenes) {
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = (parseInt(offset, 10) - 1) * parsedLimit;

    const { count, rows: data } = await db.historial_movimientos.findAndCountAll({
      where: {
        cons_almacen_gestor: { [Op.in]: almacenes },
        cons_lista_movimientos: { [Op.ne]: 'TR' }
      },
      include: ['Producto', 'movimiento'],
      limit: parsedLimit,
      offset: parsedOffset,
      
    });

    return { data, total: count };
  }
}

module.exports = HistorialMovimientosService;
