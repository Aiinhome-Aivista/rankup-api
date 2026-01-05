const sequelize = require('../../config/database');
const { Op } = require('sequelize'); 
const Test = require('./test.model');
const Question = require('./question.model');
const TestQuestionMap = require('./test_questions_map.model');
const StudentProfile = require('../users/student_profile.model');
const User = require('../users/user.model');

const NotificationController = require('../notifications/notification.controller');

const AssessmentController = {

    createAssessment: async (req, res) => {
        const t = await sequelize.transaction();

        try {
            // 1. AUTH CHECK
            if (!req.user) {
                await t.rollback();
                return res.status(401).json({ isSuccess: false, message: "Unauthorized: Invalid Token" });
            }

            const { user_id, role } = req.user;
            const creatorId = user_id;

            const {
                subjectId, classGrade, testTitle, instructions,
                startDate, endDate, durationLimit, randomizeQuestions,
                antiCheatMode, allowedAttempts, difficulty, questionCount,
                status, assignType, studentIds, topicId
            } = req.body;

            console.log(`\n====== NEW ASSESSMENT (${role}) ======`);
            
            // -------------------------------------------------------------
            // 2. IDENTIFY TARGET STUDENTS (Based on Role)
            // -------------------------------------------------------------
            let targetStudentIds = [];

            // === SCENARIO A: PARENT (Restricted to own children) ===
            if (role === 'Parent') {
                // Fetch ALL children belonging to this parent
                const myChildren = await StudentProfile.findAll({
                    where: { parent_id: creatorId },
                    attributes: ['student_id', 'class_grade']
                });

                const myChildIds = myChildren.map(c => c.student_id);

                if (myChildIds.length === 0) {
                    await t.rollback();
                    return res.status(400).json({ isSuccess: false, message: "You have no linked children to assign tests to." });
                }

                if (assignType === 'specific') {
                    // VALIDATION: Ensure all requested IDs are actually their children
                    const invalidIds = studentIds.filter(id => !myChildIds.includes(id));
                    
                    if (invalidIds.length > 0) {
                        await t.rollback();
                        return res.status(403).json({ 
                            isSuccess: false, 
                            message: "Unauthorized: You are trying to assign a test to students who are not your children.",
                            invalidIds: invalidIds 
                        });
                    }
                    targetStudentIds = studentIds;

                } else if (assignType === 'all') {
                    // "All" for a parent means "All MY children in this grade"
                    targetStudentIds = myChildren
                        .filter(c => c.class_grade == classGrade) // Only match the test grade
                        .map(c => c.student_id);

                    if (targetStudentIds.length === 0) {
                        await t.rollback();
                        return res.status(400).json({ isSuccess: false, message: `You have no children in Grade ${classGrade}.` });
                    }
                }
            } 
            
            // === SCENARIO B: TEACHER / ADMIN (Global Access) ===
            else if (role === 'Teacher' || role === 'Admin') {
                
                if (assignType === 'specific') {
                    targetStudentIds = studentIds || [];
                } else {
                    // "All" means EVERY active student in this grade
                    const students = await StudentProfile.findAll({
                        where: { class_grade: classGrade },
                        include: [{ 
                            model: User, 
                            where: { is_active: 1, role: 'Student' }, 
                            attributes: [] 
                        }],
                        attributes: ['student_id']
                    });
                    targetStudentIds = students.map(s => s.student_id);
                }
            } else {
                await t.rollback();
                return res.status(403).json({ isSuccess: false, message: "Unauthorized Role" });
            }

            // Final Validation
            if (!targetStudentIds || targetStudentIds.length === 0) {
                await t.rollback();
                return res.status(404).json({ isSuccess: false, message: "No valid students found for assignment." });
            }

            console.log(`Step 1: Assigning to ${targetStudentIds.length} Students: [${targetStudentIds}]`);


            // -------------------------------------------------------------
            // 3. FETCH QUESTIONS (Single / Multiple / All Topics)
            // -------------------------------------------------------------
            const questionFilter = { 
                subject_id: subjectId, 
                class_grade: classGrade, 
                difficulty_level: difficulty 
            };

            // Topic Logic
            if (topicId && topicId !== 'all') {
                if (Array.isArray(topicId)) {
                    questionFilter.topic_id = { [Op.in]: topicId };
                } else {
                    questionFilter.topic_id = topicId;
                }
            }

            const questions = await Question.findAll({
                where: questionFilter,
                attributes: ['question_id'],
                order: sequelize.random(),
                limit: parseInt(questionCount),
                transaction: t
            });

            if (questions.length === 0) {
                await t.rollback();
                return res.status(404).json({ isSuccess: false, message: "Not enough questions found matching criteria." });
            }

            const questionIdsList = questions.map(q => q.question_id);
            console.log(`Step 2: Selected ${questionIdsList.length} Questions`);


            // -------------------------------------------------------------
            // 4. CREATE TESTS & MAPPINGS
            // -------------------------------------------------------------
            let allMapEntries = [];
            let createdTestIds = [];
            
            // Format topic for saving
            const savedTopicValue = Array.isArray(topicId) ? null : (topicId === 'all' ? null : topicId);

            for (const studentId of targetStudentIds) {
                const newTest = await Test.create({
                    student_id: studentId,
                    created_by: creatorId,
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
                    status: status || 'published',
                    topic_id: savedTopicValue,
                    question_ids: questionIdsList, // Store JSON array
                    test_type: role === 'Parent' ? 'parent_assigned' : 'admin_assigned' // Optional: track who assigned it
                }, { transaction: t });

                createdTestIds.push(newTest.test_id);

                const studentMapEntries = questionIdsList.map(qId => ({
                    test_id: newTest.test_id,
                    question_id: qId
                }));
                allMapEntries.push(...studentMapEntries);
            }

            if (allMapEntries.length > 0) {
                await TestQuestionMap.bulkCreate(allMapEntries, { transaction: t });
            }

            // -------------------------------------------------------------
            // 5. COMMIT & NOTIFY
            // -------------------------------------------------------------
            await t.commit();
            console.log("====== DB TRANSACTION COMMITTED ======\n");

            try {
                const notificationTitle = "New Assessment Assigned!";
                const notificationBody = `New Test: ${testTitle}. Due by ${endDate}.`;

                NotificationController.sendToUsers(
                    targetStudentIds,
                    notificationTitle,
                    notificationBody,
                    { type: "new_assessment", subjectId: String(subjectId) }
                ).catch(err => console.error("Async Notification Error:", err.message));

            } catch (notifyError) {
                console.error("Notification Setup Error:", notifyError.message);
            }

            return res.status(201).json({
                statusCode: 201,
                isSuccess: true,
                message: `Assessment successfully assigned to ${targetStudentIds.length} students.`,
                data: {
                    assignedCount: targetStudentIds.length,
                    studentIds: targetStudentIds,
                    role: role
                }
            });

        } catch (error) {
            console.error(" ERROR:", error);
            if (!t.finished) {
                await t.rollback();
            }
            res.status(500).json({ isSuccess: false, message: error.message });
        }
    }
};

module.exports = AssessmentController;

