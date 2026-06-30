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

      // Obtener todas las semanas vÃ¡lidas en la base de datos
      const semanasValidas = await db.semanas.findAll({ attributes: ["consecutivo", "id"] });

      // Crear un mapa con las semanas existentes
      const semanasSet = new Map(semanasValidas.map(s => [s.consecutivo, s.id]));

      // Arrays para datos vÃ¡lidos e invÃ¡lidos
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
          throw boom.badRequest(`El campo id_semana tiene un formato invÃ¡lido: ${item.id_semana}. Debe ser como 'S00-2000'.`);
        }

        // Buscar o crear la semana si no existe
        if (!semanasSet.has(item.id_semana)) {
          // Extraer semana y aÃ±o del formato S00-2000
          const match = item.id_semana.match(/^S(\d{2})-(\d{4})$/);
          if (!match) {
            throw new Error(`Formato invÃ¡lido de id_semana: ${item.id_semana}`);
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
        throw new Error("NingÃºn registro tiene una semana vÃ¡lida.");
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
      // AsegÃºrate de que Op estÃ© importado: const { Op } = require('sequelize');

      // 1. Filtrar valores nulos y eliminar duplicados de las semanas de entrada
      const getSemanaConsecutivo = (item) => {
        const value = item.id_semana || item.semana;
        return value ? String(value).trim().toUpperCase() : '';
      };

      const semanasABuscar = [...new Set(data.map(getSemanaConsecutivo).filter(Boolean))];

      // 2. Ejecutar la consulta con el array de semanas Ãºnicas
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
        // 2. ValidaciÃ³n: Asegurar que el identificador (bl) estÃ© presente.
        if (!item.bl) {
          // Se puede optar por lanzar un error o simplemente saltar el registro invÃ¡lido.
          // AquÃ­, lanzamos un error para detener la transacciÃ³n si falta un identificador.
          throw boom.badRequest('Falta el campo identificador "bl" en uno de los registros de actualizaciÃ³n.');
        }

        // 3. Preparar los cambios
        const changes = { ...item };
        delete changes.bl; // El 'bl' se usa solo para el WHERE, no debe actualizarse si es la clave de bÃºsqueda.
        const semanaConsecutivo = getSemanaConsecutivo(changes);
        delete changes.semana;

        // Si se proporciona una nueva id_semana, realizar el proceso de findOrCreate
        if (semanaConsecutivo) {
          const formatoSemana = /^S\d{2}-\d{4}$/;
          if (!formatoSemana.test(semanaConsecutivo)) {
            throw boom.badRequest(`El campo semana tiene un formato invalido: ${semanaConsecutivo}. Debe ser como 'S00-2000'.`);
          }

          // Buscar o crear la semana si no existe (lÃ³gica reutilizada de cargueMasivo)
          if (!semanasSet.has(semanaConsecutivo)) {
            const match = semanaConsecutivo.match(/^S(\d{2})-(\d{4})$/);
            const [, semanaStr, anhoStr] = match;

            const [nuevaSemana] = await db.semanas.findOrCreate({
              where: { consecutivo: semanaConsecutivo },
              defaults: {
                consecutivo: semanaConsecutivo,
                semana: parseInt(semanaStr, 10),
                anho: parseInt(anhoStr, 10)
              },
              transaction: t
            });
            semanasSet.set(semanaConsecutivo, nuevaSemana.id);
          }

          // Asignar el ID de semana correcto al objeto de cambios
          changes.id_semana = semanasSet.get(semanaConsecutivo);
        }

        // 4. Ejecutar la actualizaciÃ³n (uso de update en lugar de bulkCreate)
        const [affectedRows] = await db.Embarque.update(changes, {
          where: { bl: item.bl },
          transaction: t
        });

        if (affectedRows > 0) {
          updatesRealizados.push(item.bl);
        }
        // Si affectedRows es 0, significa que el registro con ese BL no se encontrÃ³.
      }

      if (updatesRealizados.length === 0) {
        await t.rollback(); // Si no se actualizÃ³ nada, revertimos la transacciÃ³n
        throw new Error("NingÃºn registro fue actualizado. Verifique que los 'bl' sean correctos.");
      }

      await t.commit();

      return {
        mensaje: `Se actualizaron ${updatesRealizados.length} registros exitosamente.`,
        blsActualizados: updatesRealizados
      };
    } catch (error) {
      // En caso de error, aseguramos que la transacciÃ³n sea revertida si no se ha confirmado.
      // Nota: Sequelize maneja esto implÃ­citamente, pero es buena prÃ¡ctica tenerlo en cuenta.
      throw boom.badRequest(error.message || "Error al realizar la actualizaciÃ³n masiva.");
    }
  }



  async find() {
    return db.Embarque.findAll({
      order: [['id', 'DESC']],
      include: [
        { model: db.Destino, required: false },
        { model: db.Naviera, required: false },
        { model: db.clientes, required: false },
        { model: db.Buque, required: false },
        { model: db.semanas, required: false }
      ]
    });
  }

  // Endpoint liviano para catálogos de selección (datalist, dropdowns)
  async getCatalogo() {
    return db.Embarque.findAll({
      attributes: ['id', 'bl', 'booking', 'id_cliente'],
      order: [['id', 'DESC']],
      include: [
        { model: db.semanas, attributes: ['consecutivo'], required: false },
        { model: db.clientes, attributes: ['id', 'cod'], required: false },
        { model: db.Naviera, attributes: ['cod', 'navieras'], required: false },
        { model: db.Buque, attributes: ['buque'], required: false },
        { model: db.Destino, attributes: ['cod', 'destino'], required: false },
      ],
    });
  }

  async findOne(id) {
    const embarque = await db.Embarque.findByPk(id, {
      include: [
        { model: db.Destino, required: false },
        { model: db.Naviera, required: false },
        { model: db.clientes, required: false },
        { model: db.Buque, required: false },
        { model: db.semanas, required: false }
      ]
    });
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
    const buildIncludeFilter = (field, value) => {
      const normalizedValue = String(value || '').trim();
      if (!normalizedValue) {
        return undefined;
      }

      return { [field]: { [Op.like]: `%${normalizedValue}%` } };
    };

    const buildInclude = (model, field, value) => {
      const includeWhere = buildIncludeFilter(field, value);
      return {
        model,
        required: Boolean(includeWhere),
        ...(includeWhere ? { where: includeWhere } : {}),
      };
    };

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
        buildInclude(db.Destino, 'destino', destino),
        buildInclude(db.Naviera, 'navieras', naviera),
        buildInclude(db.clientes, 'cod', cliente),
        buildInclude(db.Buque, 'buque', buque),
        buildInclude(db.semanas, 'consecutivo', semana)
      ],
      distinct: true // Asegura que el conteo sea correcto y no se dupliquen los registros.
    });
    return { data: result, total };
  }

  async exportExcel(offset, limit, body = {}) {
    const sequelize = db.sequelize;
    const pLimit = Number(limit) || 500;
    const pOffset = Number(offset) ? (Number(offset) - 1) * pLimit : 0;

    const where = ['1=1'];
    const params = [];

    if (body.semana) {
      where.push('s.consecutivo LIKE ?');
      params.push(`%${body.semana}%`);
    }
    if (body.cliente) {
      where.push('c.cod LIKE ?');
      params.push(`%${body.cliente}%`);
    }
    if (body.booking) {
      where.push('e.booking LIKE ?');
      params.push(`%${body.booking}%`);
    }
    if (body.bl) {
      where.push('e.bl LIKE ?');
      params.push(`%${body.bl}%`);
    }
    if (body.naviera) {
      where.push('n.navieras LIKE ?');
      params.push(`%${body.naviera}%`);
    }
    if (body.destino) {
      where.push('d.cod LIKE ?');
      params.push(`%${body.destino}%`);
    }
    if (body.anuncio) {
      where.push('e.anuncio LIKE ?');
      params.push(`%${body.anuncio}%`);
    }
    if (body.viaje) {
      where.push('e.viaje LIKE ?');
      params.push(`%${body.viaje}%`);
    }
    if (body.buque) {
      where.push('b.buque LIKE ?');
      params.push(`%${body.buque}%`);
    }
    if (body.sae) {
      where.push('e.sae LIKE ?');
      params.push(`%${body.sae}%`);
    }
    if (body.habilitado !== undefined) {
      where.push('e.habilitado = ?');
      params.push(body.habilitado ? 1 : 0);
    }

    const sql = `
      SELECT
        e.id, e.booking, e.bl, e.viaje, e.anuncio, e.sae,
        e.fecha_zarpe, e.fecha_arribo,
        s.consecutivo AS sem,
        c.cod AS cliente,
        n.navieras AS naviera,
        d.cod AS destino,
        b.buque
      FROM Embarques e
      LEFT JOIN semanas s ON e.id_semana = s.id
      LEFT JOIN clientes c ON e.id_cliente = c.id
      LEFT JOIN Navieras n ON e.id_naviera = n.id
      LEFT JOIN Destinos d ON e.id_destino = d.id
      LEFT JOIN Buques b ON e.id_buque = b.id
      WHERE ${where.join(' AND ')}
      ORDER BY e.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows, countRows] = await Promise.all([
      sequelize.query(sql + ';', { replacements: [...params, pLimit, pOffset], type: sequelize.QueryTypes.SELECT }),
      sequelize.query(
        `SELECT COUNT(*) AS total FROM Embarques e
         LEFT JOIN semanas s ON e.id_semana = s.id
         LEFT JOIN clientes c ON e.id_cliente = c.id
         LEFT JOIN Navieras n ON e.id_naviera = n.id
         LEFT JOIN Destinos d ON e.id_destino = d.id
         LEFT JOIN Buques b ON e.id_buque = b.id
         WHERE ${where.join(' AND ')}`,
        { replacements: params, type: sequelize.QueryTypes.SELECT }
      )
    ]);

    return { data: rows, total: countRows[0]?.total || 0 };
  }
}

module.exports = EmbarqueService;

