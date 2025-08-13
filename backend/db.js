// backend/db.js
const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // ✅

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '1433', 10), // fallback to 1433
  options: {
    encrypt: true,
    trustServerCertificate: false, // Use true for local development, false for production
    enableArithAbort: true // Recommended for Azure SQL Database
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ Connected to Azure SQL Server");
    return pool;
  })
  .catch(err => {
    console.error("❌ DB Connection Failed:", err);
  });

module.exports = { sql, poolPromise };
