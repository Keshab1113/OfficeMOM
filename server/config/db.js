const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: "S9867867878$#@4email", // better to move this into .env
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

module.exports = pool.promise();
