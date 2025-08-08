import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: "S9867867878$#@4email",
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

export default pool.promise();
