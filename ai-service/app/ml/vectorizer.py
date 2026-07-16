import os
import joblib
import numpy as np
import logging
from scipy.sparse import hstack

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
tfidf_path = os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl")
svd_path = os.path.join(MODELS_DIR, "svd_model.pkl")

tfidf_vectorizer = None
svd_model = None

def load_models():
    global tfidf_vectorizer, svd_model
    if os.path.exists(tfidf_path) and os.path.exists(svd_path):
        try:
            logger.info("Loading TF-IDF Vectorizer and TruncatedSVD models...")
            tfidf_vectorizer = joblib.load(tfidf_path)
            svd_model = joblib.load(svd_path)
            logger.info("Vectorization models loaded successfully.")
        except Exception as e:
            logger.error(f"Error loading vectorizer/svd models: {e}")
            tfidf_vectorizer = None
            svd_model = None
    else:
        logger.warning("Vectorizer/SVD models not found. Please run training script first.")

# Load models on module import
load_models()

def get_embedding(text: str) -> list:
    global tfidf_vectorizer, svd_model
    if tfidf_vectorizer is None or svd_model is None:
        load_models()
        
    if tfidf_vectorizer is None or svd_model is None:
        logger.warning("Vectorizer/SVD models not initialized. Returning dummy zero vector.")
        return [0.0] * 100
        
    if not text or not isinstance(text, str):
        return [0.0] * 100
        
    try:
        word_vec, char_vec = tfidf_vectorizer
        word_feat = word_vec.transform([text])
        char_feat = char_vec.transform([text])
        combined_features = hstack([word_feat, char_feat])
        
        dense_vector = svd_model.transform(combined_features)
        return dense_vector[0].tolist()
    except Exception as e:
        logger.error(f"Error generating dense embedding: {e}")
        return [0.0] * 100
