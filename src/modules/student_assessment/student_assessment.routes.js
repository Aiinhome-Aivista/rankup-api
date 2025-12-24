const express = require('express');
const router = express.Router();
const StudentAssessmentController = require('./student_assessment.controller');
const authenticateToken = require('../../middlewares/auth.middleware');


// Route: POST /api/v1/student-assessment/start
router.post('/start', authenticateToken, StudentAssessmentController.startAssessment);


module.exports = router;