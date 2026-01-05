

const express = require('express');
const router = express.Router();
const AssessmentController = require('./assessment.controller');
// Import your Middleware
const authenticateToken = require('../../middlewares/auth.middleware');

// Route to create an assessment (Now Protected)
router.post('/create', authenticateToken, AssessmentController.createAssessment);

module.exports = router;



