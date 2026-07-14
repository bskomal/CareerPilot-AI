const axios = require('axios');
const cosineSimilarity = require('./cosineSimilarity');
const { generateRecommendations, generateRoadmap } = require('./recommendationEngine');

// AI Service URL from environment
const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const roleCatalog = {
    "Backend Developer": {
        role: "Backend Developer",
        cluster: "Software Engineering",
        skills: ["node.js", "express", "javascript", "mongodb", "sql", "rest", "api", "git", "redis"],
        description: "Responsible for server-side web application logic, database management, API design, and integration of frontend elements.",
        reason: "Your background in server-side development, databases, and APIs aligns well with Backend Development."
    },
    "Frontend Developer": {
        role: "Frontend Developer",
        cluster: "Software Engineering",
        skills: ["react", "javascript", "typescript", "html", "css", "tailwind", "vite", "git"],
        description: "Focuses on building the user-facing side of web applications, creating interactive user interfaces and responsive layouts.",
        reason: "Your experience with user interface libraries, design frameworks, and frontend scripting is a great fit for Frontend roles."
    },
    "Fullstack Developer": {
        role: "Fullstack Developer",
        cluster: "Software Engineering",
        skills: ["react", "node.js", "express", "javascript", "typescript", "mongodb", "sql", "git", "rest", "api"],
        description: "Comfortable working with both front-end and back-end technologies, handling everything from user interface components to databases.",
        reason: "Your diverse skill set across frontend and backend technologies makes you a highly versatile candidate for Fullstack positions."
    },
    "Mobile Developer": {
        role: "Mobile Developer",
        cluster: "Software Engineering",
        skills: ["javascript", "typescript", "react", "git", "rest", "api"],
        description: "Develops applications for mobile platforms like iOS and Android, focusing on mobile UI, local storage, and server communication.",
        reason: "Your skills in cross-platform frameworks and web tech can easily transition to mobile application development."
    },
    "Data Scientist": {
        role: "Data Scientist",
        cluster: "Data & AI",
        skills: ["python", "sql", "machine learning", "data science", "git"],
        description: "Analyzes complex data sets to discover patterns, build predictive models, and provide actionable insights for decision-making.",
        reason: "Your analytical mindset and programming skills in python and data querying align with Data Science roles."
    },
    "Machine Learning Engineer": {
        role: "Machine Learning Engineer",
        cluster: "Data & AI",
        skills: ["python", "machine learning", "data science", "git", "docker", "api"],
        description: "Designs, builds, and deploys machine learning models and systems to automate tasks and make predictions at scale.",
        reason: "Your experience with python, modeling, and software engineering is highly suited for Machine Learning engineering."
    },
    "Data Engineer": {
        role: "Data Engineer",
        cluster: "Data & AI",
        skills: ["python", "sql", "postgresql", "mongodb", "mysql", "aws", "docker", "git"],
        description: "Builds and maintains pipelines that collect, clean, and store data, ensuring high performance and availability of data systems.",
        reason: "Your strength in databases, query optimization, and structured pipelines is ideal for Data Engineering."
    },
    "AI Engineer": {
        role: "AI Engineer",
        cluster: "Data & AI",
        skills: ["python", "javascript", "machine learning", "fastapi", "api", "git", "docker"],
        description: "Integrates artificial intelligence models into production systems, building backend endpoints and interfaces around AI models.",
        reason: "Your combination of backend experience and AI service integration positions you well as an AI Engineer."
    },
    "DevOps Engineer": {
        role: "DevOps Engineer",
        cluster: "Cloud & DevOps",
        skills: ["docker", "kubernetes", "aws", "git", "ci/cd", "jenkins", "terraform", "linux"],
        description: "Bridges the gap between development and operations, automating build pipelines, monitoring servers, and maintaining infrastructure.",
        reason: "Your proficiency in containerization, cloud hosting, and automation matches the requirements for DevOps engineering."
    },
    "Cloud Architect": {
        role: "Cloud Architect",
        cluster: "Cloud & DevOps",
        skills: ["aws", "terraform", "docker", "kubernetes", "linux", "sql"],
        description: "Designs and plans cloud computing strategies, cloud architecture patterns, and manages migration and cost optimizations.",
        reason: "Your extensive knowledge of cloud services and system configurations qualifies you for architectural design roles."
    },
    "System Administrator": {
        role: "System Administrator",
        cluster: "Cloud & DevOps",
        skills: ["linux", "git", "docker", "aws"],
        description: "Installs, configures, and maintains server systems, network settings, and operational tools for development teams.",
        reason: "Your technical background in operating systems and cloud services is key for System Administration roles."
    },
    "Site Reliability Engineer (SRE)": {
        role: "Site Reliability Engineer (SRE)",
        cluster: "Cloud & DevOps",
        skills: ["docker", "kubernetes", "aws", "ci/cd", "terraform", "linux", "python", "git"],
        description: "Applies software engineering principles to operations, focusing on system reliability, uptime, performance, and automation.",
        reason: "Your combination of software development skills and operations practices makes you an excellent SRE fit."
    },
    "Product Manager": {
        role: "Product Manager",
        cluster: "Product & Management",
        skills: ["agile", "git", "rest", "api"],
        description: "Guides the development of a product from conception to launch, defining product strategy, requirements, and coordinating cross-functional teams.",
        reason: "Your understanding of web APIs and technical lifecycle qualifies you to transition towards Product Management."
    },
    "Scrum Master": {
        role: "Scrum Master",
        cluster: "Product & Management",
        skills: ["agile", "git"],
        description: "Facilitates agile processes and scrum methodology, removing team blockers and ensuring smooth delivery cycles.",
        reason: "Your experience working with agile teams makes you well-suited to support teams as a Scrum Master."
    },
    "Technical Product Manager": {
        role: "Technical Product Manager",
        cluster: "Product & Management",
        skills: ["agile", "sql", "git", "rest", "api", "python"],
        description: "Combines technical understanding with product management principles, leading product strategy for highly technical APIs and platforms.",
        reason: "Your solid technical background combined with knowledge of processes is ideal for Technical Product Management."
    },
    "Engineering Manager": {
        role: "Engineering Manager",
        cluster: "Product & Management",
        skills: ["agile", "git", "rest", "node.js", "javascript"],
        description: "Leads engineering teams technically and managerially, mentoring engineers, organizing sprints, and aligning engineering with business goals.",
        reason: "Your senior-level developer experience and collaborative skills prepare you for engineering leadership."
    }
};

const roleEmbeddingCache = {};

/**
 * Returns the catalog of roles.
 */
function getRoleCatalog() {
    return roleCatalog;
}

/**
 * Generates/fetches embedding for a given role and caches it in memory.
 */
async function getRoleEmbedding(roleName, description) {
    if (roleEmbeddingCache[roleName]) {
        return roleEmbeddingCache[roleName];
    }
    try {
        const response = await axios.post(`${AI_URL}/api/generate-embedding`, {
            text: description
        }, { timeout: 120000 });
        
        const embedding = response.data.embedding;
        if (embedding && Array.isArray(embedding)) {
            roleEmbeddingCache[roleName] = embedding;
            return embedding;
        }
        throw new Error('Invalid embedding response');
    } catch (error) {
        console.error(`Error generating embedding for role ${roleName}:`, error.message);
        // Fallback dummy embedding (384 zeros) if AI service is down
        return new Array(384).fill(0);
    }
}

/**
 * Computes the transition score based on semantic similarity and skill overlap.
 */
function computeTransitionScore(similarity, skillOverlapScore) {
    return (similarity * 0.6) + (skillOverlapScore * 0.4);
}

/**
 * Builds the career roadmap for missing skills using recommendation engine.
 */
function buildCareerRoadmap(missingSkills) {
    return generateRoadmap(generateRecommendations(missingSkills));
}

/**
 * Generates comprehensive career predictions for a resume.
 */
async function getCareerPredictions(resume) {
    const candidateName = resume.extracted_name || "Candidate";
    const candidateSkills = (resume.extracted_skills || []).map(s => s.toLowerCase());

    const roles = Object.keys(roleCatalog);
    const scoredRoles = [];

    for (const roleName of roles) {
        const roleInfo = roleCatalog[roleName];
        
        // Get embedding (cached or generated)
        const roleEmbedding = await getRoleEmbedding(roleName, roleInfo.description);
        
        // Compute cosine similarity
        const similarity = cosineSimilarity(resume.embedding, roleEmbedding);
        
        // Compute skill overlap
        const roleSkillsLower = roleInfo.skills.map(s => s.toLowerCase());
        const matchingSkills = roleSkillsLower.filter(s => candidateSkills.includes(s));
        const missingSkills = roleSkillsLower.filter(s => !candidateSkills.includes(s));
        
        const skillOverlap = roleInfo.skills.length > 0 
            ? matchingSkills.length / roleInfo.skills.length 
            : 1.0;
            
        // Calculate combined score
        const prob = computeTransitionScore(similarity, skillOverlap);
        
        scoredRoles.push({
            role: roleName,
            cluster: roleInfo.cluster,
            similarityScore: similarity,
            skillOverlapScore: skillOverlap,
            transitionProbability: prob,
            matchingSkills: roleInfo.skills.filter(s => candidateSkills.includes(s.toLowerCase())),
            missingSkills: roleInfo.skills.filter(s => !candidateSkills.includes(s.toLowerCase())),
            reason: roleInfo.reason
        });
    }

    // Sort roles descending by transition probability
    scoredRoles.sort((a, b) => b.transitionProbability - a.transitionProbability);

    // Group by cluster to determine dominant cluster and cluster scores
    const clusterScores = {};
    for (const roleData of scoredRoles) {
        if (!clusterScores[roleData.cluster]) {
            clusterScores[roleData.cluster] = { sum: 0, count: 0 };
        }
        clusterScores[roleData.cluster].sum += roleData.transitionProbability;
        clusterScores[roleData.cluster].count += 1;
    }

    const clusterBreakdown = Object.keys(clusterScores).map(clusterName => {
        const avg = clusterScores[clusterName].sum / clusterScores[clusterName].count;
        return {
            cluster: clusterName,
            score: parseFloat((avg * 100).toFixed(2))
        };
    }).sort((a, b) => b.score - a.score);

    const dominantCluster = clusterBreakdown[0]?.cluster || "Software Engineering";

    // Format top 3 roles as recommendedRoles
    const recommendedRoles = scoredRoles.slice(0, 3).map(r => {
        const nextSteps = buildCareerRoadmap(r.missingSkills);
        return {
            role: r.role,
            cluster: r.cluster,
            transitionProbability: (r.transitionProbability * 100).toFixed(2) + "%",
            similarityScore: (r.similarityScore * 100).toFixed(2) + "%",
            skillOverlapScore: (r.skillOverlapScore * 100).toFixed(2) + "%",
            matchingSkills: r.matchingSkills,
            missingSkills: r.missingSkills,
            reason: r.reason,
            nextSteps: nextSteps.length > 0 ? nextSteps : ["Maintain existing skills and update resume"]
        };
    });

    // Format next 3 roles as adjacentRoles
    const adjacentRoles = scoredRoles.slice(3, 6).map(r => {
        return {
            role: r.role,
            cluster: r.cluster,
            transitionProbability: (r.transitionProbability * 100).toFixed(2) + "%",
            reason: r.reason
        };
    });

    const topCareerMatch = recommendedRoles[0]?.role || "Backend Developer";

    // Dynamic career summary
    const allMissingSkills = Array.from(new Set(recommendedRoles.flatMap(r => r.missingSkills)));
    const skillListStr = allMissingSkills.slice(0, 3).join(', ');
    const careerSummary = `${candidateName} demonstrates a strong profile aligned with the ${dominantCluster} cluster, showing the highest transition potential towards ${topCareerMatch}. While the candidate has solid foundations, key growth opportunities exist by acquiring skills such as ${skillListStr || 'specialized cloud or operations practices'} to successfully transition to highly adjacent roles.`;

    return {
        resumeId: resume._id.toString(),
        candidateName,
        dominantCluster,
        clusterBreakdown,
        recommendedRoles,
        adjacentRoles,
        careerSummary,
        topCareerMatch
    };
}

module.exports = {
    getRoleCatalog,
    getRoleEmbedding,
    computeTransitionScore,
    buildCareerRoadmap,
    getCareerPredictions,
    roleEmbeddingCache // Export for testing/resetting if needed
};
