# Find and Seek Backend

This is the FastAPI backend for the Find and Seek application. It provides the API endpoints for managing missing person cases, analyzing images, and predicting movement patterns.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

To run the development server:

```bash
uvicorn app.main:app --host localhost --port 3000 --reload
```

The server will be available at `http://localhost:3000`.

## API Documentation

Once the server is running, you can access:
- Interactive API documentation (Swagger UI): `http://localhost:3000/docs`
- Alternative API documentation (ReDoc): `http://localhost:3000/redoc`

## API Endpoints

- `POST /api/cases` - Create a new case
- `GET /api/cases` - Get all cases
- `GET /api/cases/{id}` - Get a specific case
- `PATCH /api/cases/{id}` - Update a case
- `POST /api/cases/{id}/analyze-image` - Analyze an image for a case
- `POST /api/footage` - Add new camera footage
- `GET /api/cases/{id}/footage` - Get all footage for a case
- `POST /api/cases/{id}/predict-movement` - Predict movement patterns

## Development

The backend is built with:
- FastAPI - Modern Python web framework
- Pydantic - Data validation using Python type annotations
- Uvicorn - Lightning-fast ASGI server

The application uses an in-memory storage system for development purposes. For production, you should implement a proper database backend.