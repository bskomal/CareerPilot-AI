const express = require('express');
const router = express.Router();
const { predictCareerPath } = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/careers/career-path/:resumeId (if mounted on /api/careers)
// Or POST /api/resumes/career-path/:resumeId (mounted on /api/resumes in resumeRoutes)
router.post('/career-path/:resumeId', protect, predictCareerPath);

module.exports = router;
