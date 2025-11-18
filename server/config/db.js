const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,

  connectionLimit: 20,          // Increase to handle concurrency
  waitForConnections: true,     // Critical
  queueLimit: 0,                // Unlimited queue
  enableKeepAlive: true,        // Prevents ETIMEDOUT
  keepAliveInitialDelay: 0,     // Start keep-alive immediately

  dateStrings: true,
  timezone: "Z",
});

module.exports = pool.promise();
