# Find & Seek - AI-Powered Missing Persons Platform

## Prerequisites

- Node.js (v18 or later)
- npm (included with Node.js)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
MAPBOX_TOKEN=your_mapbox_token
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd find-and-seek
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Features

- Real-time person detection using AI
- Interactive map with location tracking
- Smart search functionality with Groq embeddings
- Detailed person analysis with GPT-4 Vision
- Live camera feed analysis
- Case management system

## Tech Stack

- React + Vite
- Express.js backend
- OpenAI GPT-4 Vision
- Groq API for embeddings
- Mapbox for mapping
- TailwindCSS + shadcn/ui for styling

## Development

The project uses a monorepo structure:
- `/client` - React frontend
- `/server` - Express backend
- `/shared` - Shared types and schemas

## License

MIT License
