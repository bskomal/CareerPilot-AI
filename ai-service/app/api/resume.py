from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import pdfplumber
import docx
import io
import re
import logging
import spacy
from typing import List

# Import centralized taxonomy, embeddings, classifiers, demand maps, and scorers
from app.ml.taxonomy import JOB_FAMILIES, SKILL_CATEGORIES, detect_stack, normalize_skill
from app.ml.vectorizer import get_embedding
from app.ml.classifier import predict_job_family
from app.ml.market_demand import MARKET_DEMAND
from app.ml.skill_dependencies import get_prerequisites, topological_sort_skills
from app.utils.priority_scorer import compute_priority_score

logger = logging.getLogger(__name__)
router = APIRouter()

# Load spaCy
logger.info("Loading spaCy model...")
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")
logger.info("✅ spaCy loaded successfully")

# Dynamically populate SKILLS_DB from the union of all skills across all 18 families
SKILLS_DB = sorted(list(set(
    skill for family in JOB_FAMILIES.values() for skill in family["skills"]
)))

class EmbeddingRequest(BaseModel):
    text: str

class DetectFamilyRequest(BaseModel):
    text: str

class ExtractSkillsRequest(BaseModel):
    text: str
    family: str = None

class NormalizeRequest(BaseModel):
    skills: List[str]

class ComputeGapsRequest(BaseModel):
    resumeSkills: List[str]
    jobText: str

class ComputeTransitionRequest(BaseModel):
    resumeSkills: List[str]
    targetJobText: str


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    text = ""
    name_lower = filename.lower()
    if name_lower.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                pg_text = page.extract_text()
                if pg_text:
                    text += pg_text + "\n"
    elif name_lower.endswith(".docx"):
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. PDF or DOCX only.")
    return text.strip()


def check_skill_occurrence(skill: str, text_lower: str) -> bool:
    if len(skill) <= 2:
        pattern = r'(?:^|[^a-z0-9+#])' + re.escape(skill) + r'(?=$|[^a-z0-9+#])'
        return bool(re.search(pattern, text_lower))
    return skill in text_lower


def extract_skills(text: str):
    lower = text.lower()
    return sorted({s for s in SKILLS_DB if check_skill_occurrence(s, lower)})


def extract_name(text: str):
    doc = nlp(text[:1000])
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text.strip()
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    return lines[0][:50] if lines else "Unknown"


def extract_section(text: str, keyword: str):
    idx = text.lower().find(keyword.lower())
    if idx != -1:
        return [text[idx : idx + 1500].strip()]
    return []


def detect_seniority(text: str) -> str:
    lower_text = text.lower()
    
    # Senior keywords
    senior_kws = ["senior", "lead", "architect", "5+ years", "principal", "manager", "director"]
    # Junior keywords
    junior_kws = ["entry level", "0-2 years", "junior", "intern", "associate", "graduate"]
    # Mid keywords
    mid_kws = ["3-5 years", "mid-level", "mid level", "intermediate"]
    
    senior_score = sum(1 for kw in senior_kws if kw in lower_text)
    junior_score = sum(1 for kw in junior_kws if kw in lower_text)
    mid_score = sum(1 for kw in mid_kws if kw in lower_text)
    
    if senior_score > junior_score and senior_score > mid_score:
        return "senior"
    elif junior_score > senior_score and junior_score > mid_score:
        return "junior"
    elif mid_score > senior_score and mid_score > junior_score:
        return "mid"
        
    if "senior" in lower_text:
        return "senior"
    if "junior" in lower_text:
        return "junior"
        
    return "mid"


def determine_level(skill: str, lower_text: str) -> str:
    idx = lower_text.find(skill.lower())
    if idx == -1:
        return "required"
        
    window_start = max(0, idx - 150)
    window_end = min(len(lower_text), idx + len(skill) + 150)
    window = lower_text[window_start:window_end]
    
    preferred_triggers = ["nice to have", "plus", "bonus", "a plus", "preferred", "desirable", "optional"]
    required_triggers = ["required", "must have", "essential", "have to", "mandatory", "must be"]
    
    for trig in preferred_triggers:
        if trig in window:
            return "preferred"
    for trig in required_triggers:
        if trig in window:
            return "required"
    return "required"


@router.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        full_text = extract_text_from_file(file_bytes, file.filename)
        if not full_text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract readable text from this file."
            )
        return {
            "filename": file.filename,
            "extracted_name": extract_name(full_text),
            "extracted_skills": extract_skills(full_text),
            "extracted_experience": extract_section(full_text, "experience"),
            "extracted_education": extract_section(full_text, "education"),
            "full_text": full_text[:5000]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Parse Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")


@router.post("/generate-embedding")
async def generate_embedding_endpoint(request: EmbeddingRequest):
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text field cannot be empty.")
        text = request.text[:4000]
        logger.info(f"Generating scikit-learn embedding for text ({len(text)} chars)...")
        embedding = get_embedding(text)
        return {"embedding": embedding}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Embedding Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create embedding: {str(e)}")


@router.post("/detect-job-family")
async def detect_job_family_endpoint(request: DetectFamilyRequest):
    try:
        text = request.text or ""
        if not text.strip():
            return {"families": []}
            
        results = predict_job_family(text)
        
        families_out = []
        for family_key, prob in results[:3]:
            if family_key in JOB_FAMILIES:
                families_out.append({
                    "family": family_key,
                    "name": JOB_FAMILIES[family_key]["name"],
                    "confidence": int(prob * 100)
                })
        return {"families": families_out}
    except Exception as e:
        logger.error(f"Detect Job Family Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to detect job family: {str(e)}")


@router.post("/extract-job-skills")
async def extract_job_skills_endpoint(request: ExtractSkillsRequest):
    try:
        text = request.text or ""
        family_key = request.family
        
        # Fallback to top family if empty/none
        detection_res = await detect_job_family_endpoint(DetectFamilyRequest(text=text))
        top_fams = detection_res.get("families", [])
        
        if not family_key or family_key.strip() == "":
            family_key = top_fams[0]["family"] if top_fams else "backend_developer"
            
        # Retrieve target family
        if family_key not in JOB_FAMILIES:
            family_key = "backend_developer"
            
        target_fam = JOB_FAMILIES[family_key]
        lower_text = text.lower()
        
        # Resolve family prediction confidence
        confidence = 1.0
        for item in top_fams:
            if item["family"] == family_key:
                confidence = float(item["confidence"]) / 100.0
                break
        
        required_out = []
        bonus_out = []
        
        # Check skills list
        skills_found_names = []
        for skill in target_fam["skills"]:
            if check_skill_occurrence(skill, lower_text):
                level = determine_level(skill, lower_text)
                required_out.append({
                    "skill": skill,
                    "level": level
                })
                skills_found_names.append(skill)
                
        # Seniority adjust depth
        seniority = detect_seniority(text)
        for skill_obj in required_out:
            s_name = skill_obj["skill"].lower().strip()
            if seniority == "senior":
                skill_obj["level"] = "required"
            elif seniority == "junior":
                if s_name in {'kubernetes', 'terraform', 'docker', 'ci/cd', 'jenkins', 'ansible', 'microservices', 'mlops'}:
                    skill_obj["level"] = "preferred"

        primary_stack, secondary_stack = detect_stack(skills_found_names)
                
        return {
            "jobFamily": family_key,
            "family": family_key,
            "name": target_fam["name"],
            "primaryStack": primary_stack,
            "secondaryStack": secondary_stack,
            "requiredSkills": required_out,
            "required_skills": required_out,
            "bonusSkills": bonus_out,
            "bonus_skills": bonus_out,
            "confidence": round(confidence, 2),
            "seniorityLevel": seniority
        }
    except Exception as e:
        logger.error(f"Extract Job Skills Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extract job skills: {str(e)}")


@router.post("/normalize-skills")
async def normalize_skills_endpoint(request: NormalizeRequest):
    try:
        normalized = sorted(list(set(
            normalize_skill(s) for s in request.skills if s and s.strip() != ""
        )))
        return {"normalized": normalized}
    except Exception as e:
        logger.error(f"Normalize Skills Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compute-gaps")
async def compute_gaps_endpoint(request: ComputeGapsRequest):
    try:
        text = request.jobText or ""
        
        # 1. Detect Job Family
        detection_res = await detect_job_family_endpoint(DetectFamilyRequest(text=text))
        top_fams = detection_res.get("families", [])
        family_key = top_fams[0]["family"] if top_fams else "backend_developer"
        confidence = float(top_fams[0]["confidence"]) / 100.0 if top_fams else 1.0
        
        target_fam = JOB_FAMILIES[family_key]
        lower_text = text.lower()
        
        # 2. Extract job required skills
        required_out = []
        skills_found_names = []
        
        for skill in target_fam["skills"]:
            if check_skill_occurrence(skill, lower_text):
                level = determine_level(skill, lower_text)
                required_out.append({
                    "skill": skill,
                    "level": level
                })
                skills_found_names.append(skill)
                
        # 3. Detect Seniority and adjust advancedGaps threshold + tool depth
        seniority = detect_seniority(text)
        
        # Adjust required tool depth based on seniority
        for skill_obj in required_out:
            s_name = skill_obj["skill"].lower().strip()
            if seniority == "senior":
                skill_obj["level"] = "required"
            elif seniority == "junior":
                if s_name in {'kubernetes', 'terraform', 'docker', 'ci/cd', 'jenkins', 'ansible', 'microservices', 'mlops'}:
                    skill_obj["level"] = "preferred"

        primary_stack, secondary_stack = detect_stack(skills_found_names)
        
        # 4. Normalize resume skills
        resume_normalized = [normalize_skill(s) for s in request.resumeSkills]
        resume_set = {s.lower().strip() for s in resume_normalized if s}
        
        # 5. Compute matching and missing skills
        matching_skills = []
        missing_skills = []
        
        for skill_obj in required_out:
            s_name = skill_obj["skill"]
            s_lower = s_name.lower().strip()
            if s_lower in resume_set:
                matching_skills.append(skill_obj)
            else:
                missing_skills.append(skill_obj)
                
        # 6. Categorize gaps into critical, secondary, advanced based on seniority-adjusted keywords
        critical_gaps = []
        secondary_gaps = []
        advanced_gaps = []
        
        if seniority == "junior":
            advanced_keywords = {'kubernetes', 'terraform', 'mlops', 'fine-tuning'}
        elif seniority == "mid":
            advanced_keywords = {'kubernetes', 'terraform', 'docker', 'ci/cd', 'ansible', 'jenkins'}
        else: # senior
            advanced_keywords = {
                'kubernetes', 'terraform', 'docker', 'ci/cd', 'ansible', 'jenkins', 
                'microservices', 'systems architecture', 'system design', 'infrastructure as code',
                'mlops', 'fine-tuning', 'rlhf', 'threat modeling', 'penetration testing',
                'load balancing', 'caching', 'shading', 'multiplayer'
            }
        
        for skill_obj in missing_skills:
            s_name = skill_obj["skill"]
            s_level = skill_obj["level"]
            s_lower = s_name.lower().strip()
            
            if s_lower in advanced_keywords:
                advanced_gaps.append(s_name)
            elif s_level == 'preferred':
                secondary_gaps.append(s_name)
            else:
                critical_gaps.append(s_name)
                
        # 7. Compute Stack Maturity Score (Raw + Weighted)
        core_skills_set = set(SKILL_CATEGORIES["languages"] + SKILL_CATEGORIES["frameworks"])
        devops_skills_set = set(SKILL_CATEGORIES["devops"])
        cloud_skills_set = set(SKILL_CATEGORIES["cloud"])
        
        job_core = [s for s in required_out if s["skill"].lower().strip() in core_skills_set]
        job_devops = [s for s in required_out if s["skill"].lower().strip() in devops_skills_set]
        job_cloud = [s for s in required_out if s["skill"].lower().strip() in cloud_skills_set]
        
        def compute_metrics(job_list):
            if not job_list:
                return 100, 100
                
            total_req = sum(1 for s in job_list if s["level"] == "required")
            total_pref = sum(1 for s in job_list if s["level"] == "preferred")
            
            matched_list = [s for s in job_list if s["skill"].lower().strip() in resume_set]
            matched_req = sum(1 for s in matched_list if s["level"] == "required")
            matched_pref = sum(1 for s in matched_list if s["level"] == "preferred")
            
            raw_cov = int(round((len(matched_list) / len(job_list)) * 100))
            
            denom = (total_req * 1.0 + total_pref * 0.5)
            if denom == 0:
                weighted_cov = 100
            else:
                weighted_cov = int(round(((matched_req * 1.0 + matched_pref * 0.5) / denom) * 100))
                
            return raw_cov, weighted_cov

        core_raw, core_weighted = compute_metrics(job_core)
        devops_raw, devops_weighted = compute_metrics(job_devops)
        cloud_raw, cloud_weighted = compute_metrics(job_cloud)
        overall_raw, overall_weighted = compute_metrics(required_out)
        
        # 8. Compute marketAdjustedReadiness
        matched_demands = []
        for s_obj in matching_skills:
            s_name = s_obj["skill"].lower().strip()
            demand_entry = MARKET_DEMAND.get(s_name, {})
            demand_score = demand_entry.get(family_key, 25)
            matched_demands.append(demand_score)
            
        if not matched_demands:
            avg_demand = 25.0
        else:
            avg_demand = sum(matched_demands) / len(matched_demands)
            
        market_adjusted_readiness = overall_weighted * (avg_demand / 100.0)
        market_adjusted_readiness = min(100.0, max(0.0, round(market_adjusted_readiness, 1)))

        stack_maturity = {
            "coreCoverage": core_weighted,
            "coreRawCoverage": core_raw,
            "devopsCoverage": devops_weighted,
            "devopsRawCoverage": devops_raw,
            "cloudCoverage": cloud_weighted,
            "cloudRawCoverage": cloud_raw,
            "overallReadiness": overall_weighted,
            "weightedCoverage": overall_weighted,
            "rawCoverage": overall_raw,
            "marketAdjustedReadiness": market_adjusted_readiness
        }

        # 9. Calculate fromFamily (dominant family) using skills overlap
        from_family = "backend_developer"
        max_overlap = -1
        for fam_key, fam_data in JOB_FAMILIES.items():
            fam_skills = {s.lower().strip() for s in fam_data["skills"]}
            overlap_len = len(resume_set.intersection(fam_skills))
            if overlap_len > max_overlap:
                max_overlap = overlap_len
                from_family = fam_key
                
        stack_delta = {
            "fromFamily": JOB_FAMILIES[from_family]["name"],
            "toFamily": target_fam["name"],
            "additionalSkillsNeeded": [s["skill"] for s in missing_skills],
            "overlapSkills": [s["skill"] for s in matching_skills]
        }
        
        # 10. Calculate radarData (Languages, Frameworks, DevOps, Cloud, Databases)
        radar_categories = {
            "Languages": set(SKILL_CATEGORIES["languages"]),
            "Frameworks": set(SKILL_CATEGORIES["frameworks"]),
            "DevOps": set(SKILL_CATEGORIES["devops"]),
            "Cloud": set(SKILL_CATEGORIES["cloud"]),
            "Databases": set(SKILL_CATEGORIES["databases"])
        }
        
        radar_data = []
        for cat_name, cat_skills in radar_categories.items():
            req_in_cat = [s for s in required_out if s["skill"].lower().strip() in cat_skills]
            if not req_in_cat:
                val = 100
            else:
                matched_in_cat = [s for s in req_in_cat if s["skill"].lower().strip() in resume_set]
                val = int(round((len(matched_in_cat) / len(req_in_cat)) * 100))
            radar_data.append({
                "category": cat_name,
                "value": val
            })
            
        # 11. Compute priorityScore for missing skills
        prioritized_gaps = []
        for skill_obj in missing_skills:
            s_name = skill_obj["skill"]
            s_lower = s_name.lower().strip()
            if s_lower in advanced_keywords:
                g_level = "advanced"
            else:
                g_level = skill_obj["level"]
                
            scored = compute_priority_score(
                skill=s_name,
                job_family=family_key,
                seniority=seniority,
                gap_level=g_level
            )
            prioritized_gaps.append(scored)
            
        prioritized_gaps = sorted(prioritized_gaps, key=lambda x: x["priorityScore"], reverse=True)
        
        # 12. Stack Maturity Breakdown (Explainability)
        stack_maturity_breakdown = {
            "weightedCoverage": overall_weighted,
            "avgDemandOfMatchedSkills": round(avg_demand, 1),
            "formula": "weightedCoverage * (avgDemand / 100)",
            "marketAdjustedReadiness": market_adjusted_readiness
        }
        
        return {
            "jobFamily": family_key,
            "primaryStack": primary_stack,
            "secondaryStack": secondary_stack,
            "required_skills": required_out,
            "missing_skills": missing_skills,
            "matching_skills": matching_skills,
            "categorized_gaps": {
                "criticalGaps": critical_gaps,
                "secondaryGaps": secondary_gaps,
                "advancedGaps": advanced_gaps
            },
            "stackMaturity": stack_maturity,
            "stackMaturityBreakdown": stack_maturity_breakdown,
            "confidence": round(confidence, 2),
            "seniorityLevel": seniority,
            "stackDelta": stack_delta,
            "radarData": radar_data,
            "prioritizedGaps": prioritized_gaps
        }
    except Exception as e:
        logger.error(f"Compute Gaps Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compute-transition-plan")
async def compute_transition_plan_endpoint(request: ComputeTransitionRequest):
    try:
        target_text = request.targetJobText or ""
        
        # 1. Determine current dominant family from resumeSkills
        resume_normalized = [normalize_skill(s) for s in request.resumeSkills]
        resume_set = {s.lower().strip() for s in resume_normalized if s}
        
        from_family = "backend_developer"
        max_overlap = -1
        for fam_key, fam_data in JOB_FAMILIES.items():
            fam_skills = {s.lower().strip() for s in fam_data["skills"]}
            overlap_len = len(resume_set.intersection(fam_skills))
            if overlap_len > max_overlap:
                max_overlap = overlap_len
                from_family = fam_key
                
        # 2. Determine target family via classifier
        detection_res = await detect_job_family_endpoint(DetectFamilyRequest(text=target_text))
        top_fams = detection_res.get("families", [])
        to_family = top_fams[0]["family"] if top_fams else "backend_developer"
        
        target_fam = JOB_FAMILIES[to_family]
        lower_target = target_text.lower()
        
        # 3. Extract required skills from target job description
        required_out = []
        skills_found_names = []
        
        for skill in target_fam["skills"]:
            if check_skill_occurrence(skill, lower_target):
                level = determine_level(skill, lower_target)
                required_out.append({
                    "skill": skill,
                    "level": level
                })
                skills_found_names.append(skill)
                
        # 4. Compute missing skills
        missing_skills = []
        matching_skills = []
        for skill_obj in required_out:
            s_name = skill_obj["skill"]
            s_lower = s_name.lower().strip()
            if s_lower in resume_set:
                matching_skills.append(s_name)
            else:
                missing_skills.append(s_name)
                
        # 5. Categorize missing skills into Foundational, Intermediate, Advanced
        phase1_skills = []
        phase2_skills = []
        phase3_skills = []
        
        languages_set = set(SKILL_CATEGORIES["languages"])
        frameworks_set = set(SKILL_CATEGORIES["frameworks"])
        databases_set = set(SKILL_CATEGORIES["databases"])
        devops_set = set(SKILL_CATEGORIES["devops"])
        cloud_set = set(SKILL_CATEGORIES["cloud"])
        
        # Resolve target family seniority rules for advanced gaps
        seniority = detect_seniority(target_text)
        if seniority == "junior":
            advanced_keywords = {'kubernetes', 'terraform', 'mlops', 'fine-tuning'}
        elif seniority == "mid":
            advanced_keywords = {'kubernetes', 'terraform', 'docker', 'ci/cd', 'ansible', 'jenkins'}
        else: # senior
            advanced_keywords = {
                'kubernetes', 'terraform', 'docker', 'ci/cd', 'ansible', 'jenkins', 
                'microservices', 'systems architecture', 'system design', 'infrastructure as code',
                'mlops', 'fine-tuning', 'rlhf', 'threat modeling', 'penetration testing',
                'load balancing', 'caching', 'shading', 'multiplayer'
            }
            
        # Compute priorityScore for missing skills
        missing_scored = []
        for skill in missing_skills:
            s_lower = skill.lower().strip()
            if s_lower in advanced_keywords:
                g_level = "advanced"
            elif s_lower in frameworks_set or s_lower in databases_set:
                g_level = "preferred"
            else:
                g_level = "required"
                
            scored = compute_priority_score(
                skill=skill,
                job_family=to_family,
                seniority=seniority,
                gap_level=g_level,
                compared_families=[from_family, to_family]
            )
            missing_scored.append(scored)
            
        # Sort missing_scored by priorityScore descending
        missing_scored = sorted(missing_scored, key=lambda x: x["priorityScore"], reverse=True)
        
        # Categorize missing skills into phases
        for skill in missing_skills:
            s_lower = skill.lower().strip()
            if s_lower in languages_set or s_lower in {'git', 'sql', 'html', 'css'}:
                phase1_skills.append(skill)
            elif s_lower in frameworks_set or s_lower in databases_set:
                phase2_skills.append(skill)
            else:
                phase3_skills.append(skill)
        
        # Inject missing prerequisites into earlier phases
        all_phased = set(s.lower().strip() for s in phase1_skills + phase2_skills + phase3_skills)
        prereqs_to_add = []
        for skill in missing_skills:
            for prereq in get_prerequisites(skill):
                p_lower = prereq.lower().strip()
                if p_lower not in resume_set and p_lower not in all_phased and p_lower not in prereqs_to_add:
                    prereqs_to_add.append(prereq)
        # Add prerequisite skills to phase1 (foundation)
        for p in prereqs_to_add:
            phase1_skills.append(p)

        # Apply dependency-aware topological sort within each phase
        phase1_skills = topological_sort_skills(phase1_skills, resume_set)
        phase2_skills = topological_sort_skills(phase2_skills, resume_set)
        phase3_skills = topological_sort_skills(phase3_skills, resume_set)
                
        # Default fallbacks if empty
        if not phase1_skills:
            phase1_skills.append(f"Familiarize with the core conventions of {target_fam['name']}")
        if not phase2_skills:
            phase2_skills.append(f"Explore the primary stacks of {target_fam['name']}")
        if not phase3_skills:
            phase3_skills.append(f"Deploy a prototype portfolio project matching {target_fam['name']} parameters")
            
        # 6. Calculate percentage overlap and transition difficulty
        target_skills_set = {s["skill"].lower().strip() for s in required_out}
        overlap_skills = resume_set.intersection(target_skills_set)
        
        if not target_skills_set:
            overlap_pct = 100.0
        else:
            overlap_pct = (len(overlap_skills) / len(target_skills_set)) * 100.0
            
        if overlap_pct >= 50.0:
            difficulty = "Low"
        elif overlap_pct >= 20.0:
            difficulty = "Moderate"
        else:
            difficulty = "High"
            
        # Compute transitionAccelerationIndex (mean of top 5 missing skills priorityScores)
        top_5_scores = [s["priorityScore"] for s in missing_scored[:5]]
        if not top_5_scores:
            acceleration_index = 0.0
        else:
            acceleration_index = sum(top_5_scores) / len(top_5_scores)
            
        acceleration_index = round(float(acceleration_index), 1)
        
        if acceleration_index > 75.0:
            pace = "High Impact Transition"
        elif acceleration_index >= 50.0:
            pace = "Moderate Transition"
        else:
            pace = "Gradual Transition"

        # Transition Breakdown (Explainability)
        transition_breakdown = {
            "overlapPercentage": round(overlap_pct, 2),
            "formula": "(overlap_skills / total_target_skills) * 100",
            "accelerationIndex": acceleration_index,
            "paceLogic": f"{acceleration_index} {'> 75' if acceleration_index > 75 else '>= 50' if acceleration_index >= 50 else '< 50'} => {pace}"
        }
            
        return {
            "fromFamily": JOB_FAMILIES[from_family]["name"],
            "toFamily": target_fam["name"],
            "phase1": { "focus": "Foundation", "skills": phase1_skills },
            "phase2": { "focus": "Core Transition", "skills": phase2_skills },
            "phase3": { "focus": "Advanced Specialization", "skills": phase3_skills },
            "estimatedTransitionDifficulty": difficulty,
            "overlapPercentage": round(overlap_pct, 2),
            "transitionAccelerationIndex": acceleration_index,
            "transitionPace": pace,
            "transitionBreakdown": transition_breakdown
        }
    except Exception as e:
        logger.error(f"Compute Transition Plan Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))