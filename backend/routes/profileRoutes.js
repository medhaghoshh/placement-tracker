const express = require('express');
const router = express.Router();
const profile = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

router.put('/', authMiddleware, profile.updateProfile);

module.exports = router;
