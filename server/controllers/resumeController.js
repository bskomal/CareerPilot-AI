const Resume = require('../models/Resume');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cosineSimilarity = require('../utils/cosineSimilarity');
const { generateRecommendations, generateRoadmap, skillDatabase } = require('../utils/recommendationEngine');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Upload Resume + Parse + Embedding
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
            const absolutePath = path.resolve(req.file.path);
            const formData = new FormData();
            formData.append('file', fs.createReadStream(absolutePath));

            // FIXED: Added /api prefix
            const aiResponse = await axios.post(
                `${AI_URL}/api/parse-resume`,
                formData,
                {
                    headers: { ...formData.getHeaders() },
                    timeout: 120000,
                }
            );

            const {
                extracted_name,
                extracted_skills,
                extracted_experience,
                extracted_education,
                full_text
            } = aiResponse.data;

            resume.extracted_name = extracted_name;
            resume.extracted_skills = extracted_skills || [];
            resume.extracted_experience = extracted_experience || [];
            resume.extracted_education = extracted_education || [];

            // Use full_text for better embedding if available
            const combinedText = full_text || [
                extracted_name,
                ...(extracted_skills || []),
                ...(extracted_experience || []),
                ...(extracted_education || []),
            ].join(' ');

            // FIXED: Added /api prefix
            const embeddingResponse = await axios.post(
                `${AI_URL}/api/generate-embedding`,
                { text: combinedText },
                { timeout: 120000 }
            );

            resume.embedding = embeddingResponse.data.embedding;
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
                resume,
            });
        }
    } catch (error) {
        console.error('Upload Error:', error.message);
        return res.status(500).json({ message: 'Server error during resume upload' });
    }
};

// Match Resume + Phase 6 Recommendations
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
            return res.status(400).json({ message: 'Resume embedding not found' });
        }

        // FIXED: Added /api prefix
        const jdResponse = await axios.post(
            `${AI_URL}/api/generate-embedding`,
            { text: jobDescription },
            { timeout: 120000 }
        );
        const jdEmbedding = jdResponse.data.embedding;

        const similarity = cosineSimilarity(resume.embedding, jdEmbedding);
        const matchPercentage = Math.max(0, Math.min(100, similarity * 100)).toFixed(2);

        // Improved skill matching logic
        const resumeSkills = resume.extracted_skills.map(s => s.toLowerCase());
        const jobText = jobDescription.toLowerCase();
        const allKnownSkills = Object.keys(skillDatabase);

        // Find skills mentioned in job description
        const jobRequiredSkills = allKnownSkills.filter(skill => jobText.includes(skill.toLowerCase()));

        const matchingSkills = jobRequiredSkills.filter(skill => resumeSkills.includes(skill.toLowerCase()));
        const missingSkills = jobRequiredSkills.filter(skill => !resumeSkills.includes(skill.toLowerCase()));

        // Phase 6
        const recommendations = generateRecommendations(missingSkills);
        const learningRoadmap = generateRoadmap(recommendations);

        let overallScore;
        if (matchPercentage >= 80) overallScore = 'Strong Match';
        else if (matchPercentage >= 60) overallScore = 'Good Match';
        else if (matchPercentage >= 40) overallScore = 'Moderate Match';
        else overallScore = 'Weak Match';

        res.json({
            matchPercentage,
            matchingSkills,
            missingSkills,
            recommendations,
            learningRoadmap,
            overallScore,
        });

    } catch (error) {
        console.error('Matching Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Server error during matching' });
    }
};

module.exports = { uploadResume, matchJobDescription };