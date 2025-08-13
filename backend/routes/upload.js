const express = require('express');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const router = express.Router();

// Azure config
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Setup multer (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload Endpoint
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const blobName = uuidv4() + path.extname(req.file.originalname);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(req.file.buffer, req.file.size, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype }
    });

    const blobUrl = blockBlobClient.url;

    res.status(200).json({ success: true, url: blobUrl });
  } catch (err) {
    console.error('Azure Upload Error:', err);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

module.exports = router;
