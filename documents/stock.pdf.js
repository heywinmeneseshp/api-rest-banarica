const fs = require("fs");

const StockService = require('../services/stock.service');
const service = new StockService()


module.exports = async (body) => {

  let contenidoHTML = `<!doctype html>
    <html>
    <head>
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css"
        integrity="sha384-HSMxcRTRxnN+Bdg0JdbxYKrThecOKuH5zCYotlSAcp1+c8xmyTe9GYg1l9a69psu" crossorigin="anonymous">
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>Stock</title>
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
          margin-top: 10px;
        }

        .margin-top2 {
          margin-top: 20px;
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

        .heigt {
          height: 50px;
        }

        h6 {
          font-size: 14px;
          font-weight: 700;
        }

        .h7 {
          font-size: 8px;
          font-weight: 700;
        }

        th, th, tr {
          height: 12px !important;
        }

        .logo {
          width: 70%;
        }

        .table-second {
          background-color: #e5e5e5;
        }

        .title {
          margin-left: 20px;
        }

        .boder {
          border: none;
        }

        .grid {
          display: grid;
          grid-template-columns: 0.5fr 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
        }
        .finca{
          width: 20%;
        }
      </style>
    </head>

    <body>
      <div class="container-fluid invoice-box">
        <div class="row">
          <div class="col-xs-5">

                  <div class="title">
                    <h6>Inventario de cartón</h6>
                  </div>

            <table class="table table-sm">
              <thead>
              </thead>
              <tbody>
                <tr>
                  <td class="finca">
                    Finca:
                  </td>
                  <td>
                    {{finca}}
                  </td>
                </tr>
                <tr>
                  <td class="finca">
                    Fecha:
                  </td>
                  <td>

                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="col-xs-6">
          </div>
        </div>
        <div class="row">
          <div class="col-xs-12">

            <table class="table table-bordered table-sm">

              <thead>
                <tr>
                  <th>
                    Cod
                  </th>
                  <th>
                    Artículo
                  </th>
                  <th>
                    Buen estado
                  </th>
                  <th>
                    Mal estado
                  </th>
                  <th>
                    Teórico
                  </th>
                  <th>
                    Físcio
                  </th>
                </tr>
              </thead>
              <tbody>
               {{tabla}}
              </tbody>
            </table>
            <div class="row">
              <div class="col-xs-12">
                <div class="col-xs-8">
                  ¿La bodega se encontraba limpia y organizada?
                </div>
                <div class="col-xs-2">
                  SI ____
                </div>
                <div class="col-xs-2">
                  NO ____
                </div>
              </div>
              <div class="col-xs-12">
                <div class="col-xs-8">
                  ¿El personal a cargo se encontraba disponible?
                </div>
                <div class="col-xs-2">
                  SI ____
                </div>
                <div class="col-xs-2">
                  NO ____
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row margin-top2">
          <div class="col-xs-6">
            <table class="table">
              <tbody>
                <tr>
                  <td class="heigt">
                    Nombre Representante Comercializadora:
                  </td>
                  <td>

                  </td>
                </tr>
                <tr>
                  <td class="heigt">
                    Nombre Representante Finca:
                  </td>
                  <td>

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
          <div class="col-xs-6">
            <table class="table">
              <tbody>
                <tr>
                  <td class="heigt">
                    Firma:
                  </td>
                  <td>

                  </td>
                </tr>
                <tr>
                  <td class="heigt">
                    Firma:
                  </td>
                  <td>

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
        </div>
      </div>
    </body>
    </html>
    `

  const sotck = await service.generalFilter(body)
  //const observaciones = pedido.observaciones

  let productos = sotck
  let finca = sotck[0].dataValues.almacen.dataValues.nombre




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
    let cons = productos[i].dataValues.cons_producto;
    let producto = productos[i].dataValues.producto.dataValues.name;
    let cantidad = productos[i].dataValues.cantidad;
    tabla = tabla + ` <tr>
      <td>
      ${cons}
      </td>
      <td>
      ${producto}
      </td>
      <td>
      </td>
      <td>
      </td>
      <td>
      ${cantidad}
      </td>
      <td>
      </td>
    </tr>`
  }


  contenidoHTML = contenidoHTML.replace("{{finca}}", finca)
  contenidoHTML = contenidoHTML.replace("{{tabla}}", tabla)


  return contenidoHTML
};
