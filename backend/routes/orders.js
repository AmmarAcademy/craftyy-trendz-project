const express = require('express');
const router = express.Router();
const sql = require('mssql');
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
  const { customer, cart } = req.body;

  if (!customer || !cart || cart.length === 0) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  try {
    const { poolPromise } = require('../db'); // adjust path as needed
    const pool = await poolPromise;

    // ✅ Calculate total
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    console.log("📧 Customer email:", customer.email); // debugging

    // ✅ Insert into Orders table
    const orderResult = await pool.request()
      .input('CustomerName', sql.NVarChar, customer.name)
      .input('Address', sql.NVarChar, customer.address)
      .input('Landmark', sql.NVarChar, customer.landmark || '')
      .input('City', sql.NVarChar, customer.city)
      .input('Pincode', sql.NVarChar, customer.pincode)
      .input('Phone', sql.NVarChar, customer.phone)
      .input('Total', sql.Decimal(10, 2), total)
      .input('Email', sql.NVarChar, customer.email)
      .query(`
        INSERT INTO Orders (CustomerName, Address, Landmark, City, Pincode, Phone, Total, Email)
        OUTPUT INSERTED.Id
        VALUES (@CustomerName, @Address, @Landmark, @City, @Pincode, @Phone, @Total, @Email)
      `);

    const orderId = orderResult.recordset[0].Id;

    // ✅ Insert into OrderItems
    for (const item of cart) {
      await pool.request()
        .input('orderId', sql.Int, orderId)
        .input('productName', sql.NVarChar, item.name)
        .input('subtotal', sql.Decimal(10, 2), item.price * item.quantity)
        .input('quantity', sql.Int, item.quantity)
        .query(`
          INSERT INTO OrderItems (OrderID, ProductName, Subtotal, Quantity)
          VALUES (@orderId, @productName, @subtotal, @quantity)
        `);
    }

    // ✅ Send confirmation email
  
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const itemsText = cart.map(i =>
      `• ${i.name} (x${i.quantity}) - ₹${(i.price * i.quantity).toFixed(2)}`
    ).join('\n');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customer.email,
      subject: 'Craftyy Trendz - Order Confirmation',
      text: `Hi ${customer.name},\n\nThank you for your order! Here are the details:\n\n${itemsText}\n\nTotal: ₹${total.toFixed(2)}\n\nShipping to:\n${customer.address}, ${customer.landmark}, ${customer.city} - ${customer.pincode}\nPhone: ${customer.phone}\n\nWe’ll be in touch shortly!\n\n– Craftyy Trendz`
    };

    await transporter.sendMail(mailOptions);
    console.log("📨 Email sent to:", customer.email);

    // ✅ Send notification to store owner
    const ownerEmailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.MANAGER_EMAIL,
      subject: `🛒 New Order Received - Order ID: ${orderId}`,
      text: `Hello Craftyy Trendz,\n\nA new order has been received:\n\nOrder ID: ${orderId}\nCustomer: ${customer.name}\nEmail: ${customer.email}\nPhone: ${customer.phone}\n\nItems:\n${itemsText}\n\nTotal: ₹${total.toFixed(2)}\n\nShipping Address:\n${customer.address}, ${customer.landmark}, ${customer.city} - ${customer.pincode}\n\nCheck your dashboard for full details.`
    };
    
    try {
      await transporter.sendMail(ownerEmailOptions);
      console.log("📬 Email sent to:", process.env.MANAGER_EMAIL);
    } catch (err) {
      console.error("📛 Failed to send store email:", err);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('🔥 Order processing error:', error.stack || error.message || error);
    res.status(500).json({ error: 'Failed to place order', details: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { poolPromise } = require('../db');
    const pool = await poolPromise;

    // Fetch all orders
    const orderResult = await pool.request().query(`
      SELECT Id, CustomerName, Email, Total AS TotalAmount FROM Orders ORDER BY Id DESC
    `);

    const orders = orderResult.recordset;

    // Fetch all order items
    const itemResult = await pool.request().query(`
      SELECT OrderId, ProductName, Quantity, Subtotal FROM OrderItems
    `);

    const items = itemResult.recordset;

    // Group items under each order
    const ordersWithItems = orders.map(order => ({
      ...order,
      Items: items.filter(i => i.OrderId === order.Id)
    }));

    res.json(ordersWithItems);
  } catch (err) {
    console.error('🔥 Failed to fetch orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;
