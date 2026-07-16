import os
import random
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.naive_bayes import MultinomialNB
from sklearn.calibration import CalibratedClassifierCV
from scipy.sparse import hstack
from app.ml.taxonomy import JOB_FAMILIES

def generate_synthetic_data():
    X = []
    y = []
    
    # Senior, Mid, and Junior JD generation templates
    templates = [
        # Senior level
        "We are seeking a Senior {role} with 5+ years of experience to lead our architecture. The candidate must have required skills: {req_skills}. Preferred skills: {pref_skills}. Responsibilities include {desc1}.",
        "Hiring a Lead {role} or Architect. In this senior role, you will be responsible for {desc1} and mentoring the team. Core required tools: {req_skills}. Preferred stack: {pref_skills}.",
        "Seeking a highly experienced Principal {role} or Lead Developer. You must have proven experience in {desc1} and {desc2}. Mandatory requirements: {req_skills}. Nice to have: {pref_skills}.",
        
        # Mid level
        "Looking for a Mid-level {role} with 3-5 years of experience. You will collaborate on {desc1} and help us {desc2}. You should be proficient in required: {req_skills}. Nice to have: {pref_skills}.",
        "Join us as a {role}! The role involves {desc1} and {desc2}. Must have: {req_skills}. Pluses: {pref_skills}.",
        "We are expanding our core team and hiring a {role}. In this position, you will work on {desc1} and design modular software. Required stack: {req_skills}. Optional bonus skills: {pref_skills}.",
        
        # Junior level
        "We are hiring a Junior {role} (entry level, 0-2 years experience). You will assist with {desc1}. Required skills: {req_skills}. Nice to have: {pref_skills}.",
        "Seeking an entry-level {role} to support our developers. You will learn and work on {desc1}. Required: {req_skills}. Bonus: {pref_skills}.",
        "Looking for a passionate Associate {role} (0-1 year experience). You will work under mentorship on {desc1}. Essential tools: {req_skills}."
    ]

    for key, data in JOB_FAMILIES.items():
        name = data["name"]
        skills_pool = data["skills"]
        descriptions = data["descriptions"]
        
        # Generate 40 examples per family
        for i in range(40):
            desc1 = random.choice(descriptions)
            desc2 = random.choice([d for d in descriptions if d != desc1]) if len(descriptions) > 1 else desc1
            
            # Select required skills (4 to 8)
            num_req = min(len(skills_pool), random.randint(4, 8))
            req_skills = random.sample(skills_pool, num_req)
            
            # Select preferred skills (2 to 5)
            pref_pool = [s for s in skills_pool if s not in req_skills]
            num_pref = min(len(pref_pool), random.randint(2, 5)) if pref_pool else 0
            pref_skills = random.sample(pref_pool, num_pref) if num_pref > 0 else []
            
            # Format skills
            req_str = ", required: " + ", ".join(req_skills) if req_skills else "none"
            pref_str = ", nice to have: " + ", ".join(pref_skills) if pref_skills else "none"
            
            # Pick a template and format it
            template = random.choice(templates)
            text = template.format(
                role=name,
                desc1=desc1,
                desc2=desc2,
                req_skills=req_str,
                pref_skills=pref_str
            )
            
            X.append(text)
            y.append(key)
            
    return X, y

def train():
    print("Generating synthetic job descriptions...")
    X, y = generate_synthetic_data()
    print(f"Generated {len(X)} training samples across {len(set(y))} job families.")
    
    # 1. Train Vectorizer & TruncatedSVD for Dense Embeddings
    print("Fitting Hybrid TfidfVectorizers...")
    word_vec = TfidfVectorizer(
        ngram_range=(1,2),
        analyzer='word',
        min_df=2,
        sublinear_tf=True,
        stop_words='english'
    )
    char_vec = TfidfVectorizer(
        analyzer='char_wb',
        ngram_range=(3,5)
    )
    
    X_word = word_vec.fit_transform(X)
    X_char = char_vec.fit_transform(X)
    
    X_tfidf = hstack([X_word, X_char])
    print(f"Concatenated TF-IDF shape: {X_tfidf.shape}")
    
    # Apply TruncatedSVD with 100 components on combined features
    n_components = min(100, X_tfidf.shape[1] - 1)
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    svd.fit(X_tfidf)
    print(f"TruncatedSVD fitted with {n_components} components.")
    
    # 2. Train Calibrated Naive Bayes Classifier on TF-IDF features
    print("Training Calibrated Naive Bayes classifier...")
    classifier = MultinomialNB()
    try:
        calibrated_model = CalibratedClassifierCV(estimator=classifier, method='sigmoid')
    except TypeError:
        calibrated_model = CalibratedClassifierCV(base_estimator=classifier, method='sigmoid')
        
    calibrated_model.fit(X_tfidf, y)
    print("Classifier trained and calibrated successfully.")
    
    # Ensure models directory exists
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    
    # Save the artifacts
    joblib.dump((word_vec, char_vec), os.path.join(models_dir, "tfidf_vectorizer.pkl"))
    joblib.dump(svd, os.path.join(models_dir, "svd_model.pkl"))
    joblib.dump(calibrated_model, os.path.join(models_dir, "job_family_classifier.pkl"))
    
    print(f"Artifacts successfully saved to: {models_dir}")

if __name__ == "__main__":
    train()
