const express = require('express');
const router = express.Router();
const StudentController = require('./student.controller');


const authMiddleware = require('../../middlewares/auth.middleware'); 

// POST API: Fetch students based on test criteria
router.post(
    '/fetch_by_test_criteria', 
    authMiddleware, 
    StudentController.getStudentsBySubjectAndGrade
);

module.exports = router;
