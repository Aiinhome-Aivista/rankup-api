const express = require('express');
const router = express.Router();
const SaveAnswerController = require('./save_answer.controller');
const authenticateToken = require('../../middlewares/auth.middleware');


// Route: POST /api/v1/student-assessment-save/save
// Token is REQUIRED here
router.post('/save', authenticateToken, SaveAnswerController.saveAnswer);


module.exports = router;