const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class GalonesPorRutaService {

  async create(data) {
    const existe = await db.galones_por_ruta.findOne({ where: data });
    if (existe) {
      console.log(existe)
      return { message: "Este item ya existe" }
    } else {
      let newData = data
      newData.activo = true
      return await db.galones_por_ruta.create(newData);
    }
  }

  async find() {
    return db.galones_por_ruta.findAll({
      order: [['nombre', 'ASC']]
    });
  }

  async findOne(id) {
    const item = await db.galones_por_ruta.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  async findByBody(body) {
    const item = await db.galones_por_ruta.findAll({ where: body });
    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  async consultarIndefinidos() {
    const categorias = await db.categoria_vehiculos.findAll();
    const rutas = await db.rutas.findAll({
      include: [{ model: db.galones_por_ruta }]
    });

    const categoriasId = categorias.map((element) => element.dataValues.id);

    await Promise.all(rutas.map(async (ruta) => {
      const res = ruta.galones_por_ruta.map(element => element.categoria_id);
      await Promise.all(categoriasId.map(async (categoriaId) => {
        if (!res.includes(categoriaId)) {
          await this.create({
            ruta_id: ruta.id,
            categoria_id: categoriaId,
          });
        }
      }));
    }));
    const res = await db.galones_por_ruta.findAll({
      where: { galones_por_ruta: null },
      include: [
        {
          model: db.rutas,
          include: [
            { model: db.ubicaciones, as: 'ubicacion_1' },
            { model: db.ubicaciones, as: 'ubicacion_2' },

          ]
        },
        { model: db.categoria_vehiculos }
      ]
    })
    console.log(res)
    return res;
  }

  async update(id, changes) {
    const item = await db.galones_por_ruta.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe');
    return await db.galones_por_ruta.update(changes, { where: { id } });
  }

  async delete(id) {
    const existe = await db.galones_por_ruta.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.galones_por_ruta.destroy({ where: { id } });
    return { message: "El item fue eliminado", id };
  }

  async paginate(offset, limit, item) {
    const newLimit = parseInt(limit);
    const newOffset = (parseInt(offset) - 1) * newLimit;
    const total = await db.galones_por_ruta.count({
      where: { nombre: { [Op.like]: `%${item}%` } }
    });
    const result = await db.galones_por_ruta.findAll({
      where: { nombre: { [Op.like]: `%${item}%` } },
      limit: newLimit,
      offset: newOffset
    });
    return { data: result, total };
  }
}

module.exports = GalonesPorRutaService;
