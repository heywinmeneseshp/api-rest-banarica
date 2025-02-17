const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class EmbarqueService {
  async create(data) {
    try {
      const embarque = await db.Embarque.create({ ...data, habilitado: true });
      return embarque;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el embarque');
    }
  }

  
  async cargueMasivo(data) {
    try {
      const t = await db.sequelize.transaction();
  
      // Obtener todas las semanas válidas en la base de datos
      const semanasValidas = await db.semanas.findAll({ attributes: ["consecutivo", "id"] });
  
      // Crear un mapa con las semanas existentes
      const semanasSet = new Map(semanasValidas.map(s => [s.consecutivo, s.id]));
  
      // Arrays para datos válidos e inválidos
      const datosValidos = [];
      const datosInvalidos = [];
  
      for (const item of data) {
        // Buscar o crear la semana si no existe
        if (!semanasSet.has(item.id_semana)) {
          const [nuevaSemana] = await db.semanas.findOrCreate({
            where: { consecutivo: item.id_semana },
            defaults: { consecutivo: item.id_semana },
            transaction: t
          });
  
          semanasSet.set(item.id_semana, nuevaSemana.id); // Actualizar el mapa
        }
  
        // Asignar el ID correcto
        datosValidos.push({
          ...item,
          id_semana: semanasSet.get(item.id_semana)
        });
      }
  
      if (datosValidos.length === 0) {
        throw new Error("Ningún registro tiene una semana válida.");
      }
  
      // Insertar los datos transformados
      const embarques = await db.Embarque.bulkCreate(datosValidos, { transaction: t });
  
      await t.commit();
  
      return {
        mensaje: `Se insertaron ${embarques.length} registros.`,
        registrosInvalidos: datosInvalidos
      };
    } catch (error) {
      throw boom.badRequest(error.message || "Error al crear el embarque");
    }
  }
  


  async find() {
    return db.Embarque.findAll();
  }

  async findOne(id) {
    const embarque = await db.Embarque.findByPk(id);
    if (!embarque) {
      throw boom.notFound('El embarque no existe');
    }
    return embarque;
  }

  async update(id, changes) {
    const embarque = await db.Embarque.findByPk(id);
    if (!embarque) {
      throw boom.notFound('El embarque no existe');
    }
    await db.Embarque.update(changes, { where: { id } });
    return { message: 'El embarque fue actualizado', id, changes };
  }

  async delete(id) {
    const embarque = await db.Embarque.findByPk(id);
    if (!embarque) {
      throw boom.notFound('El embarque no existe');
    }
    await db.Embarque.destroy({ where: { id } });
    return { message: 'El embarque fue eliminado', id };
  }


  async paginate(offset, limit, filters = {}) {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = { ...filters };
    const { semana, cliente, booking, naviera, destino, bl, anuncio, viaje, buque, sae } = whereClause;
    const { rows: result, count: total } = await db.Embarque.findAndCountAll({
      where: {
        booking: { [Op.like]: `%${booking || ''}%` },
        viaje: { [Op.like]: `%${viaje || ''}%` },
        bl: { [Op.like]: `%${bl || ''}%` },
        anuncio: { [Op.like]: `%${anuncio || ''}%` },
        sae: { [Op.like]: `%${sae || ''}%` }
      },
      limit: parseInt(limit),
      offset: parsedOffset,
      order: [['id', 'DESC']],
      include: [
        {
          model: db.Destino,
          where: { destino: { [Op.like]: `%${destino || ''}%` } }
        },
        {
          model: db.Naviera,
          where: { navieras: { [Op.like]: `%${naviera || ''}%` } }
        },
        {
          model: db.clientes,
          where: { cod: { [Op.like]: `%${cliente || ''}%` } }
        },
        {
          model: db.Buque,
          where: { buque: { [Op.like]: `%${buque || ''}%` } }
        },
        {
          model: db.semanas,
          where: { consecutivo: { [Op.like]: `%${semana || ''}%` } }
        }
      ],
      distinct: true // Asegura que el conteo sea correcto y no se dupliquen los registros.
    });
    return { data: result, total };
  }

}

module.exports = EmbarqueService;
