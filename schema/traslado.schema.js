const Joi = require('joi');

const transportadora = Joi.string().min(2);
const conductor = Joi.string().max(150);
const vehiculo = Joi.string().min(5);
const origen = Joi.string().min(3);
const destino = Joi.string().min(3);
const estado = Joi.string();
const semana = Joi.string().min(4);

const realizarTraslado = Joi.object({
      transportadora: transportadora.required(),
      conductor: conductor.required(),
      vehiculo: vehiculo.required(),
      origen: origen.required(),
      destino: destino.required(),
      estado: estado.required(),
      semana: semana.required()
});

const modificarTraslado = Joi.object({
  transportadora: transportadora,
  conductor: conductor,
  vehiculo: vehiculo,
  origen: origen,
  destino: destino,
  estado: estado,
  semana: semana
});

const recibirTraslado = Joi.object({
      estado: estado.required()
});

module.exports = { realizarTraslado, recibirTraslado, modificarTraslado };
