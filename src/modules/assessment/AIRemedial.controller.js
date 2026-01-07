const { GoogleGenerativeAI } = require("@google/generative-ai");
const sequelize = require('../../config/database');
const { Op } = require('sequelize');

// Models
const TestAttempt = require('../tests/test_attempt.model'); // Adjust path if needed
const Test = require('../tests/test.model');
const Question = require('../tests/question.model');
const TestQuestionMap = require('../tests/test_questions_map.model');
// [NEW] Import StudentProfile to get dynamic class grade
const StudentProfile = require('../users/student_profile.model'); 

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const AIRemedialController = {

    generateAdaptiveTest: async (req, res) => {
        const t = await sequelize.transaction();

        try {
            // 1. EXTRACT USER ID FROM TOKEN
            if (!req.user || !req.user.user_id) {
                await t.rollback();
                return res.status(401).json({ isSuccess: false, message: "Unauthorized: Invalid Token" });
            }

            const student_id = req.user.user_id;

            // [MODIFICATION 1] Extract questions_count
            const { subject_id, subject_name, topic_name, questions_count } = req.body;

            // [MODIFICATION 2] Set Limit (Default 5)
            const limit = questions_count || 5;

            console.log(`\n====== AI ADAPTIVE TEST (Student: ${student_id}, Questions: ${limit}) ======`);

            // [FIX 1] FETCH STUDENT CLASS GRADE
            const profile = await StudentProfile.findOne({ where: { student_id } });
            const studentGrade = profile ? profile.class_grade : 10; 

            // 2. ANALYZE PREVIOUS PERFORMANCE
            const lastAttempt = await TestAttempt.findOne({
                where: { student_id: student_id },
                order: [['completed_at', 'DESC']], 
            });

            let difficultyLevel = 'Medium';
            let reasoning = "Standard assessment strategy.";

            if (lastAttempt) {
                const score = parseFloat(lastAttempt.score_obtained);
                
                if (score < 40) {
                    difficultyLevel = 'Easy';
                    reasoning = `Low score (${score}%). Setting difficulty to EASY.`;
                } else if (score >= 40 && score < 80) {
                    difficultyLevel = 'Medium';
                    reasoning = `Average score (${score}%). Setting difficulty to MEDIUM.`;
                } else {
                    difficultyLevel = 'Hard';
                    reasoning = `High score (${score}%). Setting difficulty to HARD.`;
                }
            } else {
                reasoning = "No previous attempt found. Defaulting to MEDIUM.";
            }

            console.log(`> Strategy: ${difficultyLevel} | Reason: ${reasoning}`);

            // 3. GENERATE QUESTIONS USING GEMINI AI
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            // [MODIFICATION 3] Use 'limit' in prompt
            const prompt = `
            Act as a strict exam setter. Create ${limit} multiple-choice questions (MCQ).
            
            Context:
            - Subject: ${subject_name}
            - Topic: ${topic_name}
            - Difficulty Level: ${difficultyLevel}
            - Target Audience: Grade ${studentGrade} Student

            Output Requirement:
            Return ONLY a valid JSON array. Do not include markdown formatting like \`\`\`json.
            
            JSON Structure per question:
            {
                "question_text": "Question string",
                "option_a": "Option A string",
                "option_b": "Option B string",
                "option_c": "Option C string",
                "option_d": "Option D string",
                "correct_option": "A", 
                "explanation": "Short explanation"
            }
            (Note: correct_option must be exactly one character: "A", "B", "C", or "D")
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            
            let text = response.text().replace(/```json|```/g, '').trim();
            
            let aiQuestions = [];
            try {
                aiQuestions = JSON.parse(text);
            } catch (jsonError) {
                console.error("AI Response Error:", text);
                throw new Error("Failed to parse AI response. Please try again.");
            }

            // 4. SAVE QUESTIONS TO DATABASE
            const questionsData = aiQuestions.map(q => ({
                subject_id: subject_id,
                class_grade: studentGrade, 
                topic_id: null,
                difficulty_level: difficultyLevel.toLowerCase(),
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_option: q.correct_option,
                explanation: q.explanation,
                created_by: student_id 
            }));

            const createdQuestions = await Question.bulkCreate(questionsData, { transaction: t });
            const questionIds = createdQuestions.map(q => q.question_id);

            // 5. CREATE THE TEST
            const newTest = await Test.create({
                student_id: student_id,
                created_by: student_id,
                subject_id: subject_id,
                
                // [FIX 3] ADDED CLASS_GRADE HERE
                class_grade: studentGrade, 

                test_title: `AI Practice: ${topic_name}`,
                instructions: `This test is personalized based on your past performance. Difficulty: ${difficultyLevel}`,
                start_date: new Date(),
                end_date: new Date(new Date().setDate(new Date().getDate() + 7)), 
                
                // [MODIFICATION 4] Dynamic Duration (e.g., 2 mins per question)
                duration_minutes: limit * 2, 
                
                total_questions: questionIds.length,
                status: 'published',
                question_ids: questionIds,
                test_type: 'ai_adaptive',
                difficulty_level: difficultyLevel.toLowerCase()
            }, { transaction: t });

            // 6. MAP QUESTIONS TO TEST
            const mapEntries = questionIds.map(qId => ({
                test_id: newTest.test_id,
                question_id: qId
            }));
            await TestQuestionMap.bulkCreate(mapEntries, { transaction: t });

            await t.commit();
            console.log("====== AI TEST ASSIGNED SUCCESSFULLY ======\n");

            return res.status(201).json({
                isSuccess: true,
                message: "Adaptive assessment generated successfully.",
                data: {
                    test_id: newTest.test_id,
                    difficulty: difficultyLevel,
                    reason: reasoning,
                    questions_count: questionIds.length
                }
            });

        } catch (error) {
            if (!t.finished) await t.rollback();
            console.error("System Error:", error);
            res.status(500).json({ isSuccess: false, message: error.message });
        }
    }
};

module.exports = AIRemedialController;

