const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');
const categoriaVService = require("./categoriaVehiculos.service.js");
const GalonesService = require("./galonesPorRuta.service.js");

const categoriaService = new categoriaVService();
const galonesService = new GalonesService();

class rutasService {

  async create(data) {
    data.activo = true
    const existe = await db.rutas.findOne({ where: data });
    if (existe) throw boom.conflict('El item ya existe')
    const newAlamacen = await db.rutas.create(data);
    /*Cear consumo de rutas en 0*/
    const res = await categoriaService.find()
    res.map(async (item) => {
      const body = {
        ruta_id: newAlamacen.id,
        categoria_id: item.dataValues.id
      }
      const resb = await galonesService.findByBody(body);
      if (!resb[0]) await galonesService.create(body);
      return newAlamacen
    })


    return newAlamacen
  }

  async find() {
    const res = await db.rutas.findAll()
    return res;
  }

  async findOne(id) {
    const item = await db.rutas.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async findWhere(objeto) {
    const item = await db.rutas.findOne({ where: objeto });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async update(id, changes) {
    const item = await db.rutas.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    const result = await db.rutas.update(changes, { where: { id } });
    return result;
  }

  async delete(id) {
    const existe = await db.rutas.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.rutas.destroy({ where: { id } });
    return { message: "El item fue eliminado", id }
  }

  async paginate(offset, limit, item) {
    const newLimit = parseInt(limit);
    const newOffset = (parseInt(offset) - 1) * newLimit;
  
    const { count, rows } = await db.rutas.findAndCountAll({
      include: [
        {
          model: db.ubicaciones,
          as: 'ubicacion_1',
          where: {
            [Op.or]: [
              { ubicacion: { [Op.like]: `%${item}%` } }
            ]
          }
        },
        {
          model: db.ubicaciones,
          as: 'ubicacion_2',
        }
      ],
      limit: newLimit,
      offset: newOffset
    });
  
    return { data: rows, total: count };
  }
  


}

module.exports = rutasService
