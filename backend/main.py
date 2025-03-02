from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from models import Clothing, PersonDescription, ProcessingResponse
from constants import OPENAI_API_KEY, GROQ_API_KEY

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return JSONResponse({
        "message": "Welcome to Find & Seek API",
        "endpoints": {
            "/": "This information",
            "/process/": "POST - Upload an image/video for processing",
            "/health": "GET - Check API health status"
        },
        "docs_url": "/docs",
        "status": "running"
    })

@app.post("/process")
async def process_media():
    return

if __name__ == "__main__":
    uvicorn.run('main:app', port=8000, reload=True)