const express = require('express');
const router = express.Router();
const LoginController = require('./login.controller');

// Step 1: Validate Password -> Send OTP
router.post('/initiate', LoginController.initiateLogin);

// Step 2: Validate OTP -> Return Token
router.post('/verify', LoginController.completeLogin);

module.exports = router;