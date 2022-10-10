const boom = require('@hapi/boom');
const db = require('../../models');
const { Op } = require('sequelize');


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
    data.map(async item => {
      const itemUpdated = item;
      await db.serial_de_articulos.update(itemUpdated, { where: { serial: item.serial } });
    })
    return { message: "Datos cargados con exito" }
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
        },
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
        limit: newlimit,
        offset: newoffset
      });
      return { data: result, total: total };
    } else {
      const result = await db.serial_de_articulos.findAll({
        cons_producto: { [Op.like]: `%${body.cons_producto}%` },
        serial: { [Op.like]: `%${body.serial}%` },
        bag_pack: { [Op.like]: `%${body.bag_pack}%` },
        s_pack: { [Op.like]: `%${body.s_pack}%` },
        m_pack: { [Op.like]: `%${body.m_pack}%` },
        l_pack: { [Op.like]: `%${body.l_pack}%` },
        cons_almacen: { [Op.like]: `%${body.cons_almacen}%` },
        available: { [Op.or]: available }
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

}

module.exports = SeguridadService;
