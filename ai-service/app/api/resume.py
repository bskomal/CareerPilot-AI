from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.resume_parser import parse_resume

router = APIRouter()

@router.post("/parse-resume")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        parsed_data = parse_resume(file.filename, file_bytes)
        return parsed_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
