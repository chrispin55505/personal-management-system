const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// @route   POST /users/register
// @desc    Register a new user
router.post('/register', userController.register);

// @route   POST /users/login
// @desc    Login a user
router.post('/login', userController.login);

module.exports = router;
