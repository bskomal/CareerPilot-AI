const Resume = require('../models/Resume');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cosineSimilarity = require('../utils/cosineSimilarity');
const { generateRecommendations, generateRoadmap } = require('../utils/recommendationEngine');

// ✅ Uses environment variable (Render expects this)
const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ============================
// UPLOAD RESUME → PARSE → EMBEDDING
// ============================
const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const resume = await Resume.create({
            user: req.user._id,
            originalFileName: req.file.originalname,
            filePath: req.file.path,
            fileType: req.file.mimetype === 'application/pdf' ? 'pdf' : 'docx',
            fileSize: req.file.size,
            status: 'pending',
        });

        try {
            // Step A: Send File to AI Service for Parsing
            const absolutePath = path.resolve(req.file.path);
            const formData = new FormData();
            formData.append('file', fs.createReadStream(absolutePath));

            // ✅ CRITICAL FIX: Added /api prefix
            // Your main.py has: app.include_router(..., prefix="/api")
            // So the actual URL is https://.../api/parse-resume
            const parseResponse = await axios.post(
                `${AI_URL}/api/parse-resume`,
                formData,
                {
                    headers: { ...formData.getHeaders() },
                    timeout: 120000, // 2 mins timeout for cold starts
                }
            );

            const {
                extracted_name,
                extracted_skills,
                extracted_experience,
                extracted_education,
                full_text
            } = parseResponse.data;

            // Save parsed data to DB
            resume.extracted_name = extracted_name;
            resume.extracted_skills = extracted_skills || [];
            resume.extracted_experience = extracted_experience || [];
            resume.extracted_education = extracted_education || [];

            // Step B: Send Text to AI Service for Vector Embedding
            // Combine fields into single text string for better semantic representation
            const combinedText = full_text || [
                extracted_name,
                ...(extracted_skills || []),
                ...(extracted_experience || []),
                ...(extracted_education || [])
            ].join(' ');

            // ✅ CRITICAL FIX: Added /api prefix
            const embedResponse = await axios.post(
                `${AI_URL}/api/generate-embedding`,
                { text: combinedText },
                { timeout: 120000 }
            );

            // Store the vector array
            resume.embedding = embedResponse.data.embedding;
            resume.status = 'processed';
            await resume.save();

            return res.status(201).json({
                message: 'Resume uploaded and processed successfully',
                resume,
            });

        } catch (aiError) {
            console.error('AI Processing Error:', aiError.response?.data || aiError.message);

            resume.status = 'failed';
            await resume.save();

            return res.status(500).json({
                message: 'Resume uploaded but AI processing failed',
                error: aiError.message,
                resume,
            });
        }

    } catch (error) {
        console.error('Upload Error:', error.message);
        return res.status(500).json({
            message: 'Server error during resume upload',
            error: error.message
        });
    }
};

// ============================
// MATCH JOB DESCRIPTION (PHASE 6 ENABLED)
// ============================
const matchJobDescription = async (req, res) => {
    try {
        const { resumeId } = req.params;
        const { jobDescription } = req.body;

        if (!jobDescription) {
            return res.status(400).json({ message: 'Job description is required' });
        }

        const resume = await Resume.findById(resumeId);

        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        if (!resume.embedding || resume.embedding.length === 0) {
            return res.status(400).json({
                message: 'Resume not processed yet. Please upload and wait for processing.',
                status: resume.status
            });
        }

        // Step C: Vectorize the Job Description
        // ✅ CRITICAL FIX: Added /api prefix
        const jdResponse = await axios.post(
            `${AI_URL}/api/generate-embedding`,
            { text: jobDescription },
            { timeout: 120000 }
        );

        const jdEmbedding = jdResponse.data.embedding;

        // Calculate Cosine Similarity
        const similarity = cosineSimilarity(resume.embedding, jdEmbedding);
        const matchPercentage = Math.max(0, Math.min(100, similarity * 100)).toFixed(2);

        // Determine Matching vs Missing Skills
        const resumeSkills = resume.extracted_skills.map(s => s.toLowerCase());
        const jobText = jobDescription.toLowerCase();

        const matchingSkills = resumeSkills.filter(skill => jobText.includes(skill));
        const missingSkills = resumeSkills.filter(skill => !jobText.includes(skill));

        // 🚀 PHASE 6: GENERATE RECOMMENDATIONS
        const recommendations = generateRecommendations(missingSkills);
        const learningRoadmap = generateRoadmap(recommendations);

        // Score Labeling
        let overallScore;
        if (matchPercentage >= 80) overallScore = 'Strong Match';
        else if (matchPercentage >= 60) overallScore = 'Good Match';
        else if (matchPercentage >= 40) overallScore = 'Moderate Match';
        else overallScore = 'Weak Match';

        res.json({
            matchPercentage,
            matchingSkills,
            missingSkills,
            // PHASE 6 KEYS BELOW 👇
            recommendations,
            learningRoadmap,
            overallScore,
        });

    } catch (error) {
        console.error('Matching Error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Server error during matching',
            error: error.message
        });
    }
};

module.exports = {
    uploadResume,
    matchJobDescription
};