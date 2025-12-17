const express = require('express');
const router = express.Router();
const AssessmentController = require('./assessment.controller');

// Note: Add auth middleware here when ready (e.g., keycloak.protect())

router.post('/subjects', AssessmentController.createSubject);
router.post('/topics', AssessmentController.createTopic);
router.post('/questions', AssessmentController.createQuestion);
router.post('/tests', AssessmentController.createTest);
router.post('/tests/:testId/questions', AssessmentController.addQuestionsToTest);
router.get('/tests/:testId', AssessmentController.getTest);

module.exports = router;