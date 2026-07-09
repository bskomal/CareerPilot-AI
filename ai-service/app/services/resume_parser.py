import io
import logging
import pdfplumber
import docx
import spacy
from spacy.tokens import Doc

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ Skill keywords (can expand later)
SKILL_KEYWORDS = [
    'python', 'java', 'c++', 'javascript', 'react', 'angular', 'vue',
    'node.js', 'express', 'mongodb', 'sql', 'nosql', 'aws', 'azure',
    'gcp', 'docker', 'kubernetes', 'git', 'ci/cd', 'agile', 'scrum',
    'machine learning', 'data science', 'api', 'rest', 'graphql',
    'typescript', 'tailwind'
]

EDUCATION_TRIGGERS = [
    'university', 'college', 'b.s', 'b.sc', 'bachelor',
    'm.s', 'm.sc', 'master', 'ph.d', 'education'
]

EXPERIENCE_TRIGGERS = [
    'experience', 'worked', 'developed', 'managed',
    'led', 'engineered', 'built', 'intern'
]

# ✅ Load spaCy model
try:
    logger.info("Loading spaCy model...")
    nlp = spacy.load('en_core_web_sm')
    logger.info("spaCy model loaded.")
except OSError:
    logger.error("spaCy model not found. Run: python -m spacy download en_core_web_sm")
    nlp = None


# ================================
# ✅ File Text Extraction
# ================================

def _extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    except Exception as e:
        logger.error(f"Failed to parse PDF: {e}")
        raise ValueError("Could not extract text from PDF.")


def _extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        document = docx.Document(io.BytesIO(file_bytes))
        return "\n".join([para.text for para in document.paragraphs])
    except Exception as e:
        logger.error(f"Failed to parse DOCX: {e}")
        raise ValueError("Could not extract text from DOCX.")


# ================================
# ✅ Name Extraction (Improved)
# ================================

def _extract_name(text: str, doc: Doc) -> str:
    # ✅ Try spaCy PERSON entity first
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text.strip()

    # ✅ Fallback: first short non-empty line
    lines = text.split("\n")
    for line in lines:
        clean_line = line.strip()
        if clean_line and len(clean_line.split()) <= 4:
            return clean_line

    return None


# ================================
# ✅ Skill Extraction
# ================================

def _extract_skills(text: str) -> list:
    found_skills = set()
    text_lower = text.lower()

    for skill in SKILL_KEYWORDS:
        if skill in text_lower:
            found_skills.add(skill)

    return sorted(list(found_skills))


# ================================
# ✅ Section Extraction
# ================================

def _extract_sections(doc: Doc, triggers: list) -> list:
    found_sentences = []

    for sent in doc.sents:
        if any(trigger in sent.text.lower() for trigger in triggers):
            found_sentences.append(sent.text.strip())

    return found_sentences


# ================================
# ✅ Main Parsing Function
# ================================

def parse_resume(filename: str, file_bytes: bytes) -> dict:
    if nlp is None:
        raise RuntimeError("spaCy model is not available.")

    text = ""

    if filename.lower().endswith('.pdf'):
        text = _extract_text_from_pdf(file_bytes)
    elif filename.lower().endswith('.docx'):
        text = _extract_text_from_docx(file_bytes)
    else:
        raise ValueError("Unsupported file type. Please upload a PDF or DOCX.")

    if not text:
        raise ValueError("Could not extract any text from the document.")

    doc = nlp(text)

    name = _extract_name(text, doc)
    skills = _extract_skills(text)
    experience = _extract_sections(doc, EXPERIENCE_TRIGGERS)
    education = _extract_sections(doc, EDUCATION_TRIGGERS)

    return {
        "filename": filename,
        "extracted_name": name,
        "extracted_skills": skills,
        "extracted_experience": experience,
        "extracted_education": education,
        "full_text": text
    }