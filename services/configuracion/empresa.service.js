const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class EmpresaService {
  async create(data) {
    try {
      // Puedes añadir alguna lógica adicional aquí si es necesario
      const empresa = await db.Empresa.create(data);
      return empresa;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear la empresa');
    }
  }

  async find() {
    try {
      return await db.Empresa.findAll();
    } catch (error) {
      throw boom.badRequest('Error al obtener las empresas');
    }
  }



  async findOne(id) {
    try {
      if (!id || isNaN(id)) {
        throw boom.badRequest('ID inválido');
      }

      let empresa = await db.Empresa.findByPk(id);

      // Solo intentamos crear la empresa si no existe y el ID es 1
      if (!empresa && parseInt(id) === 1) {
        await this.create({ razonSocial: "Predeterminado", id: 1 });
        empresa = await db.Empresa.findByPk(1);
      }

      if (!empresa) {
        throw boom.notFound(`Empresa con ID ${id} no encontrada`);
      }

      return empresa;
    } catch (error) {
      // Si ya es un error Boom, lo relanzamos
      if (boom.isBoom(error)) {
        throw error;
      }

      console.error('Error en findOne:', error);
      throw boom.badImplementation('Error interno al obtener la empresa');
    }
  }


  async update(id, changes) {
    try {
      const empresa = await db.Empresa.findByPk(id);
      if (!empresa) {
        throw boom.notFound('La empresa no existe');
      }
      await empresa.update(changes);
      return { message: 'La empresa fue actualizada', id, changes };
    } catch (error) {
      throw boom.badRequest('Error al actualizar la empresa');
    }
  }

  async delete(id) {
    try {
      const empresa = await db.Empresa.findByPk(id);
      if (!empresa) {
        throw boom.notFound('La empresa no existe');
      }
      await empresa.destroy();
      return { message: 'La empresa fue eliminada', id };
    } catch (error) {
      throw boom.badRequest('Error al eliminar la empresa');
    }
  }

  async paginate(offset, limit, razonSocial = '') {
    try {
      const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
      const whereClause = razonSocial ? { razonSocial: { [Op.like]: `%${razonSocial}%` } } : {};

      const [result, total] = await Promise.all([
        db.Empresa.findAll({
          where: whereClause,
          limit: parseInt(limit),
          offset: parsedOffset,
        }),
        db.Empresa.count({ where: whereClause }),
      ]);

      return { data: result, total };
    } catch (error) {
      throw boom.badRequest('Error al paginar las empresas');
    }
  }
}

module.exports = EmpresaService;
