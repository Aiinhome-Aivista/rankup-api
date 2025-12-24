const sequelize = require('../../config/database');
const { QueryTypes } = require('sequelize');


// Import Question Model from the 'tests' module
const Question = require('../tests/question.model');


const SaveAnswerController = {


    saveAnswer: async (req, res) => {
        try {
            const { attemptId, questionId, selectedOption, timeSpent } = req.body;


            // 1. Validation
            if (!attemptId || !questionId) {
                return res.status(400).json({ isSuccess: false, message: "attemptId and questionId are required" });
            }


            // 2. Find Correct Answer
            const question = await Question.findOne({
                where: { question_id: questionId },
                attributes: ['correct_option']
            });


            if (!question) {
                return res.status(404).json({ isSuccess: false, message: "Question not found" });
            }


            // 3. Determine if Correct
            const isCorrect = (selectedOption === question.correct_option);
            const timeToAdd = parseInt(timeSpent) || 0;


            // 4. UPSERT Logic (Insert or Update)
            // We use raw SQL for efficiency and to handle the cumulative time addition safely
            await sequelize.query(
                `INSERT INTO student_responses
           (attempt_id, question_id, selected_option, is_correct, time_spent_seconds, created_at, updated_at)
         VALUES
           (:attemptId, :questionId, :selectedOption, :isCorrect, :timeSpent, NOW(), NOW())
         ON CONFLICT (attempt_id, question_id)
         DO UPDATE SET
           selected_option = EXCLUDED.selected_option,
           is_correct = EXCLUDED.is_correct,
           -- Add new time to existing time (Cumulative)
           time_spent_seconds = student_responses.time_spent_seconds + EXCLUDED.time_spent_seconds,
           updated_at = NOW()`,
                {
                    replacements: {
                        attemptId,
                        questionId,
                        selectedOption,
                        isCorrect,
                        timeSpent: timeToAdd
                    },
                    type: QueryTypes.INSERT
                }
            );


            return res.json({
                statusCode: 200,
                isSuccess: true,
                message: "Answer saved successfully"
            });


        } catch (error) {
            console.error("Save Answer Error:", error);
            res.status(500).json({ isSuccess: false, message: error.message });
        }
    }
};


module.exports = SaveAnswerController;






