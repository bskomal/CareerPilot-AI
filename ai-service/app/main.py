from fastapi import FastAPI
from dotenv import load_dotenv
from app.api import resume as resume_router

load_dotenv()

app = FastAPI(
    title="CareerPilot AI Service",
    description="AI microservice for resume and job description processing.",
    version="0.1.0"
)

@app.get("/")
def read_root():
    return {"message": "Welcome to CareerPilot AI Service"}

# Include the resume parsing router
app.include_router(resume_router.router, prefix="/api", tags=["Resume Parsing"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)