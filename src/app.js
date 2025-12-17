const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./modules/users/auth.routes'); 
// 1. IMPORT LOGIN ROUTES
const loginRoutes = require('./modules/users/login.routes'); 
const childRoutes = require('./modules/users/child.routes');
const subjectRoutes = require("./modules/subjects/subject.routes");
const assessmentRoutes = require('./modules/tests/assessment.routes');
const instituteRoutes = require('./modules/institute/institute.routes');

const app = express();
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/v1/auth', authRoutes); 
app.use('/v1/child', childRoutes);
app.use('/v1/auth/login', loginRoutes); 
app.use('/v1/institute', instituteRoutes);
app.use("/v1/get_subjects", subjectRoutes);
app.use('/v1/assessment', assessmentRoutes);

// ... rest of your server setup ...


const PORT = process.env.PORT || 3019;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));


