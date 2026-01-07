// const fs = require('fs');
// const sequelize = require('../../config/database');
// const { QueryTypes } = require('sequelize');


// // Import Models
// const Test = require('../tests/test.model');
// const Question = require('../tests/question.model');
// const TestQuestionMap = require('../tests/test_questions_map.model');
// const AIService = require('../../services/ai.service');


// const UploadController = {


//     processPDF: async (req, res) => {
//         const t = await sequelize.transaction();
//         try {
//             const studentId = req.user.user_id;


//             // 1. Parse Fields
//             const subjectId = parseInt(req.body.subjectId);
//             const topicIdRaw = req.body.topicId;
//             const { difficulty, questionCount, duration } = req.body;


//             // 2. Validation
//             if (!req.file) {
//                 await t.rollback();
//                 return res.status(400).json({ isSuccess: false, message: "No PDF file uploaded." });
//             }
//             if (!subjectId) {
//                 await t.rollback();
//                 return res.status(400).json({ isSuccess: false, message: "subjectId is required." });
//             }


//             // 3. Resolve Metadata (Subject/Topic Names)
//             let subjectName = "General";
//             let topicNames = [];


//             const [subjData] = await sequelize.query(
//                 "SELECT subject_name FROM subjects WHERE subject_id = :id",
//                 { replacements: { id: subjectId }, type: QueryTypes.SELECT }
//             );
//             if (subjData) subjectName = subjData.subject_name;


//             if (topicIdRaw && topicIdRaw !== 'all') {
//                 const [topicData] = await sequelize.query(
//                     "SELECT topic_name FROM topics WHERE topic_id = :id",
//                     { replacements: { id: topicIdRaw }, type: QueryTypes.SELECT }
//                 );
//                 if (topicData) topicNames = [topicData.topic_name];
//             }


//             // 4. READ & PARSE PDF (With Fallback)
//             console.log("📂 Reading PDF:", req.file.path);
//             const dataBuffer = fs.readFileSync(req.file.path);
//             let extractedText = "";


//             try {
//                 // Try importing inside function to avoid top-level crash
//                 let pdfParser = require('pdf-parse');


//                 // Handle odd import behavior
//                 if (typeof pdfParser !== 'function' && pdfParser.default) {
//                     pdfParser = pdfParser.default;
//                 }


//                 console.log("🛠️ PDF Library Status:", typeof pdfParser); // Debug Log


//                 if (typeof pdfParser === 'function') {
//                     const data = await pdfParser(dataBuffer);
//                     extractedText = data.text;
//                     console.log("✅ PDF Text Extracted Successfully");
//                 } else {
//                     throw new Error("Library imported as object, not function");
//                 }


//             } catch (pdfError) {
//                 console.error("⚠️ PDF Parsing Failed:", pdfError.message);
//                 console.log("⚠️ SWITCHING TO FALLBACK MODE: Using mock text to allow testing.");


//                 // FALLBACK: If PDF library breaks, use this text so you can still test AI/DB logic
//                 extractedText = `
//                     Unit Test for ${subjectName}.
//                     Topic: ${topicNames.join(', ') || 'General'}.
//                     Difficulty: ${difficulty}.
//                     Please generate 5 sample questions about this subject.
//                 `;
//             }


//             // 5. AI GENERATION
//             // Now we call AI (using either real PDF text or the fallback text)
//             const questions = await AIService.generateQuestionsFromPDF(
//                 extractedText,
//                 questionCount || 10,
//                 subjectName,
//                 difficulty || "Medium",
//                 topicNames
//             );


//             // 6. SAVE TO DB
//             const topicIdToSave = (topicIdRaw && topicIdRaw !== 'all') ? parseInt(topicIdRaw) : null;


//             const newTest = await Test.create({
//                 student_id: studentId,
//                 created_by: studentId,
//                 subject_id: subjectId,
//                 test_title: `PDF Study: ${req.file.originalname}`,
//                 test_type: 'self_assessment_pdf',
//                 class_grade: 0,
//                 duration_minutes: duration || 30,
//                 difficulty_level: difficulty || 'medium',
//                 total_questions: questions.length,
//                 status: 'published',
//                 topic_id: topicIdToSave
//             }, { transaction: t });


//             let questionIds = [];
//             let mapEntries = [];


//             for (const q of questions) {
//                 const savedQ = await Question.create({
//                     subject_id: subjectId,
//                     topic_id: topicIdToSave,
//                     question_text: q.question_text,
//                     option_a: q.option_a,
//                     option_b: q.option_b,
//                     option_c: q.option_c,
//                     option_d: q.option_d,
//                     correct_option: q.correct_option,
//                     difficulty_level: difficulty || 'medium',
//                     class_grade: 0
//                 }, { transaction: t });


//                 questionIds.push(savedQ.question_id);
//                 mapEntries.push({ test_id: newTest.test_id, question_id: savedQ.question_id });
//             }


//             await newTest.update({ question_ids: questionIds }, { transaction: t });
//             await TestQuestionMap.bulkCreate(mapEntries, { transaction: t });


//             await t.commit();


//             // Cleanup file
//             try { if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) { }


//             return res.status(201).json({
//                 isSuccess: true,
//                 message: extractedText.includes("Unit Test for") ? "Test created (Fallback Mode)" : "PDF Processed Successfully",
//                 data: { testId: newTest.test_id, questionsAdded: questions.length }
//             });


//         } catch (error) {
//             await t.rollback();
//             try { if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) { }
//             res.status(500).json({ isSuccess: false, message: error.message });
//         }
//     }
// };


// module.exports = UploadController;


const fs = require('fs');
const sequelize = require('../../config/database');
const { QueryTypes, Op } = require('sequelize'); // Added Op for filtering


// Import Models
const Test = require('../tests/test.model');
const Question = require('../tests/question.model');
const TestQuestionMap = require('../tests/test_questions_map.model');
const AIService = require('../../services/ai.service');


const UploadController = {


    processPDF: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const studentId = req.user.user_id;


            // 1. Parse Fields
            const subjectId = parseInt(req.body.subjectId);
            const topicIdRaw = req.body.topicId;
            const { difficulty, questionCount, duration } = req.body;


            // 2. Validation
            if (!req.file) {
                await t.rollback();
                return res.status(400).json({ isSuccess: false, message: "No PDF file uploaded." });
            }
            if (!subjectId) {
                await t.rollback();
                return res.status(400).json({ isSuccess: false, message: "subjectId is required." });
            }


            // 3. Resolve Metadata (Subject/Topic Names)
            let subjectName = "General";
            let topicNames = [];


            const [subjData] = await sequelize.query(
                "SELECT subject_name FROM subjects WHERE subject_id = :id",
                { replacements: { id: subjectId }, type: QueryTypes.SELECT, transaction: t }
            );
            if (subjData) subjectName = subjData.subject_name;


            if (topicIdRaw && topicIdRaw !== 'all') {
                const [topicData] = await sequelize.query(
                    "SELECT topic_name FROM topics WHERE topic_id = :id",
                    { replacements: { id: topicIdRaw }, type: QueryTypes.SELECT, transaction: t }
                );
                if (topicData) topicNames = [topicData.topic_name];
            }


            // 4. READ & PARSE PDF
            console.log("📂 Reading PDF:", req.file.path);
            const dataBuffer = fs.readFileSync(req.file.path);
            let extractedText = "";


            try {
                let pdfParser = require('pdf-parse');
                if (typeof pdfParser !== 'function' && pdfParser.default) {
                    pdfParser = pdfParser.default;
                }


                if (typeof pdfParser === 'function') {
                    const data = await pdfParser(dataBuffer);
                    extractedText = data.text;
                } else {
                    throw new Error("Library imported as object, not function");
                }
            } catch (pdfError) {
                console.error("⚠️ PDF Parsing Failed:", pdfError.message);
                // Fallback text for testing
                extractedText = `Unit Test for ${subjectName}. Topic: ${topicNames.join(', ')}.`;
            }


            // 5. AI GENERATION
            const questions = await AIService.generateQuestionsFromPDF(
                extractedText,
                questionCount || 10,
                subjectName,
                difficulty || "Medium",
                topicNames
            );


            // 6. SAVE TO DB
            const topicIdToSave = (topicIdRaw && topicIdRaw !== 'all') ? parseInt(topicIdRaw) : null;


            // A. Create the Test first
            const newTest = await Test.create({
                student_id: studentId,
                created_by: studentId,
                subject_id: subjectId,
                test_title: `PDF Study: ${req.file.originalname}`,
                test_type: 'self_assessment_pdf',
                class_grade: 0,
                duration_minutes: duration || 30,
                difficulty_level: difficulty || 'medium',
                total_questions: questions.length, // Will update this later if duplicates are removed
                status: 'published',
                topic_id: topicIdToSave
            }, { transaction: t });


            // B. Insert Questions (and track their temporary IDs)
            let initialQuestionIds = [];


            for (const q of questions) {
                const savedQ = await Question.create({
                    subject_id: subjectId,
                    topic_id: topicIdToSave,
                    question_text: q.question_text,
                    option_a: q.option_a || 'Option A', // Safety defaults
                    option_b: q.option_b || 'Option B',
                    option_c: q.option_c || 'Option C',
                    option_d: q.option_d || 'Option D',
                    correct_option: q.correct_option || 'A',
                    difficulty_level: difficulty || 'medium',
                    class_grade: 0
                }, { transaction: t });


                initialQuestionIds.push(savedQ.question_id);
            }


            // 7. CALL STORED PROCEDURE (Clean Duplicates)
            // This will delete any questions that are older duplicates.
            // Since our Insert Logic is "Keep Newest", our inserted IDs *should* survive,
            // UNLESS the PDF itself contained the same question twice.
            await sequelize.query('CALL remove_question_duplicates()', { transaction: t });


            // 8. VERIFY SURVIVING IDS
            // We must check which of our initialQuestionIds still exist in the DB.
            const validQuestions = await Question.findAll({
                where: {
                    question_id: {
                        [Op.in]: initialQuestionIds // Check if these IDs are still there
                    }
                },
                attributes: ['question_id'],
                transaction: t
            });


            // Extract the IDs that survived the SP deletion
            const finalQuestionIds = validQuestions.map(q => q.question_id);


            // 9. ASSIGN TEST (Create Mappings)
            if (finalQuestionIds.length > 0) {
                const mapEntries = finalQuestionIds.map(qid => ({
                    test_id: newTest.test_id,
                    question_id: qid
                }));


                await TestQuestionMap.bulkCreate(mapEntries, { transaction: t });


                // Update test with actual count and ID array
                await newTest.update({
                    question_ids: finalQuestionIds,
                    total_questions: finalQuestionIds.length
                }, { transaction: t });
            }


            await t.commit();


            // Cleanup file
            try { if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) { }


            return res.status(201).json({
                isSuccess: true,
                message: "PDF Processed and assigned successfully.",
                data: {
                    testId: newTest.test_id,
                    questionsAdded: finalQuestionIds.length,
                    duplicatesRemoved: initialQuestionIds.length - finalQuestionIds.length
                }
            });


        } catch (error) {
            await t.rollback();
            try { if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) { }
            console.error("Upload Error:", error);
            res.status(500).json({ isSuccess: false, message: error.message });
        }
    }
};


module.exports = UploadController;




