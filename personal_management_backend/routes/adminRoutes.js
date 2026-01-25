const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// @route   GET /admin
// @desc    Admin dashboard
router.get('/', adminController.dashboard);

module.exports = router;
