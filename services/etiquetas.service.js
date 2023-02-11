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

    async findOne(id) {
        return await db.etiqueta.findOne({ where: { id } })
    }

    async updateTage(id, changes) {
        await db.etiqueta.update(changes, { where: { id } })
        return { mesagge: "La etiqueta ha sido actualizada" }
    }


}

module.exports = AuthService;
