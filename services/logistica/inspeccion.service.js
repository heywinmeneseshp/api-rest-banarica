const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class InspeccionService {
  async create(data) {
    try {
      const inspeccion = await db.Inspeccion.create(data);
      return inspeccion;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear la inspección');
    }
  }

  async find() {
    return db.Inspeccion.findAll();
  }

  async findOne(id) {
    const inspeccion = await db.Inspeccion.findByPk(id);
    if (!inspeccion) {
      throw boom.notFound('La inspección no existe');
    }
    return inspeccion;
  }

  async update(id, changes) {
    const inspeccion = await db.Inspeccion.findByPk(id);
    if (!inspeccion) {
      throw boom.notFound('La inspección no existe');
    }
    await db.Inspeccion.update(changes, { where: { id } });
    return { message: 'La inspección fue actualizada', id, changes };
  }

  async delete(id) {
    const inspeccion = await db.Inspeccion.findByPk(id);
    if (!inspeccion) {
      throw boom.notFound('La inspección no existe');
    }
    await db.Inspeccion.destroy({ where: { id } });
    return { message: 'La inspección fue eliminada', id };
  }

  async paginate(offset, limit, filters = {}) {

/*const busqueda = {
    "cons_producto": [
        "SEL5"
    ],
    "cons_almacen": [
        "BAN",
        "525",
        "905",
        "905",
        "505",
        "518",
        "304",
        "304",
        "900",
        "531",
        "300",
        "530",
        "512",
        "904",
        "515",
        "514",
        "514",
        "508",
        "508",
        "516",
        "522",
        "502",
        "513",
        "302",
        "NAP",
        "501",
        "523",
        "OBR",
        "503",
        "503",
        "204",
        "PORT",
        "PRE",
        "509",
        "500",
        "524",
        "902",
        "902",
        "TRANS",
        "517",
        "YNP1",
        "404",
        "404",
        "YNP2"
    ],
    "available": [
        false
    ],
    "motivo_de_uso": "INSP02",
    "contenedor": "rtr",
    "fecha_inspeccion_inicio": "",
    "fecha_inspeccion_fin": "2027-01-01"
}*/


    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = { ...filters };

    const [result, total] = await Promise.all([
      db.Inspeccion.findAll({
        where: whereClause,
        include: [
          { model: db.Contenedor }
        ],
        order: [["id_contenedor", "DESC"], ["fecha", "DESC"]],
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.Inspeccion.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = InspeccionService;
