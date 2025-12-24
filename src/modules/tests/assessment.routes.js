const express = require('express');
const router = express.Router();
const AssessmentController = require('./assessment.controller');


// Route to create an assessment
router.post('/create', AssessmentController.createAssessment);


module.exports = router;



