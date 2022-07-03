
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");

class AvisosService {

  constructor() {
    this.avisos = [];
    this.generate();
  }

  generate() {
    this.avisos.push({
      id: "AV-1",
      descripcion: "lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.",
    });

  }

  async create(data) {
    const ultimoaviso = this.avisos[this.avisos.length-1]
    let id = "AV-1"
    if (ultimoaviso) {
      id = generarID("AV", ultimoaviso.id);
    }
    const avisoNuevo = {
      id: id,
      ...data
    }
    this.avisos.push(avisoNuevo)
    return avisoNuevo
  }

  async find() {
    return this.avisos
  }

  async findOne(id) {
    const aviso = this.avisos.find(item => item.id == id)
    if (!aviso) {
      throw boom.notFound('El aviso no existe')
    }
    return aviso;
  }

  async update(id, changes) {
    const index = this.avisos.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El aviso no existe')
    }
    const aviso = this.avisos[index]
    this.avisos[index] = {
      ...aviso,
      ...changes
    };
    return this.avisos[index];
  }

  async delete(id) {
    const index = this.avisos.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El aviso no existe')
    }
    this.avisos.splice(index, 1); //Eliminar en la posicion X una candidad de Y avisos
    return { message: "El aviso fue eliminado", id, }
  }

}

module.exports = AvisosService
