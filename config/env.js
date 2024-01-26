require('dotenv').config();

const env = {
  apiKey: process.env.API_KEY || "2024",
  secret: process.env.SECRET || "2024",
  email: process.env.EMAIL || "meneses@craken.com.co",
  password: process.env.PASSWORD || "0349",
};

module.exports = env;
