const boom = require('@hapi/boom');
const db = require('../../models');
const { Op } = require('sequelize');
const serial_de_articulos = require('../../models/serial_de_articulos');


class SeguridadService {

  async cargarSeriales(data) {
    try {
      const res = await db.serial_de_articulos.bulkCreate(data);
      return res;
    } catch (e) {
      throw boom.conflict("Error al cargar los datos")
    }
  }

  async actualizarSeriales(data) {
    const newData = data.map(async item => {
      let previous = await db.serial_de_articulos.findOne({ where: { serial: item.serial } })
      if (previous != null) {
        const res = await db.serial_de_articulos.update(item, { where: { serial: item.serial } });
        return { previous: previous, current: item, updated: res }
      } else {
        const res = await db.serial_de_articulos.create({
          cons_producto: item.cons_producto,
          serial: item.serial,
          bag_pack: 'null',
          s_pack: 'null',
          m_pack: 'null',
          l_pack: 'null',
          cons_almacen: item.cons_almacen,
          cons_movimiento: item?.cons_movimiento,
          available: false
        })
        return { previous: item, current: res, res: 0 }
      }
    })
    const result = await Promise.all(newData)
    return { message: "Datos cargados con exito", data: result }
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
    const result = await db.serial_de_articulos.update(body.serial, body)
    return result
  }

}

module.exports = SeguridadService;
