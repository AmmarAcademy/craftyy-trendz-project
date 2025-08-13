const express = require('express');
const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../db');

const router = express.Router();

// Register admin user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await poolPromise;

    const checkUser = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT * FROM admin_users WHERE username = @username');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Admin user already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.request()
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, hashedPassword)
      .query('INSERT INTO admin_users (username, password) VALUES (@username, @password)');

    res.status(201).json({ success: true, message: 'Admin user registered successfully' });

  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Login admin user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT * FROM admin_users WHERE username = @username');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    const user = result.recordset[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({ success: true, message: 'Login successful' });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

module.exports = router;
