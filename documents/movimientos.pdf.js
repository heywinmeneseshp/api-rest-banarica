const fs = require("fs");

const MovimientosService = require('../services/movimientos.service');
const service = new MovimientosService()


module.exports = async (consecutivo, tipo_movimiento) => {

  let contenidoHTML = `<!doctype html>
  <html>

  <head>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css"
      integrity="sha384-HSMxcRTRxnN+Bdg0JdbxYKrThecOKuH5zCYotlSAcp1+c8xmyTe9GYg1l9a69psu" crossorigin="anonymous">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Pedido</title>
    <style>
      .invoice-box {
        max-width: 800px;
        margin: auto;
        padding: 30px;
        font-size: 8px !important;
        line-height: 24px;
        font-family: 'Helvetica Neue', 'Helvetica';
        color: #555;
        font-size: 10px;
      }

      .imagen {
        text-align: center;
        margin-bottom: 10px;
      }

      .border-dark {
        text-align: center;
        border: 1px solid rgba(189, 189, 189, 0.568);
        width: 315px;
      }

      .autorizado {
        text-align: end;
      }

      .margin-top {
        margin-top: 5px;
      }

      .margin-top2 {
        margin-top: 5px;
      }

      .descripcion {
        text-align: center;
        margin-bottom: 20px;
      }

      .info,
      .imagen {
        width: 50%;
      }

      .info-containter {
        display: flex;
      }

      .parrafo {
        margin: -10px 0px;
      }

      h6 {
        font-size: 9px;
        font-weight: 700;
      }

      th {
        height: 12px;
      }

      .logo {
        width: 70%;
      }

      .table-second {
        background-color: #e5e5e5;
      }
    </style>
  </head>

  <body>
    <div class="invoice-box">
      <div>
        <div>
          <div class="imagen col-xs-6">
            <img class="logo"
              src="https://img.swapcard.com/?u=https%3A%2F%2Fcdn-api.swapcard.com%2Fpublic%2Fimages%2Fd1ed882b55264657a86f0110fb8a5240.png&q=0.8&m=fit&w=400&h=200" />
            <h6>
              Comercializadora Internacional Bana Rica S.A
            </h6>
            <span>
              <div class="parrafo">
                Cra 43a 16a Sur 38 IN 1008, Medellin, Antioquia
              </div>
              <div class="parrafo">
                Tel: (604) 480 5034 - (604) 4805022
              </div>
              <div class="parrafo">
                www.banarica.com
              </div>
            </span>

          </div>
          <div class="info col-xs-6">
            <table class="table table-sm">
              <tbody class="table">
                <tr>
                  <td class="col-5">
                    <b>Movimiento:</b>
                  </td>
                  <td class="col-7">
                    {{movimiento}}
                  </td>
                </tr>
              </tbody>
              <tbody class="table">
                <tr>
                  <td class="col-5">
                    <b>Fecha</b>
                  </td>
                  <td class="col-7">
                    {{fecha}}
                  </td>
                </tr>
              </tbody>
              <tbody class="table">
                <tr>
                  <td class="col-6">
                    <b>Comercializadora</b>
                  </td>
                  <td class="col-6">
                    {{comercializadora}}
                    </br>
                      </br>
                      </br>
                  </td>
                </tr>

                <tr class="table-second">
                  <td class="col-6">
                    <b>Semana</b>
                  </td>
                  <td class="col-6">
                    {{semana}}
                  </td>
                </tr>
                <tr class="table-second">
                  <td class="col-6">
                    <b>Consecutivo:</b>
                  </td>
                  <td class="col-6">
                    {{consecutivo}}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="row">
          <div class="col-xs-12">
            <table class="table table-hover table-sm">
              <thead>
                <tr>
                  <th class="col-xs-3">
                    Almacen
                  </th>
                  <th class="col-xs-1">
                    Cod
                  </th>
                  <th class="col-xs-5">
                    Producto
                  </th>
                  <th class="col-xs-3 autorizado">
                    Cantidad
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {{productos}}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="row margin-top2">
          <div class="col-xs-5 autorizado">
            REALIZADO POR:
          </div>
          <div class="col-xs-7 border-dark descripcion">
            {{usuario}}
          </div>
        </div>

        {{aprobacion}}

        <div class="row">
          <div class="col-xs-12 margin-top">

            <table class="table table-sm">
              <tbody>
                <tr>
                  <td class="col-xs-2'">
                    <b>Observaciones:</b>
                  </td>
                  <td class="col-xs-10">
                    {{observaciones}}
                  </td>
                </tr>
                {{respuesta}}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </body>

  </html>
    `
  const movimiento = await service.findOne(consecutivo)

  let fecha = movimiento.fecha;
  let semana = movimiento.cons_semana;
  let productos = movimiento.historial_movimientos;
  let observaciones = movimiento.observaciones;
  let respuesta = movimiento?.respuesta;
  let realizado_por = `${movimiento?.realizado?.dataValues?.nombre} ${movimiento?.realizado?.dataValues?.apellido}`
  let aprobado_por = `${movimiento?.aprobado?.dataValues?.nombre} ${movimiento?.aprobado?.dataValues?.apellido}`

  productos.sort((a, b) => {
    if (a.dataValues.cons_producto == b.dataValues.cons_producto) {
      return 0;
    }
    if (a.dataValues.cons_producto < b.dataValues.cons_producto) {
      return -1;
    }
    return 1;
  });

  let tabla = ""
  for (var i = 0; i < productos.length; i++) {
    let cons_producto = productos[i].dataValues.cons_producto;
    let producto = productos[i].dataValues.Producto.dataValues.name;
    let cantidad = productos[i].dataValues.cantidad;
    let almacen = productos[i].dataValues.cons_almacen_gestor;
    tabla = tabla + ` <tr>
      <td>
      ${almacen}
      </td>
      <td>
      ${cons_producto}
      </td>
      <td>
      ${producto}
      </td>
      <td class="col-xs-3 autorizado">
      ${cantidad}
      </td>
    </tr>`
  }


  let aprobacion = `<div class="row margin-top2">
                      <div class="col-xs-5 autorizado">
                        APROBADO POR:
                      </div>
                      <div class="col-xs-7 border-dark descripcion">
                        ${aprobado_por}
                      </div>
                    </div>`

  if (movimiento.pendiente === false && movimiento.aprobado) {
    aprobacion = aprobacion.replace("APROBADO POR:", "RECHAZADO POR:")
  } else if (movimiento.pendiente === true) {
    aprobacion = aprobacion.replace(aprobado_por, "Pendiente por aprobación")
  }

  contenidoHTML = contenidoHTML.replace("{{movimiento}}", tipo_movimiento)
  contenidoHTML = contenidoHTML.replace("{{fecha}}", fecha)
  contenidoHTML = contenidoHTML.replace("{{semana}}", semana)
  contenidoHTML = contenidoHTML.replace("{{consecutivo}}", consecutivo)
  contenidoHTML = contenidoHTML.replace("{{productos}}", tabla)
  contenidoHTML = contenidoHTML.replace("{{observaciones}}", observaciones)
  contenidoHTML = contenidoHTML.replace("{{comercializadora}}", "C.I Bana Rica S.A")
  contenidoHTML = contenidoHTML.replace("{{usuario}}", realizado_por)

  if (consecutivo.substring(0, 2) == "DV" || consecutivo.substring(0, 2) == "LQ") {
    contenidoHTML = contenidoHTML.replace("{{aprobacion}}", aprobacion)
  } else {
    contenidoHTML = contenidoHTML.replace("{{aprobacion}}", "")
  }





  let respuesta2 = `<tr>
                  <td class="col-xs-2'">
                    <b>Respuesta:</b>
                  </td>
                  <td class="col-xs-10">
                  ${respuesta}
                  </td>
                </tr> `
  if (respuesta) {
    contenidoHTML = contenidoHTML.replace("{{respuesta}}", respuesta2)
  } else {
    contenidoHTML = contenidoHTML.replace("{{respuesta}}", "")
  }

  return contenidoHTML
};
