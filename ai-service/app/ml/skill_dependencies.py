# CareerPilot AI Skill Dependency Graph
# Defines logical prerequisite relationships between skills.
# Format: { "skill": ["prerequisite1", "prerequisite2"] }
# No circular dependencies. Loaded once at startup.

SKILL_DEPENDENCIES = {
    # DevOps & Infrastructure
    "kubernetes": ["docker", "linux"],
    "docker": ["linux"],
    "terraform": ["aws"],
    "ansible": ["linux"],
    "helm": ["kubernetes"],
    "prometheus": ["kubernetes"],
    "grafana": ["prometheus"],
    "ci/cd": ["git"],
    "jenkins": ["git", "linux"],
    "cloud infrastructure": ["aws"],

    # Cloud
    "aws": ["linux"],
    "gcp": ["linux"],
    "azure": ["linux"],
    "sagemaker": ["aws", "python"],
    "vertex ai": ["gcp", "python"],
    "dynamodb": ["aws"],

    # Frontend
    "react": ["javascript", "html", "css"],
    "vue": ["javascript", "html", "css"],
    "angular": ["typescript", "html", "css"],
    "next.js": ["react"],
    "redux": ["react"],
    "zustand": ["react"],
    "tailwind css": ["css"],
    "sass": ["css"],
    "webpack": ["javascript"],
    "vite": ["javascript"],
    "jest": ["javascript"],
    "cypress": ["javascript"],
    "storybook": ["react"],
    "typescript": ["javascript"],

    # Backend
    "node.js": ["javascript"],
    "express.js": ["node.js"],
    "django": ["python"],
    "fastapi": ["python"],
    "flask": ["python"],
    "spring boot": ["java"],
    "laravel": ["php"],
    "graphql": ["rest api"],
    "microservices": ["rest api", "docker"],
    "kafka": ["java"],
    "rabbitmq": ["rest api"],
    "elasticsearch": ["rest api"],
    "jwt": ["rest api"],

    # Databases
    "postgresql": ["sql"],
    "mysql": ["sql"],
    "mongodb": ["javascript"],
    "redis": ["sql"],

    # Data Science & ML
    "pandas": ["python"],
    "numpy": ["python"],
    "scikit-learn": ["pandas", "numpy"],
    "xgboost": ["scikit-learn"],
    "tensorflow": ["python", "numpy"],
    "pytorch": ["python", "numpy"],
    "matplotlib": ["python"],
    "statsmodels": ["pandas"],
    "spacy": ["python"],
    "nltk": ["python"],
    "machine learning": ["python", "numpy"],
    "deep learning": ["machine learning"],
    "hugging face": ["pytorch"],
    "transformers": ["pytorch"],
    "llm": ["transformers"],
    "rag": ["llm", "vector databases"],
    "vector databases": ["python"],
    "prompt engineering": ["llm"],
    "fine-tuning": ["transformers"],

    # Cybersecurity
    "siem": ["linux", "networking"],
    "splunk": ["siem"],
    "wireshark": ["networking"],
    "owasp": ["rest api"],
    "penetration testing": ["linux", "networking"],
    "threat modeling": ["owasp"],

    # Mobile
    "react native": ["react"],
    "flutter": ["dart"],

    # Game Dev
    "unreal engine": ["c++"],
}


def get_prerequisites(skill: str) -> list:
    """Return direct prerequisites for a skill."""
    return SKILL_DEPENDENCIES.get(skill.lower().strip(), [])


def get_all_prerequisites(skill: str, visited: set = None) -> list:
    """Recursively resolve all transitive prerequisites for a skill (no circular loops)."""
    if visited is None:
        visited = set()

    skill_lower = skill.lower().strip()
    if skill_lower in visited:
        return []

    visited.add(skill_lower)
    direct = SKILL_DEPENDENCIES.get(skill_lower, [])
    all_prereqs = []

    for prereq in direct:
        all_prereqs.append(prereq)
        all_prereqs.extend(get_all_prerequisites(prereq, visited))

    # Deduplicate while preserving order (deepest first)
    seen = set()
    result = []
    for p in reversed(all_prereqs):
        if p not in seen:
            seen.add(p)
            result.append(p)
    result.reverse()
    return result


def topological_sort_skills(skills: list, resume_skills_set: set) -> list:
    """
    Given a list of missing skills, return them in dependency-respecting order.
    Skills whose prerequisites are NOT in the resume are pushed earlier.
    """
    skills_lower = [s.lower().strip() for s in skills]
    skill_original = {s.lower().strip(): s for s in skills}

    # Build a local graph among the missing skills
    in_degree = {s: 0 for s in skills_lower}
    adj = {s: [] for s in skills_lower}
    missing_set = set(skills_lower)

    for s in skills_lower:
        prereqs = SKILL_DEPENDENCIES.get(s, [])
        for p in prereqs:
            p_lower = p.lower().strip()
            # Only add edge if prerequisite is also missing AND not in resume
            if p_lower in missing_set and p_lower not in resume_skills_set:
                adj[p_lower].append(s)
                in_degree[s] += 1

    # Kahn's algorithm
    queue = sorted([s for s in skills_lower if in_degree[s] == 0])
    ordered = []

    while queue:
        node = queue.pop(0)
        ordered.append(node)
        for neighbor in sorted(adj.get(node, [])):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
        queue.sort()

    # Append any remaining (shouldn't happen with no cycles)
    for s in skills_lower:
        if s not in ordered:
            ordered.append(s)

    return [skill_original.get(s, s) for s in ordered]
