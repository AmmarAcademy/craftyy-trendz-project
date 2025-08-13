const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../db');

// 🧠 Optional: Use req.headers['x-forwarded-for'] if behind a proxy
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] || 
    req.connection?.remoteAddress || 
    req.ip || 
    'unknown'
  );
}

router.post('/', async (req, res) => {
  const ip = getClientIP(req);
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('ip', sql.NVarChar, ip)
      .query('INSERT INTO Visitors (IPAddress) VALUES (@ip)');
    res.status(200).json({ message: 'Visitor tracked', ip });
  } catch (err) {
    console.error('❌ Visitor tracking failed:', err.message);
    res.status(500).json({ error: 'Error tracking visitor' });
  }
});

module.exports = router;
