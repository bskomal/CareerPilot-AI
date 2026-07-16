/**
 * Dynamic Learning Path & Project Generator
 */

function generateLearningPath(jobFamily, primaryStack, secondaryStack, criticalGaps, secondaryGaps, advancedGaps, seniorityLevel = 'mid') {
    // 1. Classify gaps into categories
    const week1Skills = [];
    const week2Skills = [];
    const week3Skills = [];
    
    const languages = new Set([
        'javascript', 'typescript', 'python', 'java', 'go', 'golang', 'c++', 'c#', 'c', 
        'r programming', 'r', 'solidity', 'dart', 'kotlin', 'swift', 'sql', 'html', 'css', 
        'bash', 'shell', 'assembly', 'php', 'ruby'
    ]);
    
    const frameworks = new Set([
        'react', 'vue', 'angular', 'express', 'express.js', 'django', 'spring boot', 'laravel', 
        'fastapi', 'flask', 'tailwind css', 'tailwind', 'bootstrap', 'sass', 'redux', 'zustand',
        'unity', 'unreal engine', 'godot', 'next.js', 'pandas', 'numpy', 'scikit-learn', 
        'tensorflow', 'pytorch', 'keras', 'hugging face', 'transformers', 'd3.js', 
        'three.js', 'recharts', 'socket.io', 'websockets'
    ]);
    
    // Combine gaps for week assignments
    const allGaps = [...criticalGaps, ...secondaryGaps, ...advancedGaps];
    const seen = new Set();
    
    allGaps.forEach(skill => {
        const trimmed = skill.trim();
        const lower = trimmed.toLowerCase();
        if (seen.has(lower)) return;
        seen.add(lower);
        
        if (languages.has(lower)) {
            week1Skills.push(trimmed);
        } else if (frameworks.has(lower)) {
            week2Skills.push(trimmed);
        } else {
            week3Skills.push(trimmed);
        }
    });
    
    // Family-specific fallback values if no gaps exist in a category
    const familyLower = (jobFamily || "").toLowerCase();
    
    if (week1Skills.length === 0) {
        if (familyLower.includes("data") || familyLower.includes("ml") || familyLower.includes("ai")) {
            week1Skills.push("Python data structures and advanced statistics");
        } else if (familyLower.includes("frontend") || familyLower.includes("ux")) {
            week1Skills.push("Advanced TypeScript types and modern ES6+ paradigms");
        } else {
            week1Skills.push("Software engineering design patterns and algorithmic optimization");
        }
    }
    
    if (week2Skills.length === 0) {
        if (familyLower.includes("data") || familyLower.includes("ml") || familyLower.includes("ai")) {
            week2Skills.push("Feature engineering workflows and predictive pipeline models");
        } else if (familyLower.includes("frontend") || familyLower.includes("ux")) {
            week2Skills.push("State management libraries (Redux/Zustand) and virtual DOM optimization");
        } else {
            week2Skills.push("REST/GraphQL API architecture design and transaction management");
        }
    }
    
    if (week3Skills.length === 0) {
        if (familyLower.includes("devops") || familyLower.includes("cloud")) {
            week3Skills.push("Infrastructure provisioning with Terraform and Kubernetes orchestration");
        } else {
            week3Skills.push("Docker containerization, CI/CD automated test pipelines, and health monitoring");
        }
    }
    
    // 2. Dynamic project recommendation builder
    let projectSuggestion = "";
    
    // Find missing advanced tools to inject
    const advancedTools = advancedGaps.length > 0 
        ? advancedGaps.slice(0, 2).join(" and ") 
        : (secondaryStack && secondaryStack.length > 0 ? secondaryStack.slice(0, 2).join(" and ") : "Docker");
        
    const stackText = primaryStack || "target tech stack";
    
    if (familyLower.includes("devops") || familyLower.includes("cloud")) {
        projectSuggestion = `Deploy a highly-available, containerized microservice infrastructure using the ${stackText} stack, provisioned programmatically with ${advancedTools}, and monitored live via Prometheus and Grafana.`;
    } else if (familyLower.includes("data_scientist") || familyLower.includes("ml_engineer") || familyLower.includes("ai_engineer")) {
        projectSuggestion = `Build and deploy an end-to-end ${stackText} pipeline featuring automated feature extraction, model optimization, and a FastAPI inference server containerized with ${advancedTools}.`;
    } else if (familyLower.includes("frontend") || familyLower.includes("ux")) {
        projectSuggestion = `Develop a highly interactive, responsive web dashboard using the ${stackText} framework with robust client state management, styled with Tailwind, and integrated with testing tools like Jest or Cypress.`;
    } else if (familyLower.includes("cybersecurity")) {
        projectSuggestion = `Configure a secure hosting sandbox featuring active firewalls, SIEM logging integration, intrusion detection systems, and vulnerability mitigation protocols targeting OWASP threats.`;
    } else if (familyLower.includes("blockchain")) {
        projectSuggestion = `Build and deploy a decentralized application featuring secure smart contracts using the ${stackText} protocol, integrating Web3 wallets and gas optimization scripts.`;
    } else if (familyLower.includes("embedded")) {
        projectSuggestion = `Develop a bare-metal firmware application that interfaces with hardware sensors using SPI/I2C protocols, optimized for low power utilization and runtime responsiveness.`;
    } else {
        // Backend / Fullstack / Default
        projectSuggestion = `Design and implement a secure, scalable production-ready ${stackText} API featuring JWT authentication, database clustering, caching layers, and a deployment pipeline using ${advancedTools}.`;
    }
    
    // 3. Adjust complexity based on Seniority Level
    if (seniorityLevel === 'junior') {
        projectSuggestion = "Develop a baseline portfolio application: " + projectSuggestion
            .replace("Design and implement a secure, scalable production-ready", "Create a basic")
            .replace("Deploy a highly-available, containerized microservice", "Deploy a single-container")
            .replace("Build and deploy an end-to-end", "Create a local")
            .replace("Develop a highly interactive, responsive", "Build a simple, clean")
            .replace("Configure a secure hosting sandbox", "Build a virtual machine environment with basic firewalls")
            .replace("Build and deploy a decentralized application", "Create a basic smart contract app");
    } else if (seniorityLevel === 'senior') {
        projectSuggestion = "Architect and deploy an enterprise-grade system: " + projectSuggestion
            .replace("Design and implement a secure, scalable production-ready", "Architect a high-scale, fault-tolerant")
            .replace("Deploy a highly-available, containerized microservice", "Design and coordinate a multi-region, automated container orchestration")
            .replace("Build and deploy an end-to-end", "Architect a distributed, real-time batch and stream")
            .replace("Develop a highly interactive, responsive", "Design an enterprise-level modular, micro-frontend")
            .replace("Configure a secure hosting sandbox", "Implement a zero-trust enterprise security posture")
            .replace("Build and deploy a decentralized application", "Architect an enterprise-scale decentralized protocol");
    } else {
        projectSuggestion = "Develop a production-ready application: " + projectSuggestion;
    }
    
    return {
        week1: { focus: "Core Language Mastery", skills: week1Skills },
        week2: { focus: "Framework & Architecture", skills: week2Skills },
        week3: { focus: "Deployment & DevOps", skills: week3Skills },
        week4: { focus: "Project + Portfolio", projectSuggestion }
    };
}

module.exports = {
    generateLearningPath
};
