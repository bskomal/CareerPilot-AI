import os
import joblib
import logging
from scipy.sparse import hstack

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
classifier_path = os.path.join(MODELS_DIR, "job_family_classifier.pkl")
tfidf_path = os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl")

classifier = None
tfidf_vectorizer = None

def load_classifier():
    global classifier, tfidf_vectorizer
    if os.path.exists(classifier_path) and os.path.exists(tfidf_path):
        try:
            logger.info("Loading Calibrated Classifier and TF-IDF Vectorizers...")
            classifier = joblib.load(classifier_path)
            tfidf_vectorizer = joblib.load(tfidf_path)
            logger.info("Calibrated job family classifier loaded successfully.")
        except Exception as e:
            logger.error(f"Error loading classifier models: {e}")
            classifier = None
            tfidf_vectorizer = None
    else:
        logger.warning("Classifier/Vectorizer models not found. Please run training script first.")

# Load models on module import
load_classifier()

def predict_job_family(text: str) -> list:
    global classifier, tfidf_vectorizer
    if classifier is None or tfidf_vectorizer is None:
        load_classifier()
        
    if classifier is None or tfidf_vectorizer is None:
        logger.warning("Classifier models not initialized. Returning fallback values.")
        return [("backend_developer", 1.0)]
        
    if not text or not isinstance(text, str):
        return [("backend_developer", 1.0)]
        
    try:
        word_vec, char_vec = tfidf_vectorizer
        word_feat = word_vec.transform([text])
        char_feat = char_vec.transform([text])
        tfidf_features = hstack([word_feat, char_feat])
        
        probas = classifier.predict_proba(tfidf_features)[0]
        
        classes = classifier.classes_
        results = sorted(zip(classes, probas), key=lambda x: x[1], reverse=True)
        
        return [(str(cls), float(prob)) for cls, prob in results]
    except Exception as e:
        logger.error(f"Error predicting job family: {e}")
        return [("backend_developer", 1.0)]
