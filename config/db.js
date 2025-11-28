// backend/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASS = '',
  DB_NAME = 'nayash_crm',
} = process.env;

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// For compatibility with model code that expects promisePool.query(...)
const promisePool = pool; // pool already returns promise-based methods from mysql2/promise

// Optional helper: simple query wrapper that returns rows (like you had)
async function query(sql, params = []) {
  const [rows] = await promisePool.execute(sql, params);
  return rows;
}

module.exports = { pool, promisePool, query };
