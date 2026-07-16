# CareerPilot AI Deterministic Priority Scoring Engine (with Explainability)
from app.ml.market_demand import MARKET_DEMAND
from app.ml.taxonomy import JOB_FAMILIES, SKILL_CATEGORIES


def compute_priority_score(skill: str, job_family: str, seniority: str, gap_level: str, compared_families: list = None) -> dict:
    skill_clean = skill.strip().lower()

    # 1. demandScore (0-100)
    demand_entry = MARKET_DEMAND.get(skill_clean, {})
    demand_score = demand_entry.get(job_family, 25)
    trend = demand_entry.get("trend", "stable")

    # 2. stackImportance (0-100: required=100, preferred=70, advanced/secondary=50)
    gap_clean = gap_level.lower().strip()
    if gap_clean == "required":
        stack_importance = 100.0
    elif gap_clean == "preferred":
        stack_importance = 70.0
    else:
        stack_importance = 50.0

    # 3. seniorityFactor (0-100: senior=100, mid=70, junior=50)
    seniority_clean = seniority.lower().strip()
    if seniority_clean == "senior":
        seniority_factor = 100.0
    elif seniority_clean == "mid":
        seniority_factor = 70.0
    else:
        seniority_factor = 50.0

    # 4. transitionImpact (0-100: >=2 families=100, else 50)
    families_containing = []
    for fk, fd in JOB_FAMILIES.items():
        fam_skills_lower = {s.lower().strip() for s in fd["skills"]}
        if skill_clean in fam_skills_lower:
            families_containing.append(fk)

    if compared_families:
        overlap = set(compared_families).intersection(families_containing)
        transition_impact = 100.0 if len(overlap) >= 2 else 50.0
    else:
        transition_impact = 100.0 if len(families_containing) >= 2 else 50.0

    # Compute individual weighted components (rounded to 1 decimal)
    demand_component = round(0.4 * demand_score, 1)
    stack_component = round(0.3 * stack_importance, 1)
    seniority_component = round(0.2 * seniority_factor, 1)
    transition_component = round(0.1 * transition_impact, 1)

    # priorityScore = exact sum of rounded components (no floating drift)
    priority_score = round(demand_component + stack_component + seniority_component + transition_component, 1)

    # Resolve skill category
    category = "Other"
    for cat_name, cat_skills in SKILL_CATEGORIES.items():
        if skill_clean in {s.lower().strip() for s in cat_skills}:
            if cat_name == "languages":
                category = "Languages"
            elif cat_name == "frameworks":
                category = "Frameworks"
            elif cat_name == "devops":
                category = "DevOps"
            elif cat_name == "cloud":
                category = "Cloud"
            elif cat_name == "databases":
                category = "Databases"
            break

    return {
        "skill": skill,
        "priorityScore": priority_score,
        "components": {
            "demandComponent": demand_component,
            "stackComponent": stack_component,
            "seniorityComponent": seniority_component,
            "transitionComponent": transition_component
        },
        "demandScore": demand_score,
        "trend": trend,
        "category": category
    }
