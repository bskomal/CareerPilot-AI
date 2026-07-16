const express = require('express');
const router = express.Router();
const { uploadResume, matchJobDescription, predictCareerPath, compareJobDescriptions, planCareerTransition } = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /pdf|docx/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only .pdf and .docx files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Routes
router.post('/upload', protect, upload.single('resume'), uploadResume);
router.post('/match/:resumeId', protect, matchJobDescription);
router.post('/career-path/:resumeId', protect, predictCareerPath);
router.post('/compare/:resumeId', protect, compareJobDescriptions);
router.post('/transition-plan/:resumeId', protect, planCareerTransition);

module.exports = router;