const fs = require("fs");

const TrasladosService = require("../services/traslados.service")
const service = new TrasladosService()


module.exports = async (cons_traslado) => {

  let contenidoHTML = `<!doctype html>
  <html>

  <head>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css"
      integrity="sha384-HSMxcRTRxnN+Bdg0JdbxYKrThecOKuH5zCYotlSAcp1+c8xmyTe9GYg1l9a69psu" crossorigin="anonymous">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Traslado {{traslado}}</title>
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
        margin-bottom: 15px;
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

      .td {
        width: 70px;
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
                  <td class="col-xs-5">
                    <b>Traslado</b>
                  </td>
                  <td class="col-xs-7">
                    {{Traslado}}
                  </td>
                </tr>

                <tr>
                  <td class="col-xs-5">
                    <b>Orígen</b>
                  </td>
                  <td class="col-xs-7">
                    {{origen}}
                  </td>
                </tr>

                <tr>
                  <td class="col-xs-5">
                    <b>Destino</b>
                  </td>
                  <td class="col-xs-7">
                    {{destino}}
                    </br>
                    </br>
                    </br>
                  </td>

                </tr>

                <tr>
                  <td class="col-xs-5">
                    <b>Semana</b>
                  </td>
                  <td class="col-xs-7">
                    {{semana}}
                  </td>
                </tr>

                <tr>
                  <td class="col-xs-5">
                    <b>Salida</b>
                  </td>
                  <td class="col-xs-7">
                    {{salida}}
                  </td>
                </tr>

                <tr>
                  <td class="col-xs-5">
                    <b>Llegada</b>
                  </td>
                  <td class="col-xs-7">
                    {{llegada}}
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
                  <th class="col-xs-2">
                    Cod
                  </th>
                  <th class="col-xs-4">
                    Producto
                  </th>
                  <th class="col-xs-3">
                    Bultos
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


    {{observaciones}}

     {{info}}
      </div>
    </div>
  </body>

  </html>
    `

  const traslado = await service.findOne(cons_traslado)
  let movimiento = traslado[0].traslado.dataValues
  //const observaciones = traslado.observaciones
  let fecha_salida = movimiento.fecha_salida
  let fecha_entrada = movimiento.fecha_entrada
  let semana = movimiento.semana
  let origen = movimiento.origen
  let destino = movimiento.destino
  let observaciones = movimiento.observaciones
  let vehiculo = movimiento.vehiculo
  let tranportadora = movimiento.transportadora
  let conductor = movimiento.conductor
  let productos = traslado.map(item => {
    return {
      consecutivo: item.dataValues.cons_producto,
      nombre: item.dataValues.Producto.dataValues.name,
      bulto: item.dataValues.Producto.dataValues.bulto,
      cantidad: item.dataValues.cantidad,
    }
  })

  productos.sort((a, b) => {
    if (a.nombre == b.nombre) return 0;
    if (a.nombre < b.nombre) return -1;
    return 1;
  });

  let tabla = ""
  for (var i = 0; i < productos.length; i++) {
    let clase = (i % 2 == 0) ? "table-secondary" : "table-primary";
    tabla = tabla + `
      <tr class="${clase}">
      <td class="col-2">
        ${productos[i].consecutivo}
      </td>
      <td class="col-4">
        ${productos[i].nombre}
      </td>
      <td class="col-2">
        ${productos[i].cantidad / productos[i].bulto}
      </td>
      <td class="col-2 autorizado">
        ${productos[i].cantidad}
      </td>    </tr>`
  }

  let info = `   <div class="row margin-top2">
  <div class="col-xs-12 margin-top">
    <table class="table table-sm">
      <tbody>
        <tr>
          <td class="col-xs-6">
            <table>
              <tbody>
                <tr>
                  <td class="td">Transportador:</td>
                  <td>{{tranportadora}}</td>
                </tr>
                <tr>
                  <td>Conductor:</td>
                  <td>{{conductor}}</td>
                </tr>
                <tr>
                  <td>Vehículo:</td>
                  <td>{{vehiculo}}</td>
                </tr>
              </tbody>
            </table>
          </td>
          <td class="col-xs-6">
            Firma:
            </br>
            </br>
            </br>
          </td>
        </tr>
        <tr>
          <td>Remite:</td>
          <td>
            Firma:
            </br>
            </br>
            </br>
          </td>
        </tr>
        <tr>
          <td>Recibe:</td>
          <td>
            Firma:
            </br>
            </br>
            </br>
          </td>
        </tr>
        <tr>
          <td>

          </td>
          <td>

          </td>
        </tr>
      </tbody>
    </table>

  </div>
</div>`



  contenidoHTML = contenidoHTML.replace("{{Traslado}}", cons_traslado)
  contenidoHTML = contenidoHTML.replace("{{origen}}", origen)
  contenidoHTML = contenidoHTML.replace("{{destino}}", destino)
  contenidoHTML = contenidoHTML.replace("{{semana}}", semana)
  contenidoHTML = contenidoHTML.replace("{{salida}}", fecha_salida)

  contenidoHTML = contenidoHTML.replace("{{productos}}", tabla)


  if (observaciones == null) {
    info = info.replace("{{tranportadora}}", tranportadora)
    info = info.replace("{{conductor}}", conductor)
    info = info.replace("{{vehiculo}}", vehiculo)
    contenidoHTML = contenidoHTML.replace("{{observaciones}}", "")
    contenidoHTML = contenidoHTML.replace("{{llegada}}", "")
    contenidoHTML = contenidoHTML.replace("{{info}}", info)
  } else {
    info = `
    <table class="table table-sm">
      <tbody>
        <tr>
          <td class="td">Transportador:</td>
          <td>{{tranportadora}}</td>
        </tr>
        <tr>
          <td>Conductor:</td>
          <td>{{conductor}}</td>
        </tr>
        <tr>
          <td>Vehículo:</td>
          <td>{{vehiculo}}</td>
        </tr>
      </tbody>
    </table>`
    contenidoHTML = contenidoHTML.replace("{{observaciones}}", `<div class="row">
    <div class="col-xs-12">
      <table class="table table-sm">
        <tbody>
          <tr>
            <td class="col-xs-12">
              Observaciones: ${observaciones}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`)
    contenidoHTML = contenidoHTML.replace("{{llegada}}", fecha_entrada)
    info = info.replace("{{tranportadora}}", tranportadora)
    info = info.replace("{{conductor}}", conductor)
    info = info.replace("{{vehiculo}}", vehiculo)
    contenidoHTML = contenidoHTML.replace("{{info}}", info)
  }


  return contenidoHTML
};
