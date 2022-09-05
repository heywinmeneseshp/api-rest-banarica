const fs = require("fs");
let templatePedido = require.resolve("./html/pedido.html")

const PedidosService = require('../services/pedidos.service');
const service = new PedidosService()
let contenidoHTML = fs.readFileSync(templatePedido, 'utf-8')

module.exports = async (cons_pedido) => {

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
