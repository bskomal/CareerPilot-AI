const Resume = require('../models/Resume');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cosineSimilarity = require('../utils/cosineSimilarity');
const { generateRecommendations, generateRoadmap } = require('../utils/recommendationEngine');

// ✅ AI Service URL from environment
const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ===============================
// ✅ Upload Resume + Generate Embedding
// ===============================
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

            // ✅ Uses environment variable
            const aiResponse = await axios.post(
                `${AI_URL}/parse-resume`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                    },
                    timeout: 120000,
                }
            );

            const {
                extracted_name,
                extracted_skills,
                extracted_experience,
                extracted_education,
            } = aiResponse.data;

            resume.extracted_name = extracted_name;
            resume.extracted_skills = extracted_skills || [];
            resume.extracted_experience = extracted_experience || [];
            resume.extracted_education = extracted_education || [];

            // ✅ Generate embedding
            const combinedText = [
                extracted_name,
                ...(extracted_skills || []),
                ...(extracted_experience || []),
                ...(extracted_education || []),
            ].join(' ');

            // ✅ Uses environment variable
            const embeddingResponse = await axios.post(
                `${AI_URL}/generate-embedding`,
                { text: combinedText }
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
        return res.status(500).json({
            message: 'Server error during resume upload',
        });
    }
};

// ===============================
// ✅ Match Resume With Job Description
// ===============================
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

        // ✅ Uses environment variable
        const jdResponse = await axios.post(
            `${AI_URL}/generate-embedding`,
            { text: jobDescription }
        );

        const jdEmbedding = jdResponse.data.embedding;

        if (resume.embedding.length !== jdEmbedding.length) {
            return res.status(400).json({
                message: 'Embedding size mismatch',
            });
        }

        // ✅ Cosine similarity
        const similarity = cosineSimilarity(resume.embedding, jdEmbedding);
        const matchPercentage = Math.max(0, Math.min(100, similarity * 100)).toFixed(2);

        // ✅ Skill Matching
        const resumeSkills = resume.extracted_skills.map(s => s.toLowerCase());
        const jobText = jobDescription.toLowerCase();

        const matchingSkills = resumeSkills.filter(skill =>
            jobText.includes(skill)
        );

        const missingSkills = resumeSkills.filter(skill =>
            !jobText.includes(skill)
        );

        const recommendations = generateRecommendations(missingSkills);
        const learningRoadmap = generateRoadmap(recommendations);

        // ✅ Score Label
        let overallScore;
        if (matchPercentage >= 80) {
            overallScore = 'Strong Match';
        } else if (matchPercentage >= 60) {
            overallScore = 'Good Match';
        } else if (matchPercentage >= 40) {
            overallScore = 'Moderate Match';
        } else {
            overallScore = 'Weak Match';
        }

        res.json({
            matchPercentage,
            matchingSkills,
            missingSkills,
            overallScore,
            recommendations,
            learningRoadmap,
        });

    } catch (error) {
        console.error('Matching Error:', error.message);
        res.status(500).json({
            message: 'Server error during matching',
        });
    }
};

module.exports = {
    uploadResume,
    matchJobDescription,
};