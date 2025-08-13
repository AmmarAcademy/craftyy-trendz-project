// backend/routes/contacts.js
const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// POST /api/contacts
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !phone || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('name', sql.NVarChar(255), name)
      .input('email', sql.NVarChar(255), email)
      .input('phone', sql.NVarChar(50), phone)
      .input('subject', sql.NVarChar(255), subject)
      .input('message', sql.NVarChar(sql.MAX), message)
      .query(`
        INSERT INTO contacts (name, email, phone, subject, message)
        VALUES (@name, @email, @phone, @subject, @message)
      `);

    // Send email notification to store manager
    await transporter.sendMail({
      from: `"Craftyy Trendz Contact" <${process.env.MAIL_USER}>`,
      to: process.env.MANAGER_EMAIL,
      subject: `📩 New Contact Query: ${subject}`,
      text: `
New message received:

👤 Name: ${name}
📧 Email: ${email}
📱 Phone: ${phone}
📌 Subject: ${subject}
📝 Message:
${message}
      `
    });

    res.status(200).json({ success: true });
    console.log("📬 Email sent to:", process.env.MANAGER_EMAIL);
  } catch (err) {
    console.error('❌ Contact submission error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// GET /api/contacts
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT id, name, email, phone, subject, message, submitted_at FROM contacts ORDER BY submitted_at DESC');
    res.json(result.recordset); // send array of contact queries
  } catch (err) {
    console.error('❌ Error fetching contact queries:', err);
    res.status(500).json({ error: 'Server error fetching contact queries.' });
  }
});

module.exports = router;
