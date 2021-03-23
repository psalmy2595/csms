// config.js
const dotenv = require('dotenv');
dotenv.config();


module.exports = {
  smsApiKey: process.env.SMS_API_KEY,
  smsApiUsername: process.env.SMS_API_USERNAME,
  dbUrl: process.env.DB_URL,
  clientUrl: process.env.CLIENT_URL
};