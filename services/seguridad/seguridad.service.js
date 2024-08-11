const boom = require('@hapi/boom');
const db = require('../../models');
const { Op } = require('sequelize');
const serial_de_articulos = require('../../models/serial_de_articulos');


class SeguridadService {

  async cargarSeriales(data) {
    const batchSize = 500; // Tamaño del lote
    const t = await db.sequelize.transaction();

    try {
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await db.serial_de_articulos.bulkCreate(batch, { transaction: t });
      }

      await t.commit();
      return { message: 'Datos cargados exitosamente' };
    } catch (e) {
      await t.rollback();
      throw boom.conflict("Error al cargar los datos: " + e.message);
    }
  }


  async actualizarSeriales(data) {
    const batchSize = 100; // Tamaño del lote, ajustable según tus necesidades
    const t = await db.sequelize.transaction();
  
    try {
      // Dividir los datos en lotes y procesar cada lote
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
  
        // Obtener todos los seriales en el lote actual
        const seriales = batch.map(item => item.serial);
        const existingRecords = await db.serial_de_articulos.findAll({
          where: { serial: seriales },
          transaction: t
        });
  
        // Crear un mapa para búsquedas rápidas
        const existingMap = new Map(existingRecords.map(record => [record.serial, record]));
  
        // Dividir los datos en actualizaciones e inserciones
        const updates = [];
        const creations = [];
  
        for (const item of batch) {
          if (existingMap.has(item.serial)) {
            updates.push(db.serial_de_articulos.update(item, {
              where: { serial: item.serial },
              transaction: t
            }));
          } else {
            creations.push(db.serial_de_articulos.create({
              cons_producto: item.cons_producto,
              serial: item.serial,
              bag_pack: 'null',
              s_pack: 'null',
              m_pack: 'null',
              l_pack: 'null',
              cons_almacen: item.cons_almacen,
              cons_movimiento: item?.cons_movimiento,
              available: false
            }, { transaction: t }));
          }
        }
  
        // Ejecutar todas las actualizaciones e inserciones en paralelo
        await Promise.all([...updates, ...creations]);
      }
  
      await t.commit();
      return { message: "Datos cargados con éxito" };
    } catch (error) {
      await t.rollback();
      throw new Error("Error al actualizar los datos: " + error.message);
    }
  }
  

  async encontrarUnserial(data) {
    const producto = data?.producto
    delete data.producto
    return await db.serial_de_articulos.findOne({
      where: data,
      include: [{
        model: db.productos,
        as: "producto",
        where: producto
      }]
    })
  }

  async listarSeriales(pagination, body) {
    let available = body?.available
    if (pagination) {
      let newlimit = parseInt(pagination.limit);
      let newoffset = (parseInt(pagination.offset) - 1) * newlimit;
      const total = await db.serial_de_articulos.count({
        where: {
          cons_producto: { [Op.like]: `%${body.cons_producto}%` },
          serial: { [Op.like]: `%${body.serial}%` },
          bag_pack: { [Op.like]: `%${body.bag_pack}%` },
          s_pack: { [Op.like]: `%${body.s_pack}%` },
          m_pack: { [Op.like]: `%${body.m_pack}%` },
          l_pack: { [Op.like]: `%${body.l_pack}%` },
          cons_almacen: { [Op.like]: `%${body.cons_almacen}%` },
          available: { [Op.or]: available }
        }
      });
      const result = await db.serial_de_articulos.findAll({
        where: {
          cons_producto: { [Op.like]: `%${body.cons_producto}%` },
          serial: { [Op.like]: `%${body.serial}%` },
          bag_pack: { [Op.like]: `%${body.bag_pack}%` },
          s_pack: { [Op.like]: `%${body.s_pack}%` },
          m_pack: { [Op.like]: `%${body.m_pack}%` },
          l_pack: { [Op.like]: `%${body.l_pack}%` },
          cons_almacen: { [Op.like]: `%${body.cons_almacen}%` },
          available: { [Op.or]: available }
        },
        include: [{
          model: db.movimientos,
          as: 'movimiento'
        }, {
          model: db.productos,
          as: 'producto'
        }],
        limit: newlimit,
        offset: newoffset
      });
      return { data: result, total: total };
    } else {
      const result = await db.serial_de_articulos.findAll({
        where: {
          cons_producto: { [Op.like]: `%${body.cons_producto}%` },
          serial: { [Op.like]: `%${body.serial}%` },
          bag_pack: { [Op.like]: `%${body.bag_pack}%` },
          s_pack: { [Op.like]: `%${body.s_pack}%` },
          m_pack: { [Op.like]: `%${body.m_pack}%` },
          l_pack: { [Op.like]: `%${body.l_pack}%` },
          cons_almacen: { [Op.like]: `%${body.cons_almacen}%` },
          available: { [Op.or]: available }
        },
        include: [{
          model: db.movimientos,
          as: 'movimiento'
        }, {
          model: db.productos,
          as: 'producto'
        }]
      });
      return result;
    }
  }

  async listarArticulosSeguridad() {
    const productos = await db.productos.findAll({
      include: [{
        model: db.categorias,
        as: 'categoria',
        where: { nombre: "Seguridad" }
      }]
    })

    if (!productos) throw boom.notFound('No existen productos en esta categoria')
    return productos;
  }

  async paginarUsuarios(offset, limit, username) {
    if (!username) username = ""
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.usuarios.count({
      where: {
        username: { [Op.like]: `%${username}%` },
        id_rol: { [Op.in]: { [Op.or]: ["Super seguridad", "Seguridad"] } }
      },
    });
    const result = await db.usuarios.findAll({
      where: {
        username: { [Op.like]: `%${username}%` },
        id_rol: { [Op.in]: ["Super seguridad", "Seguridad"] }
      },
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

  async actualizarSerial(body) {
    const result = await db.serial_de_articulos.update(body, {
      where: {
        serial: body.serial
      }
    })
    return result
  }

}

module.exports = SeguridadService;
