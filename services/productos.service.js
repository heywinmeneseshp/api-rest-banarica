
const { faker } = require("@faker-js/faker");

class ProductosService {

  constructor() {
    this.productos = [];
    this.generate();
  }

  generate() {
    for (let i = 0; i < 5; i++) {
      this.productos.push({
        id: i,
        name: faker.commerce.productName(),
        id_categoria: faker.commerce.department(),
        id_proveedor: faker.company.companyName(),
        salida_sin_stock: faker.datatype.boolean(),
        serial: faker.datatype.boolean(),
        traslado: faker.datatype.boolean(),
        costo: parseInt(faker.commerce.price(), 10),
        habilitado: faker.datatype.boolean()
      });
    }
  }

  async create(data) {
    const ultimoProducto = this.productos[this.productos.length - 1]
    const productoNuevo = {
      id: ultimoProducto.id + 1,
      ...data
    }
    this.productos.push(productoNuevo)
    return productoNuevo
  }

  async find() {
    return this.productos
  }

  async findOne(id) {
    return this.productos.find(item => item.id == id);
  }

  async update(id, changes) {
    const index = this.productos.findIndex(item => item.id == id);
    if (index === -1) {
      throw new Error("El producto no se encuentra")
    }
    const producto = this.productos[index]
    this.productos[index] = {
      ...producto,
      ...changes
    };
    return this.productos[index];
  }

  async delete(id) {
    const index = this.productos.findIndex(item => item.id == id);
    if (index === -1) {
      throw new Error("El producto fue eliminado")
    }
    this.productos.splice(index, 1); //Eliminar en la posicion X una candidad de Y productos
    return { message: "El producto fue eliminado", id, }
  }

}

module.exports = ProductosService
