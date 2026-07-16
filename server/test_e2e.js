const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Resume = require('./models/Resume');

async function run() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const resume = await Resume.findOne({ status: 'processed' });
        if (!resume) {
            console.log("No processed resume found in database. Cannot run API matching tests.");
            process.exit(0);
        }

        console.log(`Found processed resume with ID: ${resume._id} (${resume.originalFileName})`);
        console.log(`Extracted skills: ${JSON.stringify(resume.extracted_skills)}`);

        // Find the user associated with this resume to generate a JWT token
        const user = await User.findById(resume.user);
        if (!user) {
            console.log("User for resume not found.");
            process.exit(1);
        }

        // Generate a test JWT token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log(`Generated JWT token for user: ${user.email}`);

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 1. Test Match Job Description
        console.log("\n--- Testing POST /api/resumes/match/:resumeId ---");
        const jobDesc = "We are seeking a Backend Developer with extensive experience in Node.js, Express, and PostgreSQL. Familiarity with Docker and REST APIs is required. Machine learning experience is a bonus.";
        
        try {
            const matchRes = await axios.post(`http://localhost:5000/api/resumes/match/${resume._id}`, {
                jobDescription: jobDesc
            }, { headers });
            
            console.log("Match Status:", matchRes.status);
            console.log("Match Percentage:", matchRes.data.matchPercentage + "%");
            console.log("Detected Family:", matchRes.data.detectedFamily);
            console.log("Matching Skills:", matchRes.data.matchingSkills.map(s => s.skill));
            console.log("Missing Skills:", matchRes.data.missingSkills.map(s => s.skill));
            console.log("Overall Score:", matchRes.data.overallScore);
        } catch (err) {
            console.error("Match API Error:", err.response?.data || err.message);
        }

        // 2. Test Career Path Predictor
        console.log("\n--- Testing POST /api/resumes/career-path/:resumeId ---");
        try {
            const careerRes = await axios.post(`http://localhost:5000/api/resumes/career-path/${resume._id}`, {}, { headers });
            console.log("Career Prediction Status:", careerRes.status);
            console.log("Top Career Match:", careerRes.data.topCareerMatch);
            console.log("Dominant Cluster:", careerRes.data.dominantCluster);
            console.log("Dominant Cluster Breakdown:", careerRes.data.clusterBreakdown);
            console.log("First Recommendation Role:", careerRes.data.recommendedRoles?.[0]?.role);
            console.log("First Recommendation Probability:", careerRes.data.recommendedRoles?.[0]?.transitionProbability);
            console.log("Career Summary:", careerRes.data.careerSummary);
        } catch (err) {
            console.error("Career Path API Error:", err.response?.data || err.message);
        }

        console.log("\nTests finished.");
        process.exit(0);
    } catch (err) {
        console.error("E2E Test Error:", err);
        process.exit(1);
    }
}

run();
