const express = require('express');
const router = express.Router();
const StudentTestsController = require('./get_student_tests.controller');
const authenticateToken = require('../../middlewares/auth.middleware');


// Endpoint: POST /v1/student-tests/list
router.post('/list', authenticateToken, StudentTestsController.getTestsByStudent);


module.exports = router;




