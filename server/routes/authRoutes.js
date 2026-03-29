const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Multer setup for receipt upload
const { upload } = require('../config/cloudinaryConfig');

// Routes
router.post('/register', upload.single('receipt'), authController.registerStudent);
router.post('/register-admin', authController.registerAdmin);
router.post('/login', authController.login);

module.exports = router;
