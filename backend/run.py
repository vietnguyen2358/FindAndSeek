import os
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    print(f"Starting server at http://{host}:{port}")
    print(f"API documentation available at http://{host}:{port}/docs")
    
    uvicorn.run("app.main:app", host=host, port=port, reload=True) 