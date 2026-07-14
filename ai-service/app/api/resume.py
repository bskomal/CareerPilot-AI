from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import pdfplumber
import docx
import io
import re
import hashlib
from math import sqrt
import logging
import spacy

logger = logging.getLogger(__name__)
router = APIRouter()

# ─── Load ONLY spaCy (fits in 512MB Render free tier) ──────────
logger.info("Loading spaCy model...")
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")
logger.info("✅ spaCy loaded successfully")

# ─── Tech Skills Database ───────────────────────────────────────
SKILLS_DB = [
    "python", "java", "javascript", "typescript", "node.js", "express",
    "react", "next.js", "mongodb", "mysql", "postgresql", "sql",
    "aws", "docker", "kubernetes", "git", "graphql", "rest", "api",
    "redis", "ci/cd", "jenkins", "terraform", "linux", "agile",
    "machine learning", "data science", "tailwind", "fastapi", "flask",
    "c++", "c#", "go", "angular", "vue", "html", "css", "vite"
]

# Common English stopwords to ignore in embeddings
STOPWORDS = set("""
    the a an and or of to in on for with is are was were be been 
    being have has had do does did will would could should may might 
    must can it its this that these those i you he she we they me 
    him her us them my your his our their as at by from up about 
    into over after than then so if not no nor but also very just 
    more most some any all each every both few many much own other 
    same such only s t don didn doesn isn aren wasn weren won wouldn't
    couldn shouldn hasn haven hadn d ll m re ve o y """.split())

# Fixed dimension for all vectors (must match between resume & job description)
VECTOR_DIM = 384

class EmbeddingRequest(BaseModel):
    text: str


def _tokenize(text: str):
    """Clean and tokenize text into meaningful words."""
    return [
        t.lower() for t in re.findall(r"[a-z0-9+#]+(?:'[a-z])?", text.lower())
        if t not in STOPWORDS and len(t) > 1
    ]


def _hash_token(token: str):
    """Deterministic hash (stable across restarts unlike Python's built-in hash())."""
    return int(hashlib.md5(token.encode('utf-8')).hexdigest(), 16)


def generate_vector(text: str):
    """
    Lightweight deterministic vectorization.
    Uses token frequency hashing + bigrams.
    Returns L2-normalized vector suitable for cosine similarity.
    
    Replaces heavy SentenceTransformer while preserving matching logic.
    """
    vec = [0.0] * VECTOR_DIM
    tokens = _tokenize(text or "")
    
    # Unigrams
    for tok in tokens:
        idx = _hash_token(tok) % VECTOR_DIM
        vec[idx] += 1.0
    
    # Bigrams (captures some context like "machine learning" as one feature)
    for i in range(len(tokens) - 1):
        bigram = f"{tokens[i]}_{tokens[i+1]}"
        idx = _hash_token(bigram) % VECTOR_DIM
        vec[idx] += 1.0
    
    # L2 Normalization (required for cosine similarity)
    norm = sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


# ─── Text Extraction ──────────────────────────────────────────

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


def extract_skills(text: str):
    """Case-insensitive skill matching from resume text."""
    lower = text.lower()
    return sorted({s for s in SKILLS_DB if s in lower})


def extract_name(text: str):
    """Extract person name using spaCy NER."""
    doc = nlp(text[:1000])
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text.strip()
    # Fallback: first line
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    return lines[0][:50] if lines else "Unknown"


def extract_section(text: str, keyword: str):
    """Extract section after a keyword (e.g., 'experience', 'education')."""
    idx = text.lower().find(keyword.lower())
    if idx != -1:
        return [text[idx : idx + 1500].strip()]
    return []


# ────────────────────────────────────────────────────────────────
# ENDPOINT 1: Parse Resume (NER + Skill Extraction)
# ────────────────────────────────────────────────────────────────

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
            "full_text": full_text[:5000]  # Limit for response size
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Parse Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")


# ────────────────────────────────────────────────────────────────
# ENDPOINT 2: Generate Embedding (Lightweight, No PyTorch needed)
# ────────────────────────────────────────────────────────────────

@router.post("/generate-embedding")
async def generate_embedding(request: EmbeddingRequest):
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text field cannot be empty.")
            
        # Truncate very long texts to save processing time
        text = request.text[:4000]
        
        logger.info(f"Generating embedding for text ({len(text)} chars)...")
        embedding = generate_vector(text)
        logger.info(f"Generated vector of dimension {len(embedding)}")
        
        return {"embedding": embedding}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Embedding Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create embedding: {str(e)}")