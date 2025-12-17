const express = require('express');
const router = express.Router();
const AssessmentController = require('./assessment.controller');
const authMiddleware = require('../../middlewares/auth.middleware'); 

// Route to create an assessment (token required)
router.post('/create', authMiddleware, AssessmentController.createAssessment);

// Route to create an assessment
router.post('/create', AssessmentController.createAssessment);

module.exports = router;