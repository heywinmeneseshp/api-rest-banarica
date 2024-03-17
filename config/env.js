require('dotenv').config();

const env = {
  apiKey: process.env.API_KEY,
  secret: process.env.SECRET,
  email: process.env.EMAIL,
  password: process.env.PASSWORD,
};

module.exports = env;

