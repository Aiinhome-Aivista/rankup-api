const express = require('express');
const router = express.Router();
const AIRemedialController = require('./AIRemedial.controller');
const authMiddleware = require('../../middlewares/auth.middleware'); // Ensure correct path

// Route: POST /api/v1/assessment/generate-ai-test
router.post(
    '/generate_ai_test', 
    authMiddleware, 
    AIRemedialController.generateAdaptiveTest
);

module.exports = router;
