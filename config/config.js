require('dotenv').config();
const mysql2 = require('mysql2');

const config = {
  "development": {
    "username": process.env.DATABASE_DEV_USERNAME || "crakenco_heywin",
    "password": process.env.DATABASE_DEV_PASSWORD || "3115849539marce.",
    "database": process.env.DATABASE_DEV_NAME || "crakenco_gestor_logistico",
    "host": process.env.DATABASE_DEV_HOST || "host47.latinoamericahosting.com",
    "dialect": "mysql",
    "dialectModule": mysql2
  },
  "test": {
    "dialect": "sqlite",
    "storage": "./database.sqlite3"
  },
  "production": {
    "username": process.env.DATABASE_USERNAME,
    "password": process.env.DATABASE_PASSWORD,
    "database": process.env.DATABASE_NAME,
    "host": process.env.DATABASE_HOST,
    "dialect": "mysql",
    "dialectModule": mysql2
  }
}

module.exports = config;
