const fs = require("fs");

const PedidosService = require('../services/pedidos.service');
const service = new PedidosService()


module.exports = async (cons_pedido) => {

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
          font-size: 10px;
          font-weight: 500;
        }
        th {
          height: 12px;
        }
      </style>
    </head>

    <body>
      <div class="invoice-box">
        <div>
          <div>
            <div class="imagen col-xs-6">
              <img class="logo" src="../images/9124824.png" />
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
                  www.banarica.com - facturacion@banarica.com
                </div>
              </span>

            </div>
            <div class="info col-xs-6">
              <table class="table table-sm">
                <tbody class="table">
                  <tr>
                    <td class="col-5">
                      <b>Proveedor</b>
                    </td>
                    <td class="col-7">
                      {{proveedor}}
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
                    </td>
                  </tr>
                </tbody>
              </table>
              <table class="table">

                <tbody class="table-active">
                  <tr>
                    <td class="col-6">
                      <b>Semana</b>
                    </td>
                    <td class="col-6">
                      {{semana}}
                    </td>
                  </tr>
                  <tr>
                    <td class="col-6">
                      <b>Pedido</b>
                    </td>
                    <td class="col-6">
                      {{pedido}}
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
                      Destino
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
              AUTORIZADO POR:
            </div>
            <div class="col-xs-7 border-dark">
              {{usuario}}
            </div>
          </div>
          <div class="row">
            <div class="col-xs-12 margin-top">
              <div class="row">
                <div class="col-xs-12 descripcion">
                  Por medio de la presente autorizo al siguiente conductor a retirar el anterior pedido de
                  Cartón:
                </div>
              </div>
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td>
                      Nombre:
                    </td>
                    <td>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      CC:
                    </td>
                    <td>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Vehiculo:
                    </td>
                    <td>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="col-xs-2'">
                      Observaciones:
                    </td>
                    <td class="col-xs-10">
                      {{observaciones}}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </body>

    </html>
    `

    const pedido = await service.findOneCons(cons_pedido)
    let  consecutivo = cons_pedido
    //const observaciones = pedido.observaciones
    let fecha = pedido.fecha
    let semana = pedido.cons_semana
    let productos = pedido.pedido
    let observaciones = pedido.observaciones
    let usuario = `${pedido?.user?.dataValues.nombre} ${pedido?.user?.dataValues?.apellido}`

    productos.sort((a, b) => {
      if (a.dataValues.almacen.dataValues.nombre == b.dataValues.almacen.dataValues.nombre) {
        return 0;
      }
      if (a.dataValues.almacen.dataValues.nombre < b.dataValues.almacen.dataValues.nombre) {
        return -1;
      }
      return 1;
    });

    let tabla = ""
    for ( var i = 0; i <  productos.length; i++ ) {
      let clase = (i%2 == 0) ? "table-active" : "table-primary";
      tabla = tabla + `
      <tr class="${clase}">
      <td class="col-2">
      ${productos[i].dataValues.almacen.dataValues.nombre}
      </td>
      <td class="col-2">
        ${productos[i].dataValues.cons_producto}
      </td>
      <td class="col-6">
        ${productos[i].dataValues.producto.dataValues.name}
      </td>
      <td class="col-2 autorizado">
        ${productos[i].dataValues.cantidad}
      </td>    </tr>`
    }

    contenidoHTML = contenidoHTML.replace("{{fecha}}", fecha)
    contenidoHTML = contenidoHTML.replace("{{proveedor}}", "Smurfit Kappa - Cartón de Colombia")
    contenidoHTML = contenidoHTML.replace("{{comercializadora}}", "C.I Bana Rica S.A")
    contenidoHTML = contenidoHTML.replace("{{semana}}", semana)
    contenidoHTML = contenidoHTML.replace("{{observaciones}}", observaciones)
    contenidoHTML = contenidoHTML.replace("{{usuario}}", usuario)
    contenidoHTML = contenidoHTML.replace("{{pedido}}", consecutivo)
    contenidoHTML = contenidoHTML.replace("{{productos}}", tabla)

  return contenidoHTML
};
