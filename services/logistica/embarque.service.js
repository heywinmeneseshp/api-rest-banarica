const boom = require('@hapi/boom');
const { Op, where } = require('sequelize');
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
        // Validar campos obligatorios
        const camposObligatorios = ['id_cliente', 'id_destino', 'id_naviera', 'id_buque', 'booking', 'bl'];
        const camposFaltantes = camposObligatorios.filter(campo => !item[campo]);

        if (camposFaltantes.length > 0) {
          throw boom.badRequest(`Faltan campos obligatorios: ${camposFaltantes.join(', ')}`);
        }

        // Validar formato de id_semana: debe ser como "S00-2000"
        const formatoSemana = /^S\d{2}-\d{4}$/;
        if (!formatoSemana.test(item.id_semana)) {
          throw boom.badRequest(`El campo id_semana tiene un formato inválido: ${item.id_semana}. Debe ser como 'S00-2000'.`);
        }

        // Buscar o crear la semana si no existe
        if (!semanasSet.has(item.id_semana)) {
          // Extraer semana y año del formato S00-2000
          const match = item.id_semana.match(/^S(\d{2})-(\d{4})$/);
          if (!match) {
            throw new Error(`Formato inválido de id_semana: ${item.id_semana}`);
          }

          const [, semanaStr, anhoStr] = match;
          const semana = parseInt(semanaStr, 10);
          const anho = parseInt(anhoStr, 10);

          const [nuevaSemana] = await db.semanas.findOrCreate({
            where: {
              consecutivo: item.id_semana,
            },
            defaults: {
              consecutivo: item.id_semana,
              semana,
              anho
            },
            transaction: t
          });

          semanasSet.set(item.id_semana, nuevaSemana.id); // Guardar en el Set
        }


        // Asignar el ID correcto y campos adicionales
        datosValidos.push({
          ...item,
          id_semana: semanasSet.get(item.id_semana),
          viaje: item.viaje || "N/A",
          anuncio: item.anuncio || "N/A",
          sae: item.sae || "N/A"
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

  async actualizarMasivo(data) {
    try {
      const t = await db.sequelize.transaction();

      // 1. Obtener y mapear semanas
      // Asegúrate de que Op esté importado: const { Op } = require('sequelize');

      // 1. Filtrar valores nulos y eliminar duplicados de las semanas de entrada
      const semanasABuscar = [...new Set(data.map(item => item.id_semana).filter(Boolean))];

      // 2. Ejecutar la consulta con el array de semanas únicas
      const semanasValidas = await db.semanas.findAll({
        attributes: ["consecutivo", "id"],
        where: {
          // Usamos [Op.in] para claridad, aunque Sequelize lo infiere del array
          consecutivo: { [Op.in]: semanasABuscar }
        }
      });
      const semanasSet = new Map(semanasValidas.map(s => [s.consecutivo, s.id]));

      const updatesRealizados = [];

      for (const item of data) {
        // 2. Validación: Asegurar que el identificador (bl) esté presente.
        if (!item.bl) {
          // Se puede optar por lanzar un error o simplemente saltar el registro inválido.
          // Aquí, lanzamos un error para detener la transacción si falta un identificador.
          throw boom.badRequest('Falta el campo identificador "bl" en uno de los registros de actualización.');
        }

        // 3. Preparar los cambios
        const changes = { ...item };
        delete changes.bl; // El 'bl' se usa solo para el WHERE, no debe actualizarse si es la clave de búsqueda.

        // Si se proporciona una nueva id_semana, realizar el proceso de findOrCreate
        if (changes.id_semana) {
          const formatoSemana = /^S\d{2}-\d{4}$/;
          if (!formatoSemana.test(changes.id_semana)) {
            throw boom.badRequest(`El campo id_semana tiene un formato inválido: ${changes.id_semana}. Debe ser como 'S00-2000'.`);
          }

          // Buscar o crear la semana si no existe (lógica reutilizada de cargueMasivo)
          if (!semanasSet.has(changes.id_semana)) {
            const match = changes.id_semana.match(/^S(\d{2})-(\d{4})$/);
            const [, semanaStr, anhoStr] = match;

            const [nuevaSemana] = await db.semanas.findOrCreate({
              where: { consecutivo: changes.id_semana },
              defaults: {
                consecutivo: changes.id_semana,
                semana: parseInt(semanaStr, 10),
                anho: parseInt(anhoStr, 10)
              },
              transaction: t
            });
            semanasSet.set(changes.id_semana, nuevaSemana.id);
          }

          // Asignar el ID de semana correcto al objeto de cambios
          changes.id_semana = semanasSet.get(changes.id_semana);
        }

        // 4. Ejecutar la actualización (uso de update en lugar de bulkCreate)
        const [affectedRows] = await db.Embarque.update(changes, {
          where: { bl: item.bl },
          transaction: t
        });

        if (affectedRows > 0) {
          updatesRealizados.push(item.bl);
        }
        // Si affectedRows es 0, significa que el registro con ese BL no se encontró.
      }

      if (updatesRealizados.length === 0) {
        await t.rollback(); // Si no se actualizó nada, revertimos la transacción
        throw new Error("Ningún registro fue actualizado. Verifique que los 'bl' sean correctos.");
      }

      await t.commit();

      return {
        mensaje: `Se actualizaron ${updatesRealizados.length} registros exitosamente.`,
        blsActualizados: updatesRealizados
      };
    } catch (error) {
      // En caso de error, aseguramos que la transacción sea revertida si no se ha confirmado.
      // Nota: Sequelize maneja esto implícitamente, pero es buena práctica tenerlo en cuenta.
      throw boom.badRequest(error.message || "Error al realizar la actualización masiva.");
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
