const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const sequelize = require('../../config/database');
const { Op } = require('sequelize');

//  FIXED PATHS
const Test = require('../tests/test.model');
const Question = require('../tests/question.model');
const TestQuestionMap = require('../tests/test_questions_map.model');

const StudentProfile = require('../users/student_profile.model');
const User = require('../users/user.model');
const NotificationController = require('../notifications/notification.controller');

// --------------------------------------------------
// Helper: Extract questions, options, and answers
// --------------------------------------------------
const extractQuestionsFromPdfText = async (pdfText, commonData) => {
    const questions = [];
    
    // 1. Main Regex: Splits text into blocks based on "1.", "Q1.", "1)" etc.
    const questionRegex = /(?:Q\s*)?(\d+)[\.\)]\s+(.*?)(?=\n(?:Q\s*)?\d+[\.\)]|\n*$)/gis;
    
    let match;

    while ((match = questionRegex.exec(pdfText)) !== null) {
        
        let fullBlock = match[2].trim(); // This contains Question + Options + Answer

        // --- STEP A: EXTRACT ANSWER ---
        // Look for "Answer: C" or "Ans: C" at the end of the block
        let correctOption = "A"; // Default value
        const answerMatch = fullBlock.match(/Answer:\s*([A-D])/i);
        
        if (answerMatch) {
            correctOption = answerMatch[1].toUpperCase();
            // Remove the "Answer: C" line from the text so it doesn't mess up options
            fullBlock = fullBlock.replace(answerMatch[0], "").trim();
        }

        // --- STEP B: SEPARATE QUESTION FROM OPTIONS ---
        // Split the text where "A)" starts
        const parts = fullBlock.split(/A\)/i);
        
        let questionText = parts[0].trim(); // Everything before "A)" is the question
        let optionsText = parts.length > 1 ? "A)" + parts.slice(1).join("A)") : "";

        // --- STEP C: PARSE INDIVIDUAL OPTIONS ---
        // We use Regex to pull text between A) and B), B) and C), etc.
        // (?=...) is a lookahead to stop at the next letter
        
        const optionA = optionsText.match(/A\)\s*(.*?)\s*(?=B\))/is);
        const optionB = optionsText.match(/B\)\s*(.*?)\s*(?=C\))/is);
        const optionC = optionsText.match(/C\)\s*(.*?)\s*(?=D\))/is);
        const optionD = optionsText.match(/D\)\s*(.*)/is); // D goes until end of string

        questions.push({
            question_text: questionText,
            option_a: optionA ? optionA[1].trim() : "Option A",
            option_b: optionB ? optionB[1].trim() : "Option B",
            option_c: optionC ? optionC[1].trim() : "Option C",
            option_d: optionD ? optionD[1].trim() : "Option D",
            
            correct_option: correctOption, // Extracted answer (A, B, C, or D)
            
            explanation: "Auto-generated from PDF",
            ...commonData
        });
    }

    return questions;
};



const AssessmentPDFController = {

    createAssessmentFromPDF: async (req, res) => {
        const t = await sequelize.transaction();

        try {
            if (!req.user) {
                await t.rollback();
                return res.status(401).json({ isSuccess: false, message: "Unauthorized" });
            }

            if (!req.file) {
                await t.rollback();
                return res.status(400).json({ isSuccess: false, message: "PDF file required" });
            }

            const { user_id, role } = req.user;

            console.log(`\n====== NEW PDF ASSESSMENT PROCESSING (${role}) ======`);

            // --------------------------------------------------
            // READ PDF
            // --------------------------------------------------
            if (!fs.existsSync(req.file.path)) {
                throw new Error("Uploaded PDF file not found on server");
            }

            const buffer = fs.readFileSync(req.file.path);
            const pdfData = await pdfParse(buffer);
            const pdfText = pdfData.text;


            const {
                subjectId, classGrade, testTitle, instructions,
                startDate, endDate, durationLimit,
                randomizeQuestions, antiCheatMode,
                allowedAttempts, difficulty,
                status, assignType, studentIds, topicId
            } = req.body;

            const commonQuestionData = {
                subject_id: subjectId,
                class_grade: classGrade,
                topic_id: topicId && topicId !== 'all' ? topicId : null,
                difficulty_level: difficulty,
                created_by: user_id
            };

            let parsedQuestions = await extractQuestionsFromPdfText(pdfText, commonQuestionData);

            if (parsedQuestions.length === 0) {
                parsedQuestions.push({
                    question_text: "Unable to auto-parse questions. Please edit.",
                    option_a: "True",
                    option_b: "False",
                    correct_option: "option_a",
                    ...commonQuestionData
                });
            }

            const createdQuestions = await Question.bulkCreate(parsedQuestions, { transaction: t });
            const questionIds = createdQuestions.map(q => q.question_id);

            console.log(`Step 1: Created ${questionIds.length} questions`);

            // --------------------------------------------------
            // FIND STUDENTS
            // --------------------------------------------------
            let targetStudentIds = [];

            if (role === 'Teacher' || role === 'Admin') {
                if (assignType === 'specific') {
                    targetStudentIds = typeof studentIds === 'string'
                        ? JSON.parse(studentIds)
                        : studentIds;
                } else {
                    const students = await StudentProfile.findAll({
                        where: { class_grade: classGrade },
                        include: [{ model: User, where: { role: 'Student', is_active: 1 } }],
                        attributes: ['student_id']
                    });
                    targetStudentIds = students.map(s => s.student_id);
                }
            }

            if (!targetStudentIds.length) {
                throw new Error("No students found for assignment");
            }

            // --------------------------------------------------
            // CREATE TESTS
            // --------------------------------------------------
            let mappings = [];

            for (const studentId of targetStudentIds) {
                const test = await Test.create({
                    student_id: studentId,
                    created_by: user_id,
                    subject_id: subjectId,
                    class_grade: classGrade,
                    test_title: testTitle,
                    instructions,
                    start_date: startDate,
                    end_date: endDate,
                    duration_minutes: durationLimit,
                    is_randomized: randomizeQuestions === 'true' || randomizeQuestions === true,
                    anti_cheat_mode: antiCheatMode === 'true' || antiCheatMode === true,
                    allowed_attempts: allowedAttempts,
                    difficulty_level: difficulty,
                    total_questions: questionIds.length,
                    status: status || 'published',
                    question_ids: questionIds,
                    test_type: 'pdf_generated'
                }, { transaction: t });

                mappings.push(
                    ...questionIds.map(qid => ({
                        test_id: test.test_id,
                        question_id: qid
                    }))
                );
            }

            await TestQuestionMap.bulkCreate(mappings, { transaction: t });

            await t.commit();
            fs.unlinkSync(req.file.path);

            NotificationController.sendToUsers(
                targetStudentIds,
                "New PDF Assessment",
                `Test "${testTitle}" is available`,
                { type: "new_assessment" }
            ).catch(() => {});

            console.log("====== PDF ASSESSMENT COMPLETED ======");

            return res.status(201).json({
                isSuccess: true,
                message: "Assessment created from PDF",
                data: {
                    students: targetStudentIds.length,
                    questions: questionIds.length
                }
            });

        } catch (error) {
            console.error("System Error:", error.message);
            if (!t.finished) await t.rollback();
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

            return res.status(500).json({ isSuccess: false, message: error.message });
        }
    }
};

module.exports = AssessmentPDFController;
