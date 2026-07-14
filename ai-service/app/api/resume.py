from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import pdfplumber
import docx
import io
import re
import logging
import hashlib
from math import sqrt
import spacy

logger = logging.getLogger(__name__)
router = APIRouter()

# ---- Load spaCy ONCE (fits in 512MB). NO torch / sentence-transformers ----
logger.info("Loading spaCy model...")
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")
logger.info("spaCy model loaded.")

SKILLS_LIST = [
    "python", "java", "javascript", "typescript", "node.js", "express",
    "react", "next.js", "mongodb", "sql", "mysql", "postgresql",
    "aws", "docker", "kubernetes", "git", "api", "rest", "graphql",
    "agile", "ci/cd", "jenkins", "terraform", "linux", "redis",
    "machine learning", "data science", "tailwind", "fastapi", "flask",
    "c++", "c#", "go", "angular", "vue", "html", "css", "vite",
    "deep learning", "nlp", "pandas", "numpy", "scikit-learn",
    "tensorflow", "keras", "xgboost", "streamlit"
]

STOPWORDS = set("the a an and or of to in on for with is are was were be been being have has had do does did will would could should may might must can it its this that these those i you he she we they me him her us them my your his our their as at by from up about into over after than then so if not no nor but also very just more most some any all each every both few many much own other same such only s t don didn doesn isn aren wasn weren won wouldn couldn shouldn".split())

VECTOR_DIM = 512

class EmbeddingRequest(BaseModel):
    text: str

# ---------- lightweight, deterministic vectorizer (NO heavy model) ----------
def _stable_hash(s: str) -> int:
    return int(hashlib.md5(s.encode("utf-8")).hexdigest(), 16)

def _tokenize(text: str):
    tokens = re.findall(r"[a-z0-9+#]+", text.lower())
    return [t for t in tokens if t not in STOPWORDS and len(t) > 1]

def generate_vector(text: str):
    vec = [0.0] * VECTOR_DIM
    tokens = _tokenize(text or "")
    for tok in tokens:                      # unigrams
        vec[_stable_hash(tok) % VECTOR_DIM] += 1.0
    for i in range(len(tokens) - 1):        # bigrams (a little semantics)
        bg = tokens[i] + "_" + tokens[i + 1]
        vec[_stable_hash(bg) % VECTOR_DIM] += 1.0
    norm = sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]          # L2-normalized -> cosine = dot product

# ---------- text extraction ----------
def extract_text_from_file(file_bytes, filename):
    text = ""
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
    elif name.endswith(".docx"):
        d = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join(p.text for p in d.paragraphs)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF or DOCX.")
    return text.strip()

def extract_skills(text):
    low = text.lower()
    return sorted({s for s in SKILLS_LIST if s.lower() in low})

def extract_name(text):
    for ent in nlp(text[:1000]).ents:
        if ent.label_ == "PERSON":
            return ent.text.strip()
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    return lines[0][:50] if lines else "Unknown"

def extract_section(text, keyword):
    idx = text.lower().find(keyword.lower())
    return [text[idx:idx + 1500].strip()] if idx != -1 else []

# ---------- endpoints ----------
@router.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        full_text = extract_text_from_file(file_bytes, file.filename)
        if not full_text:
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        return {
            "filename": file.filename,
            "extracted_name": extract_name(full_text),
            "extracted_skills": extract_skills(full_text),
            "extracted_experience": extract_section(full_text, "experience"),
            "extracted_education": extract_section(full_text, "education"),
            "full_text": full_text[:5000],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Parse Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {e}")

@router.post("/generate-embedding")
async def generate_embedding(request: EmbeddingRequest):
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")
        return {"embedding": generate_vector(request.text[:4000])}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Embedding Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {e}")