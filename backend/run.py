import uvicorn

if __name__ == "__main__":
    print("Starting FastAPI server at http://0.0.0.0:8001")
    print("API documentation available at http://0.0.0.0:8001/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True) 