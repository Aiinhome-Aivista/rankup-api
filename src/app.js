
require ("dotenv").config()
const cors = require('cors');
const express = require('express');
const sequelize = require('./config/database');


// --- IMPORTS ---
const authRoutes = require('./modules/users/auth.routes');
const childRoutes = require('./modules/users/child.routes');
const studentRoutes = require('./modules/parents/student.routes');
const subjectRoutes = require("./modules/subjects/subject.routes");
const assessmentRoutes = require('./modules/tests/assessment.routes');
const instituteRoutes = require('./modules/institute/institute.routes');
const aiRemedialRoutes = require('./modules/assessment/AIRemedial.routes');
const dashboardRoutes = require('./modules/student_dashboard/dashboard.routes');
const assessmentPdfRoutes = require('./modules/assessment/assessment_pdf.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const studentTestsRoutes = require('./modules/tests/get_student_tests.routes.js');
const submitTestRoutes = require('./modules/submit_test_all_aswers/submit.routes');
const selfAssessmentRoutes = require('./modules/self_assessment/self_assessment.routes');
const saveAnswerRoutes = require('./modules/student_assessment_save_answers/save_answer.routes');
const studentAssessmentRoutes = require('./modules/student_assessment/student_assessment.routes');






const app = express();
app.use(cors());
app.use(express.json());


// --- MOUNT ROUTES ---
app.use('/v1/auth', authRoutes); // Handles Register, Login, Verify-OTP

// app.use('/v1/auth/login', loginRoutes);

app.use('/v1/child', childRoutes);
app.use('/v1/parents', studentRoutes);
app.use('/v1/dashboard', dashboardRoutes);
app.use('/v1/institute', instituteRoutes);
app.use("/v1/get_subjects", subjectRoutes);
app.use('/v1/assessment', assessmentRoutes);
app.use('/v1/submit_test', submitTestRoutes);
app.use('/v1/assessment', assessmentPdfRoutes);
app.use('/v1/notifications', notificationRoutes);
app.use('/v1/student_tests', studentTestsRoutes);
app.use('/v1/retake_assessment', aiRemedialRoutes);
app.use('/v1/self_assessment', selfAssessmentRoutes);
app.use('/v1/student_assessment_save', saveAnswerRoutes);
app.use('/v1/student_assessment', studentAssessmentRoutes);




const PORT = process.env.PORT || 3019;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



