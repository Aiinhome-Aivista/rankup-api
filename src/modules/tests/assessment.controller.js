// const sequelize = require('../../config/database');
// const Test = require('./test.model');
// const Question = require('./question.model');
// const TestQuestionMap = require('./test_questions_map.model');
// const StudentProfile = require('../users/student_profile.model');
// const User = require('../users/user.model');

// // 1. IMPORT NOTIFICATION CONTROLLER
// const NotificationController = require('../notifications/notification.controller');

// const AssessmentController = {

//     createAssessment: async (req, res) => {
//         // Start Transaction
//         const t = await sequelize.transaction();

//         try {
//             const {
//                 adminId, subjectId, classGrade, testTitle, instructions,
//                 startDate, endDate, durationLimit, randomizeQuestions,
//                 antiCheatMode, allowedAttempts, difficulty, questionCount,
//                 status, assignType, studentIds, topicId
//             } = req.body;

//             console.log("\n====== STARTING NEW ASSESSMENT CREATION ======");

//             // -------------------------------------------------------------
//             // 1. Find Students
//             // -------------------------------------------------------------
//             let targetStudentIds = [];
//             if (assignType === 'specific' && studentIds?.length > 0) {
//                 targetStudentIds = studentIds;
//             } else {
//                 const students = await StudentProfile.findAll({
//                     where: { class_grade: classGrade },
//                     include: [{ model: User, where: { is_active: 1 }, attributes: [] }],
//                     attributes: ['student_id']
//                 });
//                 targetStudentIds = students.map(s => s.student_id);
//             }

//             if (targetStudentIds.length === 0) {
//                 await t.rollback();
//                 return res.status(404).json({ isSuccess: false, message: "No active students found." });
//             }
//             console.log(`Step 1: Found ${targetStudentIds.length} Students (IDs: ${targetStudentIds})`);

//             // -------------------------------------------------------------
//             // 2. Find Questions
//             // -------------------------------------------------------------
//             const questionFilter = { subject_id: subjectId, class_grade: classGrade, difficulty_level: difficulty };
//             if (topicId && topicId !== 'all') questionFilter.topic_id = topicId;

//             const questions = await Question.findAll({
//                 where: questionFilter,
//                 attributes: ['question_id'],
//                 order: sequelize.random(),
//                 limit: parseInt(questionCount),
//                 transaction: t
//             });

//             if (questions.length === 0) {
//                 await t.rollback();
//                 return res.status(404).json({ isSuccess: false, message: "Not enough questions found." });
//             }

//             const questionIdsList = questions.map(q => q.question_id);
//             console.log(`Step 2: Selected Questions: [${questionIdsList}]`);

//             // -------------------------------------------------------------
//             // 3. Create Tests & Prepare Map Data
//             // -------------------------------------------------------------
//             let allMapEntries = [];
//             let createdTestIds = [];

//             for (const studentId of targetStudentIds) {
//                 const newTest = await Test.create({
//                     student_id: studentId,
//                     created_by: adminId,
//                     subject_id: subjectId,
//                     class_grade: classGrade,
//                     test_title: testTitle,
//                     instructions: instructions,
//                     start_date: startDate,
//                     end_date: endDate,
//                     duration_minutes: durationLimit,
//                     is_randomized: randomizeQuestions ? true : false,
//                     anti_cheat_mode: antiCheatMode ? true : false,
//                     allowed_attempts: allowedAttempts,
//                     difficulty_level: difficulty,
//                     total_questions: questionIdsList.length,
//                     status: status || 'published'
//                 }, { transaction: t });

//                 createdTestIds.push(newTest.test_id);

//                 // Map Questions to this NEW Test ID
//                 const studentMapEntries = questionIdsList.map(qId => ({
//                     test_id: newTest.test_id,
//                     question_id: qId
//                 }));

//                 allMapEntries.push(...studentMapEntries);
//             }

//             console.log(`Step 3: Created Tests IDs: [${createdTestIds}]`);
//             console.log(`Step 4: Inserting ${allMapEntries.length} rows into test_questions_map...`);

//             // -------------------------------------------------------------
//             // 4. BULK INSERT into Map Table
//             // -------------------------------------------------------------
//             if (allMapEntries.length > 0) {
//                 await TestQuestionMap.bulkCreate(allMapEntries, { transaction: t });
//                 console.log(" Map Insertion Successful");
//             }

//             // -------------------------------------------------------------
//             // 5. COMMIT TRANSACTION (Save to DB)
//             // -------------------------------------------------------------
//             await t.commit();
//             console.log("====== DB TRANSACTION COMMITTED ======\n");

//             // =========================================================
//             //   NEW: SEND PUSH NOTIFICATION (Safe Block)
//             // =========================================================
//             // We use a separate try/catch here so notification failures 
//             // DO NOT crash the response or try to rollback the already-saved DB.
//             try {
//                 const notificationTitle = "New Assessment Assigned!";
//                 const notificationBody = `You have a new test: ${testTitle}. Due by ${endDate}.`;

//                 console.log("Triggering Push Notifications...");

//                 // Call the helper to send async (we don't await to keep response fast)
//                 NotificationController.sendToUsers(
//                     targetStudentIds,
//                     notificationTitle,
//                     notificationBody,
//                     { type: "new_assessment", subjectId: String(subjectId) }
//                 ).catch(err => console.error("Async Notification Error:", err.message));

//             } catch (notifyError) {
//                 console.error("Notification Setup Error:", notifyError.message);
//                 // Continue execution, do not throw error
//             }
//             // =========================================================

//             return res.json({
//                 statusCode: 200,
//                 isSuccess: true,
//                 message: `Assessment assigned to ${targetStudentIds.length} students.`,
//                 data: {
//                     assignedStudents: targetStudentIds,
//                     createdTestIds: createdTestIds,
//                     insertedMapRows: allMapEntries.length
//                 }
//             });

//         } catch (error) {
//             console.error(" ERROR:", error);

//             // Only rollback if the transaction is still active
//             // This prevents "Transaction cannot be rolled back" errors
//             if (!t.finished) {
//                 await t.rollback();
//             }

//             res.status(500).json({ isSuccess: false, message: error.message });
//         }
//     }
// };

// module.exports = AssessmentController;






// const sequelize = require('../../config/database');
// const { Op } = require('sequelize'); //  REQUIRED for Array filtering
// const Test = require('./test.model');
// const Question = require('./question.model');
// const TestQuestionMap = require('./test_questions_map.model');
// const StudentProfile = require('../users/student_profile.model');
// const User = require('../users/user.model');

// const NotificationController = require('../notifications/notification.controller');

// const AssessmentController = {

//     createAssessment: async (req, res) => {
//         // Start Transaction
//         const t = await sequelize.transaction();

//         try {
//             // 1. EXTRACT ADMIN ID FROM TOKEN
//             // The auth middleware must be used on the route for this to work
//             const adminId = req.user ? req.user.user_id : null;

//             if (!adminId) {
//                 await t.rollback();
//                 return res.status(401).json({ isSuccess: false, message: "Unauthorized: Invalid Token" });
//             }

//             const {
//                 subjectId, classGrade, testTitle, instructions,
//                 startDate, endDate, durationLimit, randomizeQuestions,
//                 antiCheatMode, allowedAttempts, difficulty, questionCount,
//                 status, assignType, studentIds, topicId
//             } = req.body;

//             console.log("\n====== STARTING NEW ASSESSMENT CREATION ======");

//             // -------------------------------------------------------------
//             // 2. Find Students
//             // -------------------------------------------------------------
//             let targetStudentIds = [];
//             if (assignType === 'specific' && studentIds?.length > 0) {
//                 targetStudentIds = studentIds;
//             } else {
//                 const students = await StudentProfile.findAll({
//                     where: { class_grade: classGrade },
//                     include: [{ model: User, where: { is_active: 1 }, attributes: [] }],
//                     attributes: ['student_id']
//                 });
//                 targetStudentIds = students.map(s => s.student_id);
//             }

//             if (targetStudentIds.length === 0) {
//                 await t.rollback();
//                 return res.status(404).json({ isSuccess: false, message: "No active students found." });
//             }
//             console.log(`Step 1: Found ${targetStudentIds.length} Students (IDs: ${targetStudentIds})`);

//             // -------------------------------------------------------------
//             // 3. Find Questions (Updated for Topic Logic)
//             // -------------------------------------------------------------
//             const questionFilter = {
//                 subject_id: subjectId,
//                 class_grade: classGrade,
//                 difficulty_level: difficulty
//             };

//             //  LOGIC FOR TOPIC ID (Single, Multiple, or All)
//             if (topicId && topicId !== 'all') {
//                 if (Array.isArray(topicId)) {
//                     // If Array (e.g. [1, 2]): WHERE topic_id IN (1, 2)
//                     questionFilter.topic_id = { [Op.in]: topicId };
//                 } else {
//                     // If Single (e.g. 5): WHERE topic_id = 5
//                     questionFilter.topic_id = topicId;
//                 }
//             }
//             // If topicId is 'all' or null, we just don't add the filter, getting all topics.

//             const questions = await Question.findAll({
//                 where: questionFilter,
//                 attributes: ['question_id'],
//                 order: sequelize.random(),
//                 limit: parseInt(questionCount),
//                 transaction: t
//             });

//             if (questions.length === 0) {
//                 await t.rollback();
//                 return res.status(404).json({ isSuccess: false, message: "Not enough questions found matching criteria." });
//             }

//             const questionIdsList = questions.map(q => q.question_id);
//             console.log(`Step 2: Selected Questions: [${questionIdsList}]`);

//             // -------------------------------------------------------------
//             // 4. Create Tests & Prepare Map Data
//             // -------------------------------------------------------------
//             let allMapEntries = [];
//             let createdTestIds = [];

//             for (const studentId of targetStudentIds) {
//                 const newTest = await Test.create({
//                     student_id: studentId,
//                     created_by: adminId, //  Uses ID from Token
//                     subject_id: subjectId,
//                     class_grade: classGrade,
//                     test_title: testTitle,
//                     instructions: instructions,
//                     start_date: startDate,
//                     end_date: endDate,
//                     duration_minutes: durationLimit,
//                     is_randomized: randomizeQuestions ? true : false,
//                     anti_cheat_mode: antiCheatMode ? true : false,
//                     allowed_attempts: allowedAttempts,
//                     difficulty_level: difficulty,
//                     total_questions: questionIdsList.length,
//                     status: status || 'published',
//                     // Save the topic selection for reference (convert array to string if needed or store as JSON)
//                     topic_id: Array.isArray(topicId) ? null : (topicId === 'all' ? null : topicId)
//                 }, { transaction: t });

//                 createdTestIds.push(newTest.test_id);

//                 const studentMapEntries = questionIdsList.map(qId => ({
//                     test_id: newTest.test_id,
//                     question_id: qId
//                 }));

//                 allMapEntries.push(...studentMapEntries);
//             }

//             console.log(`Step 3: Created Tests IDs: [${createdTestIds}]`);
//             console.log(`Step 4: Inserting ${allMapEntries.length} rows into test_questions_map...`);

//             if (allMapEntries.length > 0) {
//                 await TestQuestionMap.bulkCreate(allMapEntries, { transaction: t });
//                 console.log(" Map Insertion Successful");
//             }

//             // -------------------------------------------------------------
//             // 5. COMMIT TRANSACTION
//             // -------------------------------------------------------------
//             await t.commit();
//             console.log("====== DB TRANSACTION COMMITTED ======\n");

//             // -------------------------------------------------------------
//             // 6. Push Notification
//             // -------------------------------------------------------------
//             try {
//                 const notificationTitle = "New Assessment Assigned!";
//                 const notificationBody = `You have a new test: ${testTitle}. Due by ${endDate}.`;

//                 NotificationController.sendToUsers(
//                     targetStudentIds,
//                     notificationTitle,
//                     notificationBody,
//                     { type: "new_assessment", subjectId: String(subjectId) }
//                 ).catch(err => console.error("Async Notification Error:", err.message));

//             } catch (notifyError) {
//                 console.error("Notification Setup Error:", notifyError.message);
//             }

//             return res.json({
//                 statusCode: 200,
//                 isSuccess: true,
//                 message: `Assessment assigned to ${targetStudentIds.length} students.`,
//                 data: {
//                     assignedStudents: targetStudentIds,
//                     createdTestIds: createdTestIds
//                 }
//             });

//         } catch (error) {
//             console.error(" ERROR:", error);
//             if (!t.finished) {
//                 await t.rollback();
//             }
//             res.status(500).json({ isSuccess: false, message: error.message });
//         }
//     }
// };

// module.exports = AssessmentController;


const sequelize = require('../../config/database');
const { Op } = require('sequelize');
const Test = require('./test.model');
const Question = require('./question.model');
const TestQuestionMap = require('./test_questions_map.model');
const StudentProfile = require('../users/student_profile.model');
const User = require('../users/user.model');

//  FIX 1: Import the Shared Notification Service (Not the Controller)
const sendPushNotification = require('../../shared/utils/notificationService');

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
                    targetStudentIds = myChildren
                        .filter(c => c.class_grade == classGrade)
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

            if (!targetStudentIds || targetStudentIds.length === 0) {
                await t.rollback();
                return res.status(404).json({ isSuccess: false, message: "No valid students found for assignment." });
            }

            console.log(`Step 1: Assigning to ${targetStudentIds.length} Students: [${targetStudentIds}]`);

            // -------------------------------------------------------------
            // 3. FETCH QUESTIONS
            // -------------------------------------------------------------
            const questionFilter = {
                subject_id: subjectId,
                class_grade: classGrade,
                difficulty_level: difficulty
            };

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
                    question_ids: questionIdsList,
                    test_type: role === 'Parent' ? 'parent_assigned' : 'admin_assigned'
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
            // 5. COMMIT TRANSACTION
            // -------------------------------------------------------------
            await t.commit();
            console.log("====== DB TRANSACTION COMMITTED ======\n");

            // -------------------------------------------------------------
            // 6.  FIX 2: SEND PUSH NOTIFICATIONS LOOP
            // -------------------------------------------------------------
            // We loop through students and call the Shared Service for each one.
            try {
                const notificationTitle = "New Assessment Assigned!";
                const notificationBody = `You have a new test: ${testTitle}. Due by ${endDate}.`;

                console.log(" Sending Push Notifications...");

                // Using Promise.all to send them in parallel without blocking for too long
                const notificationPromises = targetStudentIds.map(studentId => {
                    return sendPushNotification(
                        studentId,
                        notificationTitle,
                        notificationBody,
                        {
                            type: "new_assessment",
                            subject_id: String(subjectId),
                            test_title: testTitle
                        }
                    );
                });

                // Do not await this if you want the API to respond faster.
                // However, catching errors is good practice.
                Promise.all(notificationPromises)
                    .then(() => console.log(" All notifications sent."))
                    .catch(err => console.error(" Some notifications failed:", err.message));

            } catch (notifyError) {
                console.error("Notification Logic Error:", notifyError.message);
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