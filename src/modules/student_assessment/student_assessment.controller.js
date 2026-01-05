// const sequelize = require('../../config/database');
// const { QueryTypes } = require('sequelize');


// // Import Models from the 'tests' module
// const Test = require('../tests/test.model');
// const TestAttempt = require('../tests/test_attempt.model');
// const Question = require('../tests/question.model');


// const StudentAssessmentController = {


//     // =======================================================
//     // START ASSESSMENT
//     // =======================================================
//     startAssessment: async (req, res) => {
//         try {
//             const { studentId, testId } = req.body;


//             if (!studentId || !testId) {
//                 return res.status(400).json({ isSuccess: false, message: "studentId and testId are required" });
//             }


//             // 1. Check for Existing Attempt
//             const existingAttempt = await TestAttempt.findOne({
//                 where: { test_id: testId, student_id: studentId }
//             });


//             // --- SCENARIO 1: TEST ALREADY SUBMITTED ---
//             if (existingAttempt && existingAttempt.completed_at) {
//                 return res.status(403).json({
//                     statusCode: 403,
//                     isSuccess: false,
//                     message: "You have already attempted this test.",
//                     data: {
//                         attempt_id: existingAttempt.attempt_id,
//                         completed: true,
//                         score: existingAttempt.score_obtained
//                     }
//                 });
//             }


//             // --- FETCH QUESTIONS (Common Logic) ---
//             const questions = await sequelize.query(
//                 `SELECT
//             q.question_id, q.question_text,
//             q.option_a, q.option_b, q.option_c, q.option_d,
//             q.has_image, q.diagram_url
//          FROM test_questions_map tqm
//          JOIN questions q ON tqm.question_id = q.question_id
//          WHERE tqm.test_id = :testId`,
//                 {
//                     replacements: { testId },
//                     type: QueryTypes.SELECT
//                 }
//             );


//             // --- SCENARIO 2: RESUME TEST ---
//             if (existingAttempt && !existingAttempt.completed_at) {
//                 return res.json({
//                     statusCode: 200,
//                     isSuccess: true,
//                     message: "Resuming Test...",
//                     data: {
//                         attempt_id: existingAttempt.attempt_id,
//                         questions: questions,
//                         is_resume: true
//                     }
//                 });
//             }


//             // --- SCENARIO 3: START NEW TEST ---
//             const newAttempt = await TestAttempt.create({
//                 test_id: testId,
//                 student_id: studentId,
//                 start_time: new Date()
//             });


//             // Update test status (Optional logic)
//             await Test.update({ status: 'in_progress' }, { where: { test_id: testId } });


//             return res.json({
//                 statusCode: 200,
//                 isSuccess: true,
//                 message: "New Test Started",
//                 data: {
//                     attempt_id: newAttempt.attempt_id,
//                     questions: questions,
//                     is_resume: false
//                 }
//             });


//         } catch (error) {
//             console.error("Start Test Error:", error);
//             res.status(500).json({ isSuccess: false, message: error.message });
//         }
//     }
// };


// module.exports = StudentAssessmentController;



const sequelize = require('../../config/database');
const { QueryTypes } = require('sequelize');

// Import Models from the 'tests' module
const Test = require('../tests/test.model');
const TestAttempt = require('../tests/test_attempt.model');
const Question = require('../tests/question.model');

const StudentAssessmentController = {

    // =======================================================
    // START ASSESSMENT
    // =======================================================
    startAssessment: async (req, res) => {
        try {
            // 1. GET STUDENT ID FROM TOKEN
            // The auth middleware attaches the decoded token to req.user
            const studentId = req.user.user_id;

            // 2. GET TEST ID FROM BODY
            const { testId } = req.body;

            if (!studentId) {
                return res.status(401).json({ isSuccess: false, message: "Unauthorized: User not identified." });
            }

            if (!testId) {
                return res.status(400).json({ isSuccess: false, message: "testId is required" });
            }

            // 3. Check for Existing Attempt
            const existingAttempt = await TestAttempt.findOne({
                where: { test_id: testId, student_id: studentId }
            });

            // --- SCENARIO 1: TEST ALREADY SUBMITTED ---
            if (existingAttempt && existingAttempt.completed_at) {
                return res.status(403).json({
                    statusCode: 403,
                    isSuccess: false,
                    message: "You have already attempted this test.",
                    data: {
                        attempt_id: existingAttempt.attempt_id,
                        completed: true,
                        score: existingAttempt.score_obtained
                    }
                });
            }

            // --- FETCH QUESTIONS (Common Logic) ---
            const questions = await sequelize.query(
                `SELECT
            q.question_id, q.question_text,
            q.option_a, q.option_b, q.option_c, q.option_d,
            q.has_image, q.diagram_url
         FROM test_questions_map tqm
         JOIN questions q ON tqm.question_id = q.question_id
         WHERE tqm.test_id = :testId`,
                {
                    replacements: { testId },
                    type: QueryTypes.SELECT
                }
            );

            // --- SCENARIO 2: RESUME TEST ---
            if (existingAttempt && !existingAttempt.completed_at) {
                return res.json({
                    statusCode: 200,
                    isSuccess: true,
                    message: "Resuming Test...",
                    data: {
                        attempt_id: existingAttempt.attempt_id,
                        questions: questions,
                        is_resume: true
                    }
                });
            }

            // --- SCENARIO 3: START NEW TEST ---
            const newAttempt = await TestAttempt.create({
                test_id: testId,
                student_id: studentId,
                start_time: new Date()
            });

            // Update test status (Optional logic)
            await Test.update({ status: 'in_progress' }, { where: { test_id: testId } });

            return res.json({
                statusCode: 200,
                isSuccess: true,
                message: "New Test Started",
                data: {
                    attempt_id: newAttempt.attempt_id,
                    questions: questions,
                    is_resume: false
                }
            });

        } catch (error) {
            console.error("Start Test Error:", error);
            res.status(500).json({ isSuccess: false, message: error.message });
        }
    }
};

module.exports = StudentAssessmentController;