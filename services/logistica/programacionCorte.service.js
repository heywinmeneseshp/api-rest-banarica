'use strict';

const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

const MODULO_CONFIG = 'ProgramacionCorte';

class ProgramacionCorteService {
  async obtenerConfigProcesos() {
    const [config] = await db.configuracion.findOrCreate({
      where: { modulo: MODULO_CONFIG },
      defaults: {
        habilitado: false,
        detalles: JSON.stringify({ procesos_almacenes: [] })
      }
    });

    let detalles = { procesos_almacenes: [] };
    try {
      detalles = typeof config.detalles === 'string'
        ? JSON.parse(config.detalles)
        : (config.detalles || {});
    } catch (error) {
      console.warn('Error al parsear config de ProgramacionCorte:', error);
    }

    return Array.isArray(detalles.procesos_almacenes) ? detalles.procesos_almacenes : [];
  }

  async cargar(filas = [], semanaConsecutivo = '') {
    if (!Array.isArray(filas) || filas.length === 0) {
      throw boom.badRequest('No se recibieron filas para cargar.');
    }

    const semanaTexto = String(semanaConsecutivo || '').trim();
    if (!semanaTexto) {
      throw boom.badRequest('Debe seleccionar la semana a cargar.');
    }

    const semana = await db.semanas.findOne({
      where: { consecutivo: semanaTexto }
    });

    if (!semana) {
      throw boom.badRequest(`La semana "${semanaTexto}" no existe.`);
    }

    const filasValidas = [];
    for (const fila of filas) {
      const fecha = String(fila.fecha ?? '').trim();
      const booking = String(fila.booking ?? '').trim();
      const procesoEmpaque = String(fila.proceso_empaque ?? '').trim();
      const finca = String(fila.finca ?? '').trim();
      const cajas = Number(fila.cajas);

      if (fecha && booking && procesoEmpaque && finca && Number.isFinite(cajas)) {
        filasValidas.push({ fecha, booking, procesoEmpaque, finca, cajas });
      }
    }

    const errores = [];
    const bookingsUnicos = [...new Set(filasValidas.map((f) => f.booking))];
    const fincasUnicas = [...new Set(filasValidas.map((f) => f.finca))];

    const embarques = await db.Embarque.findAll({
      where: {
        [Op.or]: [
          { bl: { [Op.in]: bookingsUnicos } },
          { booking: { [Op.in]: bookingsUnicos } }
        ]
      },
      include: [{ model: db.semanas, required: false }]
    });

    const embarquePorBooking = new Map();
    for (const e of embarques) {
      embarquePorBooking.set(String(e.bl || '').trim(), e);
      embarquePorBooking.set(String(e.booking || '').trim(), e);
    }

    const almacenes = await db.almacenes.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.in]: fincasUnicas } },
          { consecutivo: { [Op.in]: fincasUnicas } }
        ]
      }
    });

    const almacenPorNombre = new Map();
    for (const a of almacenes) {
      almacenPorNombre.set(String(a.nombre || '').trim(), a);
      almacenPorNombre.set(String(a.consecutivo || '').trim(), a);
    }

    const filasParaCrear = [];
    const erroresFila = new Map();
    let filaActual = 0;

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const numeroFila = i + 2;
      const fecha = String(fila.fecha ?? '').trim();
      const booking = String(fila.booking ?? '').trim();
      const procesoEmpaque = String(fila.proceso_empaque ?? '').trim();
      const finca = String(fila.finca ?? '').trim();
      const cajas = Number(fila.cajas);

      if (!fecha || !booking || !procesoEmpaque || !finca || !Number.isFinite(cajas)) {
        errores.push({
          fila: numeroFila,
          message: 'Campos incompletos o invalidos (Fecha, Booking, Proceso de Empaque, Finca, Cajas).'
        });
        continue;
      }

      const embarque = embarquePorBooking.get(booking);

      if (!embarque) {
        errores.push({
          fila: numeroFila,
          booking,
          message: `No se encontro un embarque con booking/BL "${booking}".`
        });
        continue;
      }

      if (Number(embarque.id_semana) !== Number(semana.id)) {
        errores.push({
          fila: numeroFila,
          booking,
          message: `El embarque "${booking}" pertenece a la semana "${embarque.semana?.consecutivo || 'Sin semana'}", no a la semana seleccionada "${semana.consecutivo}".`
        });
        continue;
      }

      const almacen = almacenPorNombre.get(finca);

      if (!almacen) {
        errores.push({
          fila: numeroFila,
          finca,
          message: `No se encontro una finca/almacen "${finca}".`
        });
        continue;
      }

      filasParaCrear.push({
        fecha,
        booking,
        proceso_empaque: procesoEmpaque,
        finca,
        cajas,
        id_embarque: embarque.id,
        id_almacen: almacen.id
      });
      filaActual++;
    }

    if (errores.length > 0) {
      return {
        creados: 0,
        borrados: 0,
        abortado: true,
        message: 'No se cargo ni se borro nada: hay filas con errores.',
        errores
      };
    }

    const embarquesSemana = await db.Embarque.findAll({
      where: { id_semana: semana.id },
      attributes: ['id']
    });
    const idsEmbarquesSemana = embarquesSemana.map((e) => e.id);

    const borrados = idsEmbarquesSemana.length > 0
      ? await db.programacionCorte.destroy({
        where: { id_embarque: { [Op.in]: idsEmbarquesSemana } }
      })
      : 0;

    const creados = await db.programacionCorte.bulkCreate(filasParaCrear);

    return {
      creados: creados.length,
      borrados,
      abortado: false,
      message: `Se borraron ${borrados} registros de la semana "${semana.consecutivo}" y se cargaron ${creados.length} nuevos.`,
      errores: []
    };
  }

  async listar() {
    return db.programacionCorte.findAll({
      order: [['id', 'DESC']],
      include: [
        {
          model: db.Embarque,
          required: false,
          as: 'Embarque',
          include: [{ model: db.semanas, required: false }]
        },
        { model: db.almacenes, required: false, as: 'almacen' }
      ]
    });
  }

  async comparativa(semanaConsecutivo = '') {
    const semanaTexto = String(semanaConsecutivo || '').trim();
    if (!semanaTexto) {
      throw boom.badRequest('Debe seleccionar la semana.');
    }

    const semana = await db.semanas.findOne({
      where: { consecutivo: semanaTexto }
    });

    if (!semana) {
      throw boom.badRequest(`La semana "${semanaTexto}" no existe.`);
    }

    const embarquesSemana = await db.Embarque.findAll({
      where: { id_semana: semana.id },
      attributes: ['id']
    });
    const ids = embarquesSemana.map((e) => e.id);

    const progRows = ids.length > 0
      ? await db.programacionCorte.findAll({ where: { id_embarque: { [Op.in]: ids } } })
      : [];

    const listRows = ids.length > 0
      ? await db.Listado.findAll({
        where: {
          id_embarque: { [Op.in]: ids },
          habilitado: { [Op.ne]: false }
        },
        include: [
          { model: db.Embarque, required: false },
          { model: db.almacenes, required: false, as: 'almacen' },
          { model: db.combos, required: false }
        ]
      })
      : [];

    const procesosConfig = await this.obtenerConfigProcesos();
    const procesoAAlmacen = new Map(
      procesosConfig
        .filter((p) => p && p.proceso && p.almacen)
        .map((p) => [String(p.proceso).trim().toLowerCase(), String(p.almacen).trim()])
    );

    const progMap = new Map();
    for (const r of progRows) {
      const procesoKey = String(r.proceso_empaque || '').trim().toLowerCase();
      const fincaComparacion = procesoAAlmacen.get(procesoKey) || String(r.finca).trim();
      const key = `${r.fecha}|${String(r.booking).trim()}|${fincaComparacion}`;
      progMap.set(key, (progMap.get(key) || 0) + Number(r.cajas || 0));
    }

    const listMap = new Map();
    for (const r of listRows) {
      const fecha = r.fecha ? String(r.fecha).slice(0, 10) : '';
      const bl = String(r.Embarque?.bl || '').trim();
      const finca = String(r.almacen?.nombre || '').trim();
      const key = `${fecha}|${bl}|${finca}`;
      if (!listMap.has(key)) {
        listMap.set(key, { cajas: 0, productos: new Map() });
      }
      const entry = listMap.get(key);
      const cajas = Number(r.cajas_unidades || 0);
      entry.cajas += cajas;
      const producto = String(r.combo?.nombre || 'Sin producto').trim();
      entry.productos.set(producto, (entry.productos.get(producto) || 0) + cajas);
    }

    const todas = new Set([...progMap.keys(), ...listMap.keys()]);
    const filas = [];
    for (const key of todas) {
      const [fecha, booking, finca] = key.split('|');
      const cajasProgramacion = progMap.get(key) || 0;
      const listEntry = listMap.get(key);
      const cajasListado = listEntry?.cajas || 0;

      let estado;
      if (cajasProgramacion > 0 && cajasListado === 0) estado = 'solo_programacion';
      else if (cajasProgramacion === 0 && cajasListado > 0) estado = 'solo_listado';
      else estado = cajasProgramacion === cajasListado ? 'coincide' : 'difiere';

      filas.push({
        fecha,
        booking,
        finca,
        cajasProgramacion,
        cajasListado,
        diferencia: cajasProgramacion - cajasListado,
        estado,
        productos: listEntry
          ? [...listEntry.productos.entries()].map(([producto, cajas]) => ({ producto, cajas }))
          : []
      });
    }

    filas.sort(
      (a, b) => String(a.fecha).localeCompare(String(b.fecha))
        || String(a.booking).localeCompare(String(b.booking))
        || String(a.finca).localeCompare(String(b.finca))
    );

    return {
      semana: semana.consecutivo,
      totalProgramacion: [...progMap.values()].reduce((acc, v) => acc + v, 0),
      totalListado: [...listMap.values()].reduce((acc, v) => acc + v.cajas, 0),
      filas
    };
  }

  async eliminar(id) {
    const item = await db.programacionCorte.findByPk(id);
    if (!item) {
      throw boom.notFound('El registro de programacion no existe');
    }
    await item.destroy();
    return { message: 'Registro de programacion eliminado', id };
  }
}

module.exports = ProgramacionCorteService;