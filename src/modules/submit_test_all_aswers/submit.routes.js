const express = require('express');
const router = express.Router();
const SubmitTestController = require('./submit.controller');
const authenticateToken = require('../../middlewares/auth.middleware');


// Route: POST /api/v1/submit-test/submit
router.post('/submit', authenticateToken, SubmitTestController.submitTest);


module.exports = router;



