# Find and Seek

This is a modern web application for locating missing persons.

## Setup

1. Install dependencies:
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

2. Configure environment variables:
   - Copy `backend/.env.example` to `backend/.env` (if it exists)
   - Add your OpenAI API key to `backend/.env`
   - Add your Groq API key to `backend/.env` (optional, for enhanced comparison)

## Running the Development Server

To run the frontend development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

To run the backend development server:

```bash
npm run backend
```

The backend will be available at `http://localhost:8000` with API documentation at `http://localhost:8000/docs`.

## Building for Production

```bash
npm run build
npm run start
```

## Development

The application is built with:

### Frontend
- React - UI library
- Tailwind CSS - Utility-first CSS framework
- Shadcn UI - UI component library 
- TypeScript - Type safety for JavaScript
- Vite - Next generation frontend tooling

### Backend
- FastAPI - Modern, fast web framework for building APIs with Python
- OpenAI - Integration with GPT-4o for image analysis
- Groq - Optional LLM for comparing missing persons with detected individuals
- YOLO (optional) - Object detection for identifying people in images
- OpenCV (optional) - Computer vision for image processing
- Pydantic - Data validation and settings management

## Project Structure

- `client/src/` - Contains the React application code
  - `components/` - UI components
  - `pages/` - Page components
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions and shared code
- `shared/` - Shared types and utilities
- `backend/` - FastAPI backend application
  - `app/` - Python package containing the application
  - `requirements.txt` - Python dependencies

## API Endpoints

- `GET /` - Root endpoint, returns a welcome message
- `POST /api/analyzeimage` - Analyzes an uploaded image and returns information about a person
- `POST /api/compare-images` - Compares a missing person image with a search image to find potential matches

### Image Comparison API

The image comparison API allows you to:
1. Upload an image of a missing person
2. Upload a search image that might contain the missing person
3. Receive an analysis that compares the missing person to any people detected in the search image

The endpoint uses:
- OpenAI's GPT-4o Vision model for analyzing people in images
- YOLO (if available) for detecting people in the search image
- Groq's Llama 3 model (if available) for comparing the missing person with detected individuals

Example usage with cURL:
```bash
curl -X POST "http://localhost:8000/api/compare-images" \
  -F "missing_person_image=@/path/to/missing_person.jpg" \
  -F "search_image=@/path/to/search_image.jpg"
```

## Testing

You can test the image comparison functions without running the server:

```bash
cd backend
python simple_test.py
```

Note: You'll need to add test images to `backend/test_images/` directory:
- `missing_person.jpg` - An image of a person to search for
- `search.jpg` - An image that may contain the person

## License

MIT