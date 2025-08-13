const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // For index.js

const app = express();

// ⚠️ Optional: Only use CORS in local dev
if (process.env.NODE_ENV === 'development') {
  app.use(cors());
}

app.use(express.json());

// Serve static files from /public (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Mount routes
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/categories', require('./routes/categories'));
  app.use('/api/visitors', require('./routes/visitors'));
  app.use('/api/stats', require('./routes/stats'));
  app.use('/api/contacts', require('./routes/contacts'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api', require('./routes/upload'));

// ✅ Fixed wildcard route for Express v5
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
