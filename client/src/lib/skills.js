/**
 * Local database keyword matching to bucket skills.
 */
const CATEGORIES = {
    "Frontend": ["react", "next.js", "angular", "vue", "javascript", "typescript", "html", "css", "tailwind", "vite", "sass", "less", "flutter", "react native"],
    "Backend": ["node.js", "express", "fastapi", "flask", "django", "spring", "java", "c++", "c#", "go", "ruby", "php", "sql", "mysql", "postgresql", "mongodb", "redis", "graphql", "rest", "api", "backend"],
    "DevOps": ["docker", "kubernetes", "aws", "azure", "gcp", "terraform", "jenkins", "ci/cd", "github actions", "linux", "bash", "nginx", "cloud"],
    "Data & AI": ["python", "machine learning", "data science", "deep learning", "pytorch", "tensorflow", "pandas", "numpy", "nlp", "ai", "spacy"],
    "Tools & Agile": ["git", "agile", "jira", "scrum", "postman", "figma", "slack", "trello"]
};

/**
 * Categorize list of skills into buckets.
 * @param {string[]} skills - Array of lowercase skill strings
 * @returns {Object} Object mapping category names to arrays of matching skills
 */
export function categorizeSkills(skills) {
    const buckets = {
        "Frontend": [],
        "Backend": [],
        "DevOps": [],
        "Data & AI": [],
        "Tools & Agile": []
    };

    if (!skills || !Array.isArray(skills)) return buckets;

    skills.forEach(skill => {
        const lower = skill.toLowerCase().trim();
        let matched = false;
        for (const [catName, keywords] of Object.entries(CATEGORIES)) {
            if (keywords.some(keyword => lower.includes(keyword) || keyword.includes(lower))) {
                buckets[catName].push(skill);
                matched = true;
                break;
            }
        }
        // Default to Tools & Agile if no match
        if (!matched) {
            buckets["Tools & Agile"].push(skill);
        }
    });

    return buckets;
}

/**
 * Computes the Profile Strength (ATS Score) from 0 to 100 based on resume data.
 * @param {Object} resume - The resume object
 * @returns {number} Score between 0 and 100
 */
export function computeATSScore(resume) {
    if (!resume) return 0;
    
    let score = 0;
    
    // 1. Name present (+20)
    if (resume.extracted_name && resume.extracted_name.toLowerCase() !== 'unknown') {
        score += 20;
    }
    
    // 2. Core skills count scaled up to 12 (+40)
    const skills = resume.extracted_skills || [];
    const skillRatio = Math.min(skills.length / 12, 1);
    score += Math.round(skillRatio * 40);
    
    // 3. Experience present (+20)
    const exp = resume.extracted_experience || [];
    if (exp.length > 0 && exp[0] && exp[0].trim().length > 10) {
        score += 20;
    }
    
    // 4. Education present (+10)
    const edu = resume.extracted_education || [];
    if (edu.length > 0 && edu[0] && edu[0].trim().length > 10) {
        score += 10;
    }
    
    // 5. Embedding present (+10)
    const embed = resume.embedding || [];
    if (embed.length > 0) {
        score += 10;
    }
    
    return Math.min(95, score);
}

/**
 * Aggregates missing skills across match history to find top recurring gaps.
 * @param {Object[]} history - Local storage history items
 * @returns {Object[]} Array of top 3 recurring gaps: { skill, count }
 */
export function aggregateRecurringGaps(history) {
    if (!history || !Array.isArray(history) || history.length === 0) return [];
    
    const countMap = {};
    history.forEach(item => {
        const gaps = item.missingSkills || [];
        gaps.forEach(gap => {
            const skillName = typeof gap === 'string' ? gap : (gap.skill || '');
            const lower = skillName.trim().toLowerCase();
            if (lower) {
                countMap[lower] = (countMap[lower] || 0) + 1;
            }
        });
    });
    
    return Object.entries(countMap)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
}
