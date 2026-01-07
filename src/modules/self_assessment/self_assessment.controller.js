const sequelize = require('../../config/database');
const { Op } = require('sequelize');


// Import Models
const Test = require('../tests/test.model');
const Question = require('../tests/question.model');
const TestQuestionMap = require('../tests/test_questions_map.model');


const GenerateController = {


    createFromExistingQuestions: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const studentId = req.user.user_id;


            // 1. GET DATA FROM RAW JSON BODY
            const { subjectId, topicId, difficulty, questionCount, duration } = req.body;


            if (!subjectId) {
                await t.rollback();
                return res.status(400).json({ isSuccess: false, message: "Subject ID is required." });
            }


            // 2. Build Filter Logic
            const whereClause = {
                subject_id: subjectId,
                difficulty_level: difficulty || 'medium'
            };


            // Handle Topic ID Logic (Support Array, Single, or 'all')
            if (topicId && topicId !== 'all') {
                if (Array.isArray(topicId)) {
                    whereClause.topic_id = { [Op.in]: topicId }; // Fetch specific list [6, 8]
                } else {
                    whereClause.topic_id = topicId; // Fetch single 6
                }
            }


            // 3. Fetch Random Questions from DB
            const questions = await Question.findAll({
                where: whereClause,
                order: sequelize.random(),
                limit: parseInt(questionCount) || 15,
                transaction: t
            });


            if (questions.length === 0) {
                await t.rollback();
                return res.status(404).json({
                    isSuccess: false,
                    message: "No existing questions found for this criteria. Try uploading a PDF first."
                });
            }


            // 4. Determine what to save in 'topic_id' column for the Test
            let storedTopicId = null;
            if (topicId && !Array.isArray(topicId) && topicId !== 'all') {
                storedTopicId = topicId;
            }


            // 5. Create Test Record
            const newTest = await Test.create({
                student_id: studentId,
                created_by: studentId,
                subject_id: subjectId,
                test_title: `Practice: ${difficulty} (${questions.length} Qs)`,
                test_type: 'self_assessment',
                class_grade: 0,
                duration_minutes: duration || 30,
                difficulty_level: difficulty,
                total_questions: questions.length,
                status: 'published',
                topic_id: storedTopicId,
                question_ids: questions.map(q => q.question_id)
            }, { transaction: t });


            // 6. Map Questions
            const mapEntries = questions.map(q => ({
                test_id: newTest.test_id,
                question_id: q.question_id
            }));


            await TestQuestionMap.bulkCreate(mapEntries, { transaction: t });
            await t.commit();


            return res.status(201).json({
                isSuccess: true,
                message: "Assessment generated successfully from existing questions.",
                data: { testId: newTest.test_id, questionCount: questions.length }
            });


        } catch (error) {
            await t.rollback();
            res.status(500).json({ isSuccess: false, message: error.message });
        }
    }
};


module.exports = GenerateController;




