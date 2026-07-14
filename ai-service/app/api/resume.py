from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import pdfplumber
import docx
import io
import logging
import spacy
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

router = APIRouter()

# Load spaCy model
logger.info("Loading spaCy model...")
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")
logger.info("spaCy model loaded.")

# Load Sentence Transformer model (loads once at startup)
logger.info("Loading Sentence Transformer model...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
logger.info("Sentence Transformer model loaded.")

# Common tech skills
SKILLS_LIST = [
    "python", "java", "javascript", "typescript", "node.js", "express",
    "react", "next.js", "mongodb", "sql", "mysql", "postgresql",
    "aws", "docker", "kubernetes", "git", "api", "rest", "graphql",
    "agile", "ci/cd", "jenkins", "terraform", "linux", "redis",
    "machine learning", "data science", "tailwind", "fastapi", "flask",
    "c++", "c#", "ruby", "go", "rust", "angular", "vue",
    "html", "css", "sass", "webpack", "vite"
]


class EmbeddingRequest(BaseModel):
    text: str


def extract_text_from_file(file_bytes, filename):
    text = ""
    lower_name = filename.lower()

    if lower_name.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

    elif lower_name.endswith(".docx"):
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])

    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF or DOCX.")

    return text.strip()


def extract_skills(text):
    text_lower = text.lower()
    found = set()
    for skill in SKILLS_LIST:
        if skill.lower() in text_lower:
            found.add(skill)
    return sorted(list(found))


def extract_name(text):
    doc = nlp(text[:1000])
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text.strip()
    lines = text.strip().split("\n")
    if lines:
        return lines[0][:50].strip()
    return "Unknown"


def extract_section(text, keyword):
    sections = []
    lower_text = text.lower()
    idx = lower_text.find(keyword.lower())
    if idx != -1:
        section = text[idx:idx + 1500].strip()
        if section:
            sections.append(section)
    return sections


@router.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        full_text = extract_text_from_file(file_bytes, file.filename)

        if not full_text:
            raise HTTPException(status_code=400, detail="Could not extract text from file")

        skills = extract_skills(full_text)
        name = extract_name(full_text)
        experience = extract_section(full_text, "experience")
        education = extract_section(full_text, "education")

        return {
            "filename": file.filename,
            "extracted_name": name,
            "extracted_skills": skills,
            "extracted_experience": experience,
            "extracted_education": education,
            "full_text": full_text[:5000]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Parse Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")


@router.post("/generate-embedding")
async def generate_embedding(request: EmbeddingRequest):
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")

        # Limit text length to prevent memory issues on free tier
        text = request.text[:3000]
        embedding = embedding_model.encode(text).tolist()

        return {"embedding": embedding}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Embedding Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")