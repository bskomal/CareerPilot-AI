/**
 * Skill Gap Recommendation Engine Utility
 */

const skillDatabase = {
    "aws": {
        priority: "High",
        difficulty: "Hard",
        estimatedWeeks: 8,
        reason: "Essential for cloud infrastructure, hosting, and modern DevOps operations.",
        resource: "https://aws.amazon.com/getting-started/"
    },
    "docker": {
        priority: "High",
        difficulty: "Medium",
        estimatedWeeks: 3,
        reason: "Crucial for containerizing applications and ensuring environment consistency across dev and prod.",
        resource: "https://docs.docker.com/get-started/"
    },
    "kubernetes": {
        priority: "High",
        difficulty: "Hard",
        estimatedWeeks: 6,
        reason: "Industry standard for container orchestration and scaling microservices.",
        resource: "https://kubernetes.io/docs/tutorials/"
    },
    "python": {
        priority: "Medium",
        difficulty: "Easy",
        estimatedWeeks: 4,
        reason: "Highly versatile language used for backend, data science, automation, and AI/ML development.",
        resource: "https://docs.python.org/3/tutorial/"
    },
    "node.js": {
        priority: "High",
        difficulty: "Medium",
        estimatedWeeks: 4,
        reason: "Core backend runtime environment for running JavaScript server-side applications.",
        resource: "https://nodejs.org/en/learn"
    },
    "mongodb": {
        priority: "Medium",
        difficulty: "Easy",
        estimatedWeeks: 2,
        reason: "Popular NoSQL database used widely for flexible and scale-out document storage.",
        resource: "https://university.mongodb.com/"
    },
    "sql": {
        priority: "High",
        difficulty: "Medium",
        estimatedWeeks: 3,
        reason: "Fundamental database language for relational data management and analysis.",
        resource: "https://www.w3schools.com/sql/"
    },
    "redis": {
        priority: "Medium",
        difficulty: "Medium",
        estimatedWeeks: 2,
        reason: "Highly efficient in-memory data store used for caching and session management.",
        resource: "https://redis.io/docs/"
    },
    "git": {
        priority: "High",
        difficulty: "Easy",
        estimatedWeeks: 1,
        reason: "Standard version control system essential for collaborative software development.",
        resource: "https://git-scm.com/doc"
    },
    "rest": {
        priority: "High",
        difficulty: "Easy",
        estimatedWeeks: 2,
        reason: "Fundamental API design style for modern web services communication.",
        resource: "https://restfulapi.net/"
    },
    "javascript": {
        priority: "High",
        difficulty: "Easy",
        estimatedWeeks: 4,
        reason: "The core programming language of the web, required for both frontend and backend development.",
        resource: "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
    },
    "react": {
        priority: "High",
        difficulty: "Medium",
        estimatedWeeks: 5,
        reason: "Leading frontend library for building highly interactive and modern user interfaces.",
        resource: "https://react.dev/learn"
    },
    "graphql": {
        priority: "Medium",
        difficulty: "Medium",
        estimatedWeeks: 3,
        reason: "Flexible query language for APIs providing a modern alternative to REST.",
        resource: "https://graphql.org/learn/"
    },
    "ci/cd": {
        priority: "High",
        difficulty: "Medium",
        estimatedWeeks: 3,
        reason: "Critical practice for automating software builds, testing, and deployments.",
        resource: "https://www.redhat.com/en/topics/devops/what-is-ci-cd"
    },
    "agile": {
        priority: "Low",
        difficulty: "Easy",
        estimatedWeeks: 1,
        reason: "Widely adopted methodology for collaborative project management and software development.",
        resource: "https://www.atlassian.com/agile"
    },
    "linux": {
        priority: "Medium",
        difficulty: "Medium",
        estimatedWeeks: 3,
        reason: "The foundation of server operating systems, container runtimes, and cloud environments.",
        resource: "https://ubuntu.com/tutorials"
    },
    "terraform": {
        priority: "Medium",
        difficulty: "Hard",
        estimatedWeeks: 4,
        reason: "Industry standard Infrastructure as Code (IaC) tool for provisioning cloud resources.",
        resource: "https://developer.hashicorp.com/terraform/tutorials"
    },
    "jenkins": {
        priority: "Medium",
        difficulty: "Medium",
        estimatedWeeks: 3,
        reason: "Open-source automation server commonly used to build CI/CD pipelines.",
        resource: "https://www.jenkins.io/doc/"
    },
    "typescript": {
        priority: "High",
        difficulty: "Medium",
        estimatedWeeks: 3,
        reason: "Strict syntactical superset of JavaScript adding optional static typing and better tooling.",
        resource: "https://www.typescriptlang.org/docs/"
    },
    "express": {
        priority: "High",
        difficulty: "Easy",
        estimatedWeeks: 2,
        reason: "Minimal and flexible Node.js web application framework for building APIs.",
        resource: "https://expressjs.com/"
    }
};

/**
 * Maps each missing skill to its recommendation data, falling back to default values if not in database.
 * Sorts the final recommendations array by priority (High > Medium > Low).
 * @param {string[]} missingSkills - Array of missing skills
 * @returns {Object[]} Sorted array of recommendation objects
 */
function generateRecommendations(missingSkills) {
    if (!missingSkills || !Array.isArray(missingSkills) || missingSkills.length === 0) {
        return [];
    }

    const recommendations = missingSkills.map(skill => {
        const trimmedSkill = skill.trim();
        const skillLower = trimmedSkill.toLowerCase();
        
        if (skillDatabase[skillLower]) {
            return {
                skill: trimmedSkill,
                ...skillDatabase[skillLower]
            };
        } else {
            return {
                skill: trimmedSkill,
                priority: "Medium",
                difficulty: "Medium",
                estimatedWeeks: 2,
                reason: "Valuable skill for career growth",
                resource: "https://www.google.com/search?q=learn+" + trimmedSkill
            };
        }
    });

    const priorityOrder = {
        "High": 3,
        "Medium": 2,
        "Low": 1
    };

    recommendations.sort((a, b) => {
        const orderA = priorityOrder[a.priority] || 0;
        const orderB = priorityOrder[b.priority] || 0;
        return orderB - orderA;
    });

    return recommendations;
}

/**
 * Converts sorted recommendations into a step-by-step roadmap array.
 * @param {Object[]} recommendations - Sorted recommendations array
 * @returns {string[]} Step-by-step learning roadmap steps
 */
function generateRoadmap(recommendations) {
    if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
        return [];
    }

    return recommendations.map((rec, index) => {
        const skillName = rec.skill;
        let formattedName = skillName;
        // Simple heuristic to uppercase short acronyms (e.g. aws, sql, git, rest, etc.)
        if (skillName.length <= 3) {
            formattedName = skillName.toUpperCase();
        } else {
            formattedName = skillName.charAt(0).toUpperCase() + skillName.slice(1);
        }
        return `Step ${index + 1}: Learn ${formattedName}`;
    });
}

module.exports = {
    skillDatabase,
    generateRecommendations,
    generateRoadmap
};
