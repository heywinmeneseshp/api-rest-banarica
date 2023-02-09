const env = require('../config/env');
const db = require('../models');


class AuthService {

    async create(body) {
        await db.etiqueta.create(body)
        return body
    }

    async findTags() {
        return await db.etiqueta.findAll()
    }

    async findOne(consecutivo) {
        return await db.etiqueta.findOne({ where: { consecutivo } })
    }

    async updateTage(consecutivo, changes) {
        await db.etiqueta.update(changes, { where: { consecutivo } })
        return { mesagge: "La etiqueta ha sido actualizada" }
    }


}

module.exports = AuthService;
