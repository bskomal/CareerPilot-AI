# CareerPilot AI Contextual Market Demand Map
# Centralized single source of truth for skill demand context

MARKET_DEMAND = {
    # DevOps & Infrastructure
    "kubernetes": {
        "devops_engineer": 95, "cloud_engineer": 90, "backend_developer": 60, "fullstack_developer": 50,
        "data_scientist": 15, "frontend_developer": 5, "cybersecurity_analyst": 20, "trend": "up"
    },
    "terraform": {
        "devops_engineer": 92, "cloud_engineer": 95, "backend_developer": 40, "fullstack_developer": 30,
        "data_scientist": 10, "trend": "up"
    },
    "docker": {
        "devops_engineer": 88, "cloud_engineer": 85, "backend_developer": 75, "fullstack_developer": 70,
        "data_scientist": 40, "frontend_developer": 15, "ml_engineer": 65, "ai_engineer": 60, "trend": "stable"
    },
    "ansible": {
        "devops_engineer": 75, "cloud_engineer": 70, "backend_developer": 30, "trend": "stable"
    },
    "jenkins": {
        "devops_engineer": 80, "cloud_engineer": 75, "backend_developer": 45, "fullstack_developer": 35, "trend": "stable"
    },
    "ci/cd": {
        "devops_engineer": 90, "cloud_engineer": 85, "backend_developer": 70, "fullstack_developer": 65,
        "frontend_developer": 40, "mobile_developer": 50, "trend": "up"
    },
    "git": {
        "backend_developer": 90, "frontend_developer": 90, "fullstack_developer": 95, "devops_engineer": 90,
        "cloud_engineer": 80, "data_scientist": 70, "mobile_developer": 85, "trend": "stable"
    },
    "prometheus": {
        "devops_engineer": 82, "cloud_engineer": 78, "backend_developer": 35, "trend": "stable"
    },
    "grafana": {
        "devops_engineer": 83, "cloud_engineer": 79, "backend_developer": 38, "trend": "stable"
    },
    "helm": {
        "devops_engineer": 85, "cloud_engineer": 80, "trend": "up"
    },
    "cloud infrastructure": {
        "cloud_engineer": 95, "devops_engineer": 90, "backend_developer": 50, "trend": "up"
    },

    # Cloud Providers
    "aws": {
        "cloud_engineer": 95, "devops_engineer": 90, "backend_developer": 65, "fullstack_developer": 60,
        "data_scientist": 45, "ml_engineer": 70, "ai_engineer": 65, "cybersecurity_analyst": 40, "trend": "stable"
    },
    "gcp": {
        "cloud_engineer": 85, "devops_engineer": 80, "backend_developer": 50, "data_scientist": 40, "trend": "stable"
    },
    "azure": {
        "cloud_engineer": 88, "devops_engineer": 82, "backend_developer": 55, "trend": "stable"
    },

    # Frontend Technologies
    "react": {
        "frontend_developer": 95, "fullstack_developer": 90, "backend_developer": 30, "mobile_developer": 40, "trend": "stable"
    },
    "vue": {
        "frontend_developer": 70, "fullstack_developer": 60, "trend": "down"
    },
    "angular": {
        "frontend_developer": 75, "fullstack_developer": 65, "trend": "stable"
    },
    "javascript": {
        "frontend_developer": 95, "fullstack_developer": 95, "backend_developer": 50, "mobile_developer": 60, "trend": "stable"
    },
    "typescript": {
        "frontend_developer": 90, "fullstack_developer": 85, "backend_developer": 60, "mobile_developer": 50, "trend": "up"
    },
    "html": {
        "frontend_developer": 95, "fullstack_developer": 90, "trend": "stable"
    },
    "css": {
        "frontend_developer": 95, "fullstack_developer": 90, "trend": "stable"
    },
    "tailwind css": {
        "frontend_developer": 88, "fullstack_developer": 80, "trend": "up"
    },
    "sass": {
        "frontend_developer": 70, "fullstack_developer": 60, "trend": "down"
    },
    "bootstrap": {
        "frontend_developer": 65, "fullstack_developer": 55, "trend": "down"
    },
    "webpack": {
        "frontend_developer": 75, "fullstack_developer": 65, "trend": "stable"
    },
    "vite": {
        "frontend_developer": 85, "fullstack_developer": 78, "trend": "up"
    },
    "jest": {
        "frontend_developer": 82, "fullstack_developer": 70, "backend_developer": 30, "trend": "stable"
    },
    "cypress": {
        "frontend_developer": 80, "fullstack_developer": 70, "trend": "up"
    },
    "storybook": {
        "frontend_developer": 78, "trend": "stable"
    },
    "next.js": {
        "frontend_developer": 85, "fullstack_developer": 82, "trend": "up"
    },
    "redux": {
        "frontend_developer": 80, "fullstack_developer": 75, "trend": "stable"
    },
    "zustand": {
        "frontend_developer": 78, "fullstack_developer": 70, "trend": "up"
    },

    # Backend Languages & Stacks
    "python": {
        "backend_developer": 85, "data_scientist": 95, "ml_engineer": 95, "ai_engineer": 95,
        "devops_engineer": 60, "fullstack_developer": 65, "data_analyst": 75, "trend": "up"
    },
    "java": {
        "backend_developer": 80, "fullstack_developer": 60, "engineering_manager": 50, "trend": "stable"
    },
    "spring boot": {
        "backend_developer": 85, "fullstack_developer": 65, "trend": "stable"
    },
    "go": {
        "backend_developer": 82, "devops_engineer": 55, "cloud_engineer": 50, "trend": "up"
    },
    "golang": {
        "backend_developer": 82, "devops_engineer": 55, "cloud_engineer": 50, "trend": "up"
    },
    "node.js": {
        "backend_developer": 88, "fullstack_developer": 90, "frontend_developer": 35, "trend": "stable"
    },
    "express.js": {
        "backend_developer": 80, "fullstack_developer": 82, "trend": "stable"
    },
    "django": {
        "backend_developer": 78, "fullstack_developer": 70, "trend": "stable"
    },
    "fastapi": {
        "backend_developer": 85, "ai_engineer": 80, "ml_engineer": 75, "data_scientist": 50, "trend": "up"
    },
    "flask": {
        "backend_developer": 70, "data_scientist": 45, "trend": "down"
    },
    "laravel": {
        "backend_developer": 72, "fullstack_developer": 65, "trend": "stable"
    },
    "sql": {
        "backend_developer": 85, "data_analyst": 95, "data_scientist": 85, "fullstack_developer": 80, "trend": "stable"
    },
    "postgresql": {
        "backend_developer": 88, "fullstack_developer": 80, "data_scientist": 40, "trend": "up"
    },
    "mysql": {
        "backend_developer": 75, "fullstack_developer": 70, "trend": "stable"
    },
    "mongodb": {
        "fullstack_developer": 85, "backend_developer": 75, "trend": "stable"
    },
    "redis": {
        "backend_developer": 82, "fullstack_developer": 60, "devops_engineer": 40, "trend": "up"
    },
    "dynamodb": {
        "backend_developer": 78, "cloud_engineer": 80, "trend": "stable"
    },
    "sqlite": {
        "mobile_developer": 70, "backend_developer": 35, "trend": "stable"
    },
    "graphql": {
        "backend_developer": 75, "frontend_developer": 70, "fullstack_developer": 75, "trend": "up"
    },
    "rest api": {
        "backend_developer": 90, "frontend_developer": 80, "fullstack_developer": 90, "mobile_developer": 85, "trend": "stable"
    },
    "microservices": {
        "backend_developer": 88, "devops_engineer": 80, "cloud_engineer": 75, "engineering_manager": 70, "trend": "up"
    },
    "rabbitmq": {
        "backend_developer": 70, "devops_engineer": 50, "trend": "stable"
    },
    "kafka": {
        "backend_developer": 85, "devops_engineer": 70, "data_scientist": 50, "trend": "up"
    },
    "elasticsearch": {
        "backend_developer": 75, "devops_engineer": 60, "trend": "stable"
    },
    "nginx": {
        "devops_engineer": 78, "backend_developer": 65, "trend": "stable"
    },
    "load balancing": {
        "devops_engineer": 82, "cloud_engineer": 85, "backend_developer": 60, "trend": "stable"
    },
    "jwt": {
        "backend_developer": 85, "fullstack_developer": 80, "trend": "stable"
    },

    # Data Science & Machine Learning
    "pandas": {
        "data_scientist": 96, "data_analyst": 85, "ml_engineer": 75, "backend_developer": 25, "trend": "stable"
    },
    "numpy": {
        "data_scientist": 92, "ml_engineer": 80, "trend": "stable"
    },
    "scikit-learn": {
        "data_scientist": 95, "ml_engineer": 90, "trend": "stable"
    },
    "tensorflow": {
        "ml_engineer": 85, "data_scientist": 70, "trend": "down"
    },
    "pytorch": {
        "ml_engineer": 92, "data_scientist": 80, "ai_engineer": 90, "trend": "up"
    },
    "xgboost": {
        "data_scientist": 89, "ml_engineer": 80, "data_analyst": 40, "trend": "stable"
    },
    "spacy": {
        "data_scientist": 75, "ml_engineer": 70, "ai_engineer": 70, "trend": "stable"
    },
    "nltk": {
        "data_scientist": 68, "trend": "down"
    },
    "machine learning": {
        "data_scientist": 95, "ml_engineer": 95, "ai_engineer": 85, "trend": "up"
    },
    "deep learning": {
        "ml_engineer": 90, "data_scientist": 80, "ai_engineer": 85, "trend": "stable"
    },
    "hugging face": {
        "ai_engineer": 92, "ml_engineer": 85, "data_scientist": 75, "trend": "up"
    },
    "transformers": {
        "ai_engineer": 95, "ml_engineer": 90, "data_scientist": 75, "trend": "up"
    },
    "llm": {
        "ai_engineer": 96, "ml_engineer": 88, "data_scientist": 70, "trend": "up"
    },
    "rag": {
        "ai_engineer": 94, "ml_engineer": 82, "trend": "up"
    },
    "vector databases": {
        "ai_engineer": 90, "ml_engineer": 80, "trend": "up"
    },
    "prompt engineering": {
        "ai_engineer": 85, "technical_product_manager": 60, "trend": "stable"
    },
    "fine-tuning": {
        "ai_engineer": 90, "ml_engineer": 85, "trend": "up"
    },

    # Cybersecurity
    "siem": {
        "cybersecurity_analyst": 93, "devops_engineer": 30, "trend": "up"
    },
    "owasp": {
        "cybersecurity_analyst": 91, "backend_developer": 35, "fullstack_developer": 30, "trend": "up"
    },
    "splunk": {
        "cybersecurity_analyst": 88, "devops_engineer": 45, "trend": "stable"
    },
    "wireshark": {
        "cybersecurity_analyst": 85, "trend": "stable"
    },
    "penetration testing": {
        "cybersecurity_analyst": 90, "trend": "up"
    },
    "threat modeling": {
        "cybersecurity_analyst": 87, "trend": "up"
    },

    # Others
    "solidity": {
        "blockchain_developer": 95, "trend": "stable"
    },
    "web3": {
        "blockchain_developer": 90, "trend": "stable"
    },
    "unity": {
        "game_developer": 92, "trend": "stable"
    },
    "unreal engine": {
        "game_developer": 88, "trend": "up"
    },
    "rtos": {
        "embedded_developer": 95, "trend": "stable"
    },
    "firmware": {
        "embedded_developer": 92, "trend": "stable"
    },
    "microcontroller": {
        "embedded_developer": 90, "trend": "stable"
    },
    "agile": {
        "scrum_master": 95, "product_manager": 90, "technical_product_manager": 90,
        "engineering_manager": 85, "fullstack_developer": 50, "trend": "stable"
    },
    "scrum": {
        "scrum_master": 95, "product_manager": 80, "trend": "stable"
    },
    "figma": {
        "frontend_developer": 60, "product_manager": 50, "trend": "stable"
    }
}
