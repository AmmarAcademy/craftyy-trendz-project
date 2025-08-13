const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');

// GET /api/categories - fetch all categories
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Categories');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).send('Server error');
  }
});

// POST /api/categories - add category
router.post('/', async (req, res) => {
  try {
    const { name, image } = req.body;
    const pool = await poolPromise;

    const existing = await pool.request()
      .input('name', name)
      .query('SELECT * FROM Categories WHERE Name = @name');

    if (existing.recordset.length > 0) {
      return res.status(400).send('Category already exists');
    }

    await pool.request()
      .input('name', name)
      .input('image', image)
      .query('INSERT INTO Categories (Name, ImageURL) VALUES (@name, @image)');

    res.status(201).send('Category added');
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).send('Server error');
  }
});

// PUT /api/categories/:id - update category
router.put('/:id', async (req, res) => {
  try {
    const { name, image } = req.body;
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input('id', id)
      .input('name', name)
      .input('image', image)
      .query(`
        UPDATE Categories
        SET Name = @name, ImageURL = @image
        WHERE Id = @id
      `);

    res.send('Category updated');
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /api/categories/:id - delete category
router.delete('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', req.params.id)
      .query('DELETE FROM Categories WHERE Id = @id');
    res.send('Category deleted');
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
