const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');

// GET /api/products - fetch all products with category name
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        p.Id,
        p.Name,
        p.Price,
        p.ImageURL,
        c.Name AS Category
      FROM Products p
      JOIN Categories c ON p.CategoryId = c.Id
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Server error: ' + err.message);
  }
});

// POST /api/products - add new product
router.post('/', async (req, res) => {
  try {
    const { name, price, image, category } = req.body;
    const pool = await poolPromise;

    const categoryResult = await pool.request()
      .input('category', category)
      .query('SELECT Id FROM Categories WHERE Name = @category');

    let categoryId;
    if (categoryResult.recordset.length > 0) {
      categoryId = categoryResult.recordset[0].Id;
    } else {
      const insertCategory = await pool.request()
        .input('name', category)
        .input('image', '')
        .query('INSERT INTO Categories (Name, ImageURL) OUTPUT INSERTED.Id VALUES (@name, @image)');
      categoryId = insertCategory.recordset[0].Id;
    }

    await pool.request()
      .input('name', name)
      .input('price', price)
      .input('image', image)
      .input('categoryId', categoryId)
      .query(`
        INSERT INTO Products (Name, Price, ImageURL, CategoryId)
        VALUES (@name, @price, @image, @categoryId)
      `);

    res.status(201).send('Product created');
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).send('Server error');
  }
});

// PUT /api/products/:id - update product
router.put('/:id', async (req, res) => {
  try {
    const { name, price, image, category } = req.body;
    const { id } = req.params;
    const pool = await poolPromise;

    const categoryResult = await pool.request()
      .input('category', category)
      .query('SELECT Id FROM Categories WHERE Name = @category');

    let categoryId;
    if (categoryResult.recordset.length > 0) {
      categoryId = categoryResult.recordset[0].Id;
    } else {
      const insertCategory = await pool.request()
        .input('name', category)
        .input('image', '')
        .query('INSERT INTO Categories (Name, ImageURL) OUTPUT INSERTED.Id VALUES (@name, @image)');
      categoryId = insertCategory.recordset[0].Id;
    }

    await pool.request()
      .input('id', id)
      .input('name', name)
      .input('price', price)
      .input('image', image)
      .input('categoryId', categoryId)
      .query(`
        UPDATE Products
        SET Name = @name, Price = @price, ImageURL = @image, CategoryId = @categoryId
        WHERE Id = @id
      `);

    res.send('Product updated');
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /api/products/:id - delete product
router.delete('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', req.params.id)
      .query('DELETE FROM Products WHERE Id = @id');
    res.send('Product deleted');
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
