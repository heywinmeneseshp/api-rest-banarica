require('dotenv').config();

const db = require('../models');

async function main() {
  const transaction = await db.sequelize.transaction();

  try {
    console.log('Limpiando datos de transporte...');

    await db.productos_viajes.destroy({ where: {}, truncate: true, force: true, transaction });
    await db.programacion.destroy({ where: {}, truncate: true, force: true, transaction });
    await db.tanqueos.destroy({ where: {}, truncate: true, force: true, transaction });
    await db.record_consumos.destroy({ where: {}, truncate: true, force: true, transaction });
    await db.consumo_ruta_vehiculo.destroy({ where: {}, truncate: true, force: true, transaction });
    await db.galones_por_ruta.destroy({ where: {}, truncate: true, force: true, transaction });
    await db.rutas.destroy({ where: {}, truncate: true, force: true, transaction });
    await db.vehiculo.destroy({ where: {}, truncate: true, force: true, transaction });
    await db.conductores.destroy({ where: {}, truncate: true, force: true, transaction });
    await db.ubicaciones.destroy({ where: {}, truncate: true, force: true, transaction });
    await db.categoria_vehiculos.destroy({ where: {}, truncate: true, force: true, transaction });

    console.log('Creando catalogos base...');

    let semana = await db.semanas.findOne({
      where: { consecutivo: 'S16-2026' },
      transaction,
    });

    if (!semana) {
      semana = await db.semanas.create({
        consecutivo: 'S16-2026',
        semana: '16',
        anho: '2026',
      }, { transaction });
    }

    const cliente = await db.clientes.findOrCreate({
      where: { cod: 'CLI-DEMO-TRP' },
      defaults: {
        razon_social: 'Cliente Demo Transporte',
        nit: '900000001',
        domicilio: 'Zona Industrial',
        telefono: 300000001,
        email: 'demo.transporte@banarica.local',
        activo: true,
        cod: 'CLI-DEMO-TRP',
        pais: 'Colombia',
      },
      transaction,
    }).then(([item]) => item);

    const destino = await db.Destino.findOrCreate({
      where: { cod: 'DST-DEMO-TRP' },
      defaults: {
        destino: 'Cartagena Demo',
        pais: 'Colombia',
        cod: 'DST-DEMO-TRP',
        habilitado: true,
      },
      transaction,
    }).then(([item]) => item);

    const naviera = await db.Naviera.findOrCreate({
      where: { cod: 'NAV-DEMO-TRP' },
      defaults: {
        navieras: 'Naviera Demo',
        cod: 'NAV-DEMO-TRP',
        habilitado: true,
      },
      transaction,
    }).then(([item]) => item);

    const buque = await db.Buque.findOrCreate({
      where: { buque: 'Buque Demo 01' },
      defaults: {
        buque: 'Buque Demo 01',
        id_naviera: naviera.id,
        habilitado: true,
      },
      transaction,
    }).then(([item]) => item);

    const embarqueA = await db.Embarque.create({
      id_semana: semana.id,
      id_cliente: cliente.id,
      id_destino: destino.id,
      id_naviera: naviera.id,
      viaje: 'VJ-DEMO-001',
      anuncio: 'AN-DEMO-001',
      sae: 'SAE-DEMO-001',
      id_buque: buque.id,
      booking: 'BK-DEMO-001',
      bl: 'BL-DEMO-001',
      fecha_zarpe: new Date('2026-04-24T08:00:00'),
      fecha_arribo: new Date('2026-04-27T14:00:00'),
      observaciones: 'Embarque demo para programacion',
      habilitado: true,
    }, { transaction });

    const embarqueB = await db.Embarque.create({
      id_semana: semana.id,
      id_cliente: cliente.id,
      id_destino: destino.id,
      id_naviera: naviera.id,
      viaje: 'VJ-DEMO-002',
      anuncio: 'AN-DEMO-002',
      sae: 'SAE-DEMO-002',
      id_buque: buque.id,
      booking: 'BK-DEMO-002',
      bl: 'BL-DEMO-002',
      fecha_zarpe: new Date('2026-04-25T09:00:00'),
      fecha_arribo: new Date('2026-04-28T16:00:00'),
      observaciones: 'Segundo embarque demo para contenedores',
      habilitado: true,
    }, { transaction });

    const categoriaCamion = await db.categoria_vehiculos.create({
      categoria: 'Camion sencillo demo',
      galones_por_kilometro: 0.35,
      activo: true,
    }, { transaction });

    const categoriaTracto = await db.categoria_vehiculos.create({
      categoria: 'Tractomula demo',
      galones_por_kilometro: 0.48,
      activo: true,
    }, { transaction });

    const conductorA = await db.conductores.create({
      consecutivo: 'COND-DEMO-001',
      conductor: 'Carlos Mendez',
      cons_transportadora: '',
      email: 'carlos.mendez@banarica.local',
      tel: '3001002001',
      licencia: 'LIC-DEMO-001',
      isBlock: false,
    }, { transaction });

    const conductorB = await db.conductores.create({
      consecutivo: 'COND-DEMO-002',
      conductor: 'Ana Torres',
      cons_transportadora: '',
      email: 'ana.torres@banarica.local',
      tel: '3001002002',
      licencia: 'LIC-DEMO-002',
      isBlock: false,
    }, { transaction });

    const ubicacionPatio = await db.ubicaciones.create({
      ubicacion: 'Patio Central',
      detalle: 'Base operativa demo',
      activo: true,
      cod: 'UBI-DEMO-001',
    }, { transaction });

    const ubicacionPuerto = await db.ubicaciones.create({
      ubicacion: 'Puerto Cartagena',
      detalle: 'Zona portuaria demo',
      activo: true,
      cod: 'UBI-DEMO-002',
    }, { transaction });

    const ubicacionZonaFranca = await db.ubicaciones.create({
      ubicacion: 'Zona Franca',
      detalle: 'Destino demo',
      activo: true,
      cod: 'UBI-DEMO-003',
    }, { transaction });

    console.log('Creando vehiculos, rutas y consumos...');

    const vehiculoA = await db.vehiculo.create({
      vehiculo: 'Camion demo 1',
      modelo: '2022',
      placa: 'TRP-101',
      conductor_id: String(conductorA.id),
      categoria_id: String(categoriaCamion.id),
      combustible: 138,
      gal_por_km: 0.35,
      activo: true,
    }, { transaction });

    const vehiculoB = await db.vehiculo.create({
      vehiculo: 'Tractomula demo 2',
      modelo: '2024',
      placa: 'TRP-202',
      conductor_id: String(conductorB.id),
      categoria_id: String(categoriaTracto.id),
      combustible: 90,
      gal_por_km: 0.48,
      activo: true,
    }, { transaction });

    const rutaPatioPuerto = await db.rutas.create({
      ubicacion1: String(ubicacionPatio.id),
      ubicacion2: String(ubicacionPuerto.id),
      km: 18,
      detalles: 'Ruta demo patio a puerto',
      activo: true,
    }, { transaction });

    const rutaPuertoZona = await db.rutas.create({
      ubicacion1: String(ubicacionPuerto.id),
      ubicacion2: String(ubicacionZonaFranca.id),
      km: 24,
      detalles: 'Ruta demo puerto a zona franca',
      activo: true,
    }, { transaction });

    const rutaZonaPatio = await db.rutas.create({
      ubicacion1: String(ubicacionZonaFranca.id),
      ubicacion2: String(ubicacionPatio.id),
      km: 20,
      detalles: 'Retorno demo a patio',
      activo: true,
    }, { transaction });

    await db.galones_por_ruta.bulkCreate([
      {
        ruta_id: String(rutaPatioPuerto.id),
        categoria_id: String(categoriaCamion.id),
        galones_por_ruta: 12,
        activo: true,
      },
      {
        ruta_id: String(rutaPuertoZona.id),
        categoria_id: String(categoriaCamion.id),
        galones_por_ruta: 15,
        activo: true,
      },
      {
        ruta_id: String(rutaZonaPatio.id),
        categoria_id: String(categoriaCamion.id),
        galones_por_ruta: 11,
        activo: true,
      },
      {
        ruta_id: String(rutaPatioPuerto.id),
        categoria_id: String(categoriaTracto.id),
        galones_por_ruta: 18,
        activo: true,
      },
      {
        ruta_id: String(rutaPuertoZona.id),
        categoria_id: String(categoriaTracto.id),
        galones_por_ruta: 22,
        activo: true,
      },
    ], { transaction });

    await db.consumo_ruta_vehiculo.bulkCreate([
      {
        vehiculo_id: String(vehiculoA.id),
        ruta_id: String(rutaPatioPuerto.id),
        consumo_por_km: 12,
        activo: true,
      },
      {
        vehiculo_id: String(vehiculoA.id),
        ruta_id: String(rutaPuertoZona.id),
        consumo_por_km: 15,
        activo: true,
      },
      {
        vehiculo_id: String(vehiculoA.id),
        ruta_id: String(rutaZonaPatio.id),
        consumo_por_km: 11,
        activo: true,
      },
      {
        vehiculo_id: String(vehiculoB.id),
        ruta_id: String(rutaPatioPuerto.id),
        consumo_por_km: 18,
        activo: true,
      },
      {
        vehiculo_id: String(vehiculoB.id),
        ruta_id: String(rutaPuertoZona.id),
        consumo_por_km: 22,
        activo: true,
      },
    ], { transaction });

    console.log('Creando liquidacion de referencia, cargues y ajuste...');

    const liquidacionVehiculoB = await db.record_consumos.create({
      fecha: '2026-04-18',
      semana: 'S16-2026',
      vehiculo_id: String(vehiculoB.id),
      conductor_id: String(conductorB.id),
      stock_inicial: 90,
      stock_final: 90,
      stock_real: 90,
      tanqueo: 0,
      km_recorridos: 0,
      gal_por_km: 0,
      detalle: 'LIQUIDACION_RUTA:2026-04-18:2026-04-18',
      activo: true,
      liquidado: true,
    }, { transaction });

    await db.tanqueos.bulkCreate([
      {
        fecha: new Date('2026-04-19T08:00:00'),
        factura: 'FAC-TRP-1001',
        tanqueo: 30,
        costo: 180000,
        record_consumo_id: null,
        vehiculo_id: String(vehiculoA.id),
        saldo_anterior: 120,
        saldo_nuevo: 150,
        observacion: 'Cargue demo inicial',
        activo: true,
      },
      {
        fecha: new Date('2026-04-20T09:15:00'),
        factura: 'AJUSTE',
        tanqueo: -12,
        costo: null,
        record_consumo_id: null,
        vehiculo_id: String(vehiculoA.id),
        saldo_anterior: 150,
        saldo_nuevo: 138,
        observacion: 'AJUSTE DE SALDO: conciliacion por medicion fisica del tanque',
        activo: true,
      },
      {
        fecha: new Date('2026-04-18T07:30:00'),
        factura: 'FAC-TRP-2001',
        tanqueo: 0,
        costo: 0,
        record_consumo_id: String(liquidacionVehiculoB.id),
        vehiculo_id: String(vehiculoB.id),
        saldo_anterior: 90,
        saldo_nuevo: 90,
        observacion: 'Saldo conciliado al cierre liquidado',
        activo: true,
      },
    ], { transaction });

    console.log('Creando programaciones demo...');

    await db.programacion.bulkCreate([
      {
        ruta_id: String(rutaPatioPuerto.id),
        cobrar: false,
        id_pagador_flete: String(cliente.id),
        activo: true,
        movimiento: 'Contenedor',
        conductor_id: String(conductorA.id),
        vehiculo_id: String(vehiculoA.id),
        contenedor: 'MSCU1234567',
        bl: embarqueA.bl,
        semana: 'S16-2026',
        fecha: '2026-04-21',
        detalles: 'Salida programada al puerto',
        llegada_origen: '07:30',
        salida_origen: '08:00',
        llegada_destino: '09:10',
        salida_destino: '09:30',
        eliminado: false,
      },
      {
        ruta_id: String(rutaPuertoZona.id),
        cobrar: false,
        id_pagador_flete: String(cliente.id),
        activo: true,
        movimiento: 'Puerto',
        conductor_id: String(conductorA.id),
        vehiculo_id: String(vehiculoA.id),
        contenedor: 'MSCU1234567',
        bl: embarqueA.bl,
        semana: 'S16-2026',
        fecha: '2026-04-22',
        detalles: 'Traslado de puerto a zona franca',
        llegada_origen: '10:20',
        salida_origen: '10:45',
        llegada_destino: '11:30',
        salida_destino: '11:50',
        eliminado: false,
      },
      {
        ruta_id: String(rutaPatioPuerto.id),
        cobrar: false,
        id_pagador_flete: String(cliente.id),
        activo: true,
        movimiento: 'Local',
        conductor_id: String(conductorB.id),
        vehiculo_id: String(vehiculoB.id),
        contenedor: null,
        bl: null,
        semana: 'S16-2026',
        fecha: '2026-04-20',
        detalles: 'Movimiento local de apoyo',
        llegada_origen: '06:45',
        salida_origen: '07:00',
        llegada_destino: '07:40',
        salida_destino: '08:00',
        eliminado: false,
      },
      {
        ruta_id: String(rutaZonaPatio.id),
        cobrar: false,
        id_pagador_flete: String(cliente.id),
        activo: true,
        movimiento: 'Contenedor',
        conductor_id: String(conductorB.id),
        vehiculo_id: String(vehiculoB.id),
        contenedor: 'TEMU7654321',
        bl: embarqueB.bl,
        semana: 'S16-2026',
        fecha: '2026-04-23',
        detalles: 'Retorno de contenedor al patio',
        llegada_origen: '12:10',
        salida_origen: '12:40',
        llegada_destino: '13:25',
        salida_destino: '13:50',
        eliminado: false,
      },
    ], { transaction });

    await transaction.commit();
    console.log('Datos demo de transporte cargados correctamente.');
  } catch (error) {
    await transaction.rollback();
    console.error('No fue posible resetear el demo de transporte:', error);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
}

main();
