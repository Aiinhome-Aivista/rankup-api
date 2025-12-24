const sequelize = require('../../config/database');
const Test = require('./test.model');
const Question = require('./question.model');
const TestQuestionMap = require('./test_questions_map.model');
const StudentProfile = require('../users/student_profile.model');
const User = require('../users/user.model');


const AssessmentController = {


    createAssessment: async (req, res) => {
        const t = await sequelize.transaction();


        try {
            const {
                adminId, subjectId, classGrade, testTitle, instructions,
                startDate, endDate, durationLimit, randomizeQuestions,
                antiCheatMode, allowedAttempts, difficulty, questionCount,
                status, assignType, studentIds, topicId
            } = req.body;


            console.log("\n====== STARTING NEW ASSESSMENT CREATION ======");


            // 1. Find Students
            let targetStudentIds = [];
            if (assignType === 'specific' && studentIds?.length > 0) {
                targetStudentIds = studentIds;
            } else {
                const students = await StudentProfile.findAll({
                    where: { class_grade: classGrade },
                    include: [{ model: User, where: { is_active: 1 }, attributes: [] }],
                    attributes: ['student_id']
                });
                targetStudentIds = students.map(s => s.student_id);
            }


            if (targetStudentIds.length === 0) {
                await t.rollback();
                return res.status(404).json({ isSuccess: false, message: "No active students found." });
            }
            console.log(`Step 1: Found ${targetStudentIds.length} Students (IDs: ${targetStudentIds})`);


            // 2. Find Questions
            const questionFilter = { subject_id: subjectId, class_grade: classGrade, difficulty_level: difficulty };
            if (topicId && topicId !== 'all') questionFilter.topic_id = topicId;


            const questions = await Question.findAll({
                where: questionFilter,
                attributes: ['question_id'],
                order: sequelize.random(),
                limit: parseInt(questionCount),
                transaction: t
            });


            if (questions.length === 0) {
                await t.rollback();
                return res.status(404).json({ isSuccess: false, message: "Not enough questions found." });
            }


            const questionIdsList = questions.map(q => q.question_id);
            console.log(`Step 2: Selected Questions: [${questionIdsList}]`);


            // 3. Create Tests & Prepare Map Data
            let allMapEntries = [];
            let createdTestIds = [];


            for (const studentId of targetStudentIds) {
                const newTest = await Test.create({
                    student_id: studentId,
                    created_by: adminId,
                    subject_id: subjectId,
                    class_grade: classGrade,
                    test_title: testTitle,
                    instructions: instructions,
                    start_date: startDate,
                    end_date: endDate,
                    duration_minutes: durationLimit,
                    is_randomized: randomizeQuestions ? true : false,
                    anti_cheat_mode: antiCheatMode ? true : false,
                    allowed_attempts: allowedAttempts,
                    difficulty_level: difficulty,
                    total_questions: questionIdsList.length,
                    status: status || 'published'
                }, { transaction: t });


                createdTestIds.push(newTest.test_id);


                // Map Questions to this NEW Test ID
                const studentMapEntries = questionIdsList.map(qId => ({
                    test_id: newTest.test_id,
                    question_id: qId
                }));


                allMapEntries.push(...studentMapEntries);
            }


            console.log(`Step 3: Created Tests IDs: [${createdTestIds}]`);
            console.log(`Step 4: Inserting ${allMapEntries.length} rows into test_questions_map...`);


            // 4. BULK INSERT into Map Table
            if (allMapEntries.length > 0) {
                await TestQuestionMap.bulkCreate(allMapEntries, { transaction: t });
                console.log("✅ Map Insertion Successful");
            }


            await t.commit();
            console.log("====== FINISHED ======\n");


            return res.json({
                statusCode: 200,
                isSuccess: true,
                message: `Assessment assigned to ${targetStudentIds.length} students.`,
                data: {
                    assignedStudents: targetStudentIds,
                    createdTestIds: createdTestIds,
                    insertedMapRows: allMapEntries.length // Should be (Students * Questions)
                }
            });


        } catch (error) {
            await t.rollback();
            console.error("❌ ERROR:", error);
            res.status(500).json({ isSuccess: false, message: error.message });
        }
    }
};


module.exports = AssessmentController;



