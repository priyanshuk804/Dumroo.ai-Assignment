const express = require('express');
const multer = require('multer');
const { uploadPDF, askQuestion } = require('../controllers/documentController');

const router = express.Router();

// Multer configuration for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), uploadPDF);
router.post('/ask', askQuestion);

module.exports = router;
