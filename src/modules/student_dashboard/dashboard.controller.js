

const sequelize = require('../../config/database');
const { QueryTypes } = require('sequelize');
const AIService = require('../../shared/utils/aiService');


const StudentDashboardController = {


    getStudentDashboard: async (req, res) => {
        try {
            const studentId = req.user.user_id;


            // --- 1. USER INFO (Name, Class, Time) ---
            const studentData = await sequelize.query(
                `SELECT u.full_name, sp.class_grade
                 FROM users u
                 LEFT JOIN student_profiles sp ON u.user_id = sp.student_id
                 WHERE u.user_id = :sid`,
                { replacements: { sid: studentId }, type: QueryTypes.SELECT }
            );


            const studentName = studentData[0]?.full_name || "Student";
            const className = studentData[0]?.class_grade ? `Class ${studentData[0].class_grade}` : "Class Not Assigned";


            // Date & Time (Day Name Only + IST Time)
            const now = new Date();
            const dateOptions = { timeZone: 'Asia/Kolkata', weekday: 'long' };
            const timeOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true };
            const currentDay = now.toLocaleDateString('en-IN', dateOptions);
            const currentTime = now.toLocaleTimeString('en-IN', timeOptions);




            // --- 2. METRICS QUERIES ---


            // A. Count Upcoming Tests (Total count, ignores limit)
            const upcomingCountData = await sequelize.query(
                `SELECT COUNT(*) as count
                 FROM tests
                 WHERE student_id = :sid AND start_date > NOW()`,
                { replacements: { sid: studentId }, type: QueryTypes.SELECT }
            );
            const upcomingTestCount = parseInt(upcomingCountData[0]?.count || 0);


            // B. Average Score % (Across all attempts)
            const performanceMetrics = await sequelize.query(
                `SELECT
                    ROUND(AVG((ta.score_obtained / NULLIF(t.total_questions, 0)) * 100), 1) as avg_pct
                 FROM test_attempts ta
                 JOIN tests t ON ta.test_id = t.test_id
                 WHERE ta.student_id = :sid`,
                { replacements: { sid: studentId }, type: QueryTypes.SELECT }
            );
            const averageScorePercentage = parseFloat(performanceMetrics[0]?.avg_pct || 0).toFixed(2);




            // --- 3. LIST DATA QUERIES ---


            // A. Upcoming Tests List (Limited to 3 for display)
            const upcomingTests = await sequelize.query(
                `SELECT test_id, test_title, start_date, duration_minutes
                 FROM tests
                 WHERE student_id = :sid AND start_date > NOW()
                 ORDER BY start_date ASC LIMIT 3`,
                { replacements: { sid: studentId }, type: QueryTypes.SELECT }
            );


            // B. Recent Activity (For Academic Performance Chart)
            const recentActivity = await sequelize.query(
                `SELECT t.test_title, ta.score_obtained, ta.completed_at, t.total_questions
                 FROM test_attempts ta
                 JOIN tests t ON ta.test_id = t.test_id
                 WHERE ta.student_id = :sid
                 ORDER BY ta.completed_at DESC LIMIT 5`,
                { replacements: { sid: studentId }, type: QueryTypes.SELECT }
            );


            // C. Assessment Overview (Stored Procedure)
            const assessmentOverview = await sequelize.query(
                'SELECT * FROM sp_get_student_assessments_overview(:id)',
                { replacements: { id: studentId }, type: QueryTypes.SELECT }
            );


            // D. Topic Performance (For Smart Study)
            const topicData = await sequelize.query(
                'SELECT * FROM sp_get_topic_performance(:id)',
                { replacements: { id: studentId }, type: QueryTypes.SELECT }
            );




            // --- 4. DATA PROCESSING (AI & Charts) ---


            const weakAreas = topicData.filter(t => t.status === 'Weak');
            const strongAreas = topicData.filter(t => t.status === 'Strong');
            let aiRecommendation = "Focus on reviewing your recent tests to improve.";
            let aiTips = [];


            // AI Generation (with Error Handling)
            if (weakAreas.length > 0) {
                const weakest = weakAreas.sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy))[0];
                try {
                    const [rec, tips] = await Promise.all([
                        AIService.generateDailyRecommendation(weakest),
                        AIService.generateStudyTips(weakAreas)
                    ]);
                    aiRecommendation = rec;
                    aiTips = tips;
                } catch (e) { console.error("AI Partial Fail"); }
            }


            // Chart Data Mapping
            const academicPerformance = recentActivity.map(item => ({
                label: item.test_title,
                value: item.score_obtained
            }));


            const overallProgress = topicData.length > 0
                ? Math.round(topicData.reduce((sum, t) => sum + parseFloat(t.accuracy), 0) / topicData.length)
                : 0;




            // --- 5. FINAL RESPONSE ---
            return res.status(200).json({
                isSuccess: true,
                message: "Dashboard data fetched successfully",
                data: {
                    // Header Info
                    studentName,
                    className,
                    currentDay,
                    currentTime,


                    // 🔥 NEW: Class Performance Metrics
                    classPerformance: {
                        upcomingTestCount,
                        averageScorePercentage
                    },


                    // Existing Sections
                    summary: {
                        overallProgress,
                        weakCount: weakAreas.length,
                        strongCount: strongAreas.length,
                        totalTestsTaken: recentActivity.length
                    },
                    academicPerformance, // Chart Data
                    smartStudy: {
                        todaysRecommendation: aiRecommendation,
                        weakAreas,
                        strongAreas,
                        improvementTips: aiTips
                    },
                    assessmentOverview,
                    upcomingTests,
                    recentActivity
                }
            });


        } catch (error) {
            console.error("Dashboard Error:", error);
            return res.status(500).json({ isSuccess: false, message: "Server Error" });
        }
    },


    // ... keep getSmartStudyInsights ...
};


module.exports = StudentDashboardController;



