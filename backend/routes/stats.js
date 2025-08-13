// routes/stats.js
const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;

    const productResult = await pool.request().query('SELECT COUNT(*) AS Total FROM Products');
    const categoryResult = await pool.request().query('SELECT COUNT(*) AS Total FROM Categories');
    const orderResult = await pool.request().query('SELECT COUNT(*) AS Total FROM Orders');
    const visitorResult = await pool.request().query('SELECT COUNT(*) AS Total FROM Visitors');

    res.json({
      totalProducts: productResult.recordset[0].Total,
      totalCategories: categoryResult.recordset[0].Total,
      totalOrders: orderResult.recordset[0].Total,
      totalVisitors: visitorResult.recordset[0].Total
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
