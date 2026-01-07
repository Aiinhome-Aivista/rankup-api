const express = require('express');
const router = express.Router();
const multer = require('multer');


// Import the Two New Controllers
const GenerateController = require('./self_assessment.controller');
const UploadController = require('./self_assessmentupload.controller');


const authenticateToken = require('../../middlewares/auth.middleware');


// Config Multer
const upload = multer({ dest: 'uploads/' });


// --- ROUTE 1: JSON ONLY (Generate from Existing) ---
// Usage: Postman Body -> Raw JSON
router.post('/generate_ai', authenticateToken, GenerateController.createFromExistingQuestions);


// --- ROUTE 2: FORM-DATA (Upload PDF) ---
// Usage: Postman Body -> Form-Data (file, subjectId, etc.)
router.post('/upload_pdf', authenticateToken, upload.single('file'), UploadController.processPDF);


module.exports = router;






