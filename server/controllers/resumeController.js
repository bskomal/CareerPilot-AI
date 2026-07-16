const Resume = require('../models/Resume');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cosineSimilarity = require('../utils/cosineSimilarity');
const { generateLearningPath } = require('../utils/learningPathGenerator');
const { getCareerPredictions } = require('../utils/careerPathPredictor');

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
            const absolutePath = path.resolve(req.file.path);
            const formData = new FormData();
            formData.append('file', fs.createReadStream(absolutePath));

            const parseResponse = await axios.post(
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
            } = parseResponse.data;

            resume.extracted_name = extracted_name;
            resume.extracted_skills = extracted_skills || [];
            resume.extracted_experience = extracted_experience || [];
            resume.extracted_education = extracted_education || [];

            const combinedText = full_text || [
                extracted_name,
                ...(extracted_skills || []),
                ...(extracted_experience || []),
                ...(extracted_education || [])
            ].join(' ');

            const embedResponse = await axios.post(
                `${AI_URL}/api/generate-embedding`,
                { text: combinedText },
                { timeout: 120000 }
            );

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
// MATCH JOB DESCRIPTION
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

        // Call centralized FastAPI compute-gaps endpoint (Phase 4 Stronger Design)
        const computeResponse = await axios.post(
            `${AI_URL}/api/compute-gaps`,
            {
                resumeSkills: resume.extracted_skills,
                jobText: jobDescription
            },
            { timeout: 120000 }
        );

        const {
            jobFamily,
            primaryStack,
            secondaryStack,
            required_skills,
            missing_skills,
            matching_skills,
            categorized_gaps,
            stackMaturity,
            stackMaturityBreakdown,
            confidence,
            radarData,
            stackDelta,
            prioritizedGaps
        } = computeResponse.data;

        const detectedFamily = jobFamily.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const familyKey = jobFamily;
        const familyConfidence = Math.round(confidence * 100);

        const requiredSkillsSet = new Set(required_skills.map(s => s.skill.toLowerCase().trim()));
        const bonusSkillsOut = resume.extracted_skills.filter(s => !requiredSkillsSet.has(s.toLowerCase().trim()));

        // Calculate dynamic gaps
        const criticalGaps = categorized_gaps.criticalGaps || [];
        const secondaryGaps = categorized_gaps.secondaryGaps || [];
        const advancedGaps = categorized_gaps.advancedGaps || [];

        // Check if there are no required skills
        if (required_skills.length === 0) {
            return res.status(200).json({
                matchPercentage: "0.00",
                matchingSkills: [],
                missingSkills: [],
                bonusSkills: resume.extracted_skills,
                requiredSkills: [],
                detectedFamily,
                familyConfidence,
                primaryStack: "General Tech Stack",
                secondaryStack: [],
                criticalGaps: [],
                secondaryGaps: [],
                advancedGaps: [],
                learningPath: {},
                recommendations: [],
                learningRoadmap: [],
                stackMaturity: {
                    coreCoverage: 100,
                    devopsCoverage: 100,
                    cloudCoverage: 100,
                    overallReadiness: 0,
                    rawCoverage: 100,
                    weightedCoverage: 100,
                    marketAdjustedReadiness: 0
                },
                prioritizedGaps: [],
                radarData: [],
                stackDelta: {},
                overallScore: "Weak Match",
                atsScore: "0.00",
                message: "No required skills were identified in the job description.",
                seniorityLevel: "mid"
            });
        }

        const seniorityLevel = computeResponse.data.seniorityLevel || 'mid';

        // Generate dynamic 4-week roadmap
        const learningPath = generateLearningPath(
            familyKey,
            primaryStack,
            secondaryStack,
            criticalGaps,
            secondaryGaps,
            advancedGaps,
            seniorityLevel
        );

        // Compile dynamic search URLs for missing skills
        const docLinks = {
            'kubernetes': 'https://kubernetes.io/docs/',
            'docker': 'https://docs.docker.com/',
            'terraform': 'https://developer.hashicorp.com/terraform/docs',
            'aws': 'https://aws.amazon.com/getting-started/',
            'gcp': 'https://cloud.google.com/docs',
            'azure': 'https://learn.microsoft.com/en-us/azure/',
            'python': 'https://docs.python.org/3/',
            'javascript': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
            'typescript': 'https://www.typescriptlang.org/docs/',
            'react': 'https://react.dev/',
            'node.js': 'https://nodejs.org/docs/',
            'express': 'https://expressjs.com/',
            'mongodb': 'https://www.mongodb.com/docs/',
            'redis': 'https://redis.io/docs/',
            'git': 'https://git-scm.com/doc',
            'fastapi': 'https://fastapi.tiangolo.com/',
            'flask': 'https://flask.palletsprojects.com/',
            'django': 'https://docs.djangoproject.com/',
            'postgres': 'https://www.postgresql.org/docs/',
            'postgresql': 'https://www.postgresql.org/docs/',
            'sql': 'https://www.w3schools.com/sql/',
            'scikit-learn': 'https://scikit-learn.org/stable/',
            'tensorflow': 'https://www.tensorflow.org/api_docs',
            'pytorch': 'https://pytorch.org/docs/stable/index.html',
            'ci/cd': 'https://www.redhat.com/en/topics/devops/what-is-ci-cd'
        };

        const recommendations = missing_skills.map(skillObj => {
            const skillName = typeof skillObj === 'string' ? skillObj : skillObj.skill;
            const clean = skillName.trim();
            const lower = clean.toLowerCase();
            
            const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(clean)}+tutorial`;
            const udemyUrl = `https://www.udemy.com/courses/search/?q=${encodeURIComponent(clean)}`;
            const courseraUrl = `https://www.coursera.org/search?query=${encodeURIComponent(clean)}`;
            const docUrl = docLinks[lower] || `https://www.google.com/search?q=${encodeURIComponent(clean)}+official+documentation`;
            
            return {
                skill: clean,
                youtubeUrl,
                udemyUrl,
                courseraUrl,
                docUrl
            };
        });

        // Helper string roadmap list
        const learningRoadmap = [
            `Week 1 (${learningPath.week1.focus}): ${learningPath.week1.skills.join(', ')}`,
            `Week 2 (${learningPath.week2.focus}): ${learningPath.week2.skills.join(', ')}`,
            `Week 3 (${learningPath.week3.focus}): ${learningPath.week3.skills.join(', ')}`,
            `Week 4 (${learningPath.week4.focus}): ${learningPath.week4.projectSuggestion}`
        ];

        const overallReadiness = stackMaturity.overallReadiness;
        const matchPercentage = overallReadiness.toFixed(2);
        const atsScore = matchPercentage;

        let overallScore;
        if (overallReadiness >= 75) overallScore = 'Strong Match';
        else if (overallReadiness >= 55) overallScore = 'Good Match';
        else if (overallReadiness >= 35) overallScore = 'Moderate Match';
        else overallScore = 'Weak Match';

        res.json({
            matchPercentage,
            matchingSkills: matching_skills,
            missingSkills: missing_skills,
            bonusSkills: bonusSkillsOut,
            requiredSkills: required_skills,
            detectedFamily,
            familyConfidence,
            primaryStack,
            secondaryStack,
            criticalGaps,
            secondaryGaps,
            advancedGaps,
            learningPath,
            recommendations,
            learningRoadmap,
            stackMaturity,
            stackMaturityBreakdown: stackMaturityBreakdown || {},
            overallScore,
            atsScore,
            seniorityLevel,
            prioritizedGaps: prioritizedGaps || [],
            radarData: radarData || [],
            stackDelta: stackDelta || {}
        });

    } catch (error) {
        console.error('Matching Error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Server error during matching',
            error: error.message
        });
    }
};

// ============================
// PREDICT CAREER PATH (PHASE 7)
// ============================
const predictCareerPath = async (req, res) => {
    try {
        const { resumeId } = req.params;
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

        const predictions = await getCareerPredictions(resume);
        res.json(predictions);

    } catch (error) {
        console.error('Career Path Prediction Error:', error.message);
        res.status(500).json({
            message: 'Server error during career path prediction',
            error: error.message
        });
    }
};

// ============================
// COMPARE MULTIPLE JOB DESCRIPTIONS
// ============================
const compareJobDescriptions = async (req, res) => {
    try {
        const { resumeId } = req.params;
        const { jobDescriptions } = req.body;

        if (!jobDescriptions || !Array.isArray(jobDescriptions) || jobDescriptions.length === 0) {
            return res.status(400).json({ message: 'jobDescriptions array is required' });
        }

        const resume = await Resume.findById(resumeId);
        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        const comparisons = await Promise.all(jobDescriptions.map(async (jd) => {
            try {
                const response = await axios.post(`${AI_URL}/api/compute-gaps`, {
                    resumeSkills: resume.extracted_skills,
                    jobText: jd
                }, { timeout: 120000 });

                const {
                    jobFamily,
                    primaryStack,
                    secondaryStack,
                    required_skills,
                    missing_skills,
                    matching_skills,
                    stackMaturity,
                    confidence,
                    stackDelta,
                    radarData,
                    seniorityLevel
                } = response.data;

                const detectedFamily = jobFamily.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                const prioritizedGaps = response.data.prioritizedGaps || [];

                return {
                    jobFamily: detectedFamily,
                    familyKey: jobFamily,
                    seniorityLevel,
                    primaryStack,
                    secondaryStack,
                    weightedCoverage: stackMaturity.weightedCoverage,
                    overallReadiness: stackMaturity.overallReadiness,
                    marketAdjustedReadiness: stackMaturity.marketAdjustedReadiness || 0,
                    confidence: Math.round(confidence * 100),
                    missingSkills: missing_skills.map(s => typeof s === 'string' ? s : s.skill),
                    prioritizedGaps,
                    stackDelta,
                    radarData
                };
            } catch (err) {
                console.error('Error comparing single JD:', err.message);
                return {
                    jobFamily: "Unknown",
                    familyKey: "unknown",
                    seniorityLevel: "mid",
                    primaryStack: "General Tech Stack",
                    secondaryStack: [],
                    weightedCoverage: 0,
                    overallReadiness: 0,
                    marketAdjustedReadiness: 0,
                    confidence: 0,
                    missingSkills: [],
                    prioritizedGaps: [],
                    stackDelta: {},
                    radarData: []
                };
            }
        }));

        // Compute bestFitJob (highest weightedCoverage)
        let bestFitJob = comparisons[0];
        comparisons.forEach(item => {
            if (item.weightedCoverage > bestFitJob.weightedCoverage) {
                bestFitJob = item;
            }
        });

        // Compute closestTransitionJob (highest coverage with different jobFamily from current)
        const currentFamilyName = comparisons[0]?.stackDelta.fromFamily;
        let closestTransitionJob = null;
        let maxTransCoverage = -1;

        comparisons.forEach(item => {
            if (item.jobFamily !== currentFamilyName) {
                if (item.weightedCoverage > maxTransCoverage) {
                    maxTransCoverage = item.weightedCoverage;
                    closestTransitionJob = item;
                }
            }
        });

        // Compute hardestGapJob (lowest weightedCoverage)
        let hardestGapJob = comparisons[0];
        comparisons.forEach(item => {
            if (item.weightedCoverage < hardestGapJob.weightedCoverage) {
                hardestGapJob = item;
            }
        });

        res.json({
            comparisons,
            bestFitJob,
            closestTransitionJob,
            hardestGapJob
        });

    } catch (error) {
        console.error('Comparison Route Error:', error.message);
        res.status(500).json({
            message: 'Server error during comparison',
            error: error.message
        });
    }
};

// ============================
// PLAN CAREER TRANSITION
// ============================
const planCareerTransition = async (req, res) => {
    try {
        const { resumeId } = req.params;
        const { targetJobDescription } = req.body;

        if (!targetJobDescription) {
            return res.status(400).json({ message: 'targetJobDescription is required' });
        }

        const resume = await Resume.findById(resumeId);
        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        const response = await axios.post(`${AI_URL}/api/compute-transition-plan`, {
            resumeSkills: resume.extracted_skills,
            targetJobText: targetJobDescription
        }, { timeout: 120000 });

        res.json(response.data);

    } catch (error) {
        console.error('Transition Plan Route Error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Server error during transition planning',
            error: error.message
        });
    }
};

module.exports = {
    uploadResume,
    matchJobDescription,
    predictCareerPath,
    compareJobDescriptions,
    planCareerTransition
};