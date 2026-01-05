// const express = require('express');
// const router = express.Router();
// const AuthController = require('./auth.controller');

// router.post('/register', AuthController.register);
// router.post('/login', AuthController.login);

// module.exports = router;






const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');


// 1. Register
router.post('/register', AuthController.register);


// 2. Initiate Login (Sends OTP)
router.post('/login/initiate', AuthController.initiateLogin);


// 3. Verify OTP (Returns Token)
// CHANGE THIS LINE: Matches your Postman URL "/v1/auth/login/verify"
router.post('/login/verify', AuthController.verifyOTP);
// --- NEW DECRYPT ROUTE ---
router.post('/decrypt_token', AuthController.decryptTokenDebug);



module.exports = router;




