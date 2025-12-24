const sequelize = require('../../config/database');
const { QueryTypes } = require('sequelize');
const TestAttempt = require('../tests/test_attempt.model');
const Test = require('../tests/test.model');
const User = require('../users/user.model');


// ============================================================
// ✅ FIX: DEFINE ASSOCIATIONS HERE (Before using them)
// ============================================================
// Tell Sequelize that 'student_id' in TestAttempt points to User
TestAttempt.belongsTo(User, { foreignKey: 'student_id', as: 'student' });


// Tell Sequelize that 'test_id' in TestAttempt points to Test
TestAttempt.belongsTo(Test, { foreignKey: 'test_id', as: 'test' });
// ============================================================


const SubmitTestController = {


    submitTest: async (req, res) => {
        try {
            const { attemptId } = req.body;


            if (!attemptId) {
                return res.status(400).json({ isSuccess: false, message: "attemptId is required" });
            }


            // 2. Fetch Attempt Details
            // Now this 'include' will work because we defined the associations above
            const attempt = await TestAttempt.findOne({
                where: { attempt_id: attemptId },
                include: [
                    {
                        model: User,
                        as: 'student',
                        attributes: ['user_id', 'full_name']
                    },
                    {
                        model: Test,
                        as: 'test',
                        attributes: ['test_id', 'total_questions', 'status']
                    }
                ]
            });


            if (!attempt) {
                return res.status(404).json({ isSuccess: false, message: "Test Attempt not found" });
            }


            // 3. Calculate Stats from Student Responses
            const stats = await sequelize.query(
                `SELECT
            COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_count,
            COUNT(response_id) as answered_count,
            COALESCE(SUM(time_spent_seconds), 0) as total_time
         FROM student_responses
         WHERE attempt_id = :attemptId`,
                {
                    replacements: { attemptId },
                    type: QueryTypes.SELECT
                }
            );


            // Handle cases where stats might be empty (though COUNT usually returns 0)
            const correctCount = stats[0] ? parseInt(stats[0].correct_count) : 0;
            const answeredCount = stats[0] ? parseInt(stats[0].answered_count) : 0;
            const totalTime = stats[0] ? parseInt(stats[0].total_time) : 0;


            // 4. Calculate Final Score
            // Use data from the 'attempt' object we fetched in Step 2
            const totalQuestions = attempt.test ? attempt.test.total_questions : 0;
            const studentName = attempt.student ? attempt.student.full_name : "Unknown";
            const studentId = attempt.student ? attempt.student.user_id : null;
            const testId = attempt.test ? attempt.test.test_id : null;


            let finalScore = 0.00;
            if (totalQuestions > 0) {
                finalScore = (correctCount / totalQuestions) * 100.0;
            }
            finalScore = parseFloat(finalScore.toFixed(2));


            // 5. Update Tables


            // Update Attempt
            await TestAttempt.update({
                score_obtained: finalScore,
                time_taken_seconds: totalTime,
                completed_at: new Date()
            }, {
                where: { attempt_id: attemptId }
            });


            // Update Test Status (Optional - strictly based on your requirement)
            if (testId) {
                await Test.update({ status: 'completed' }, { where: { test_id: testId } });
            }


            // 6. Return Data
            return res.status(200).json({
                statuscode: 200,
                isSuccess: true,
                message: "Test Submitted Successfully",
                data: {
                    attemptId: attemptId,
                    studentId: studentId,
                    studentName: studentName,
                    totalAnswered: answeredCount,
                    correctAnswers: correctCount,
                    score: finalScore,
                    totalQuestions: totalQuestions
                }
            });


        } catch (error) {
            console.error("Submit Test Error:", error);
            res.status(500).json({ isSuccess: false, message: "Failed to submit test", data: error.message });
        }
    }
};


module.exports = SubmitTestController;






