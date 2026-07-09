from fastapi import APIRouter, File, UploadFile, HTTPException
import shutil
import os

router = APIRouter()

def parse_resume_placeholder(file_path: str) -> dict:
    print(f"Parsing file: {file_path}")
    return {
        "name": "Placeholder Name (from AI Service)",
        "skills": ["Python", "FastAPI", "spaCy", "Docker"],
        "education": ["Placeholder University"],
        "experience": ["Placeholder Company"],
    }

@router.post("/parse-resume")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)

    temp_file_path = os.path.join(temp_dir, file.filename)

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        parsed_data = parse_resume_placeholder(temp_file_path)
        return parsed_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)