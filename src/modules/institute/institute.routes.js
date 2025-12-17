const express = require('express');
const router = express.Router();
const InstituteController = require('./institute.controller');

// Route: POST /api/v1/institute/register
router.post('/register', InstituteController.registerInstitute);

module.exports = router;