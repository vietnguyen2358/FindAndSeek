# FindAndSeekPro

A sophisticated surveillance monitoring system with real-time camera feed displays, detection analytics, and user role management.

## Overview

FindAndSeekPro is a web application designed for security personnel and investigators to monitor camera feeds, track detections, and manage case files. The application features a clean, modern UI with an intuitive dashboard for real-time surveillance monitoring.

## Project Structure

The project is organized into two main components:

- **Server**: Express.js backend API handling data requests and camera feed processing
- **Client**: React frontend with Vite for a responsive user interface

## Features

- Real-time camera feed monitoring
- Detection analytics and visualization
- Case management system
- User role selection (operator/investigator)
- Timeline view for historical data
- File upload capabilities for case evidence

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/vietnguyen2358/FindAndSeek.git
   cd FindAndSeekPro
   ```

2. Install dependencies:
   ```
   npm install
   cd client
   npm install
   cd ..
   ```

### Running the Application

**Important**: To avoid port conflicts, the server and client should run on different ports.

1. Start the server (in one terminal):
   ```
   cd server
   PORT=3001 npm run dev
   ```

2. Start the client (in another terminal):
   ```
   cd client
   npm run dev
   ```

The server will run on port 3001, and the client will run on port 5173 (Vite's default) or another available port.

## Troubleshooting

### Port Conflicts

If you encounter `EADDRINUSE` errors when starting either the server or client:

1. Ensure no other processes are running on the same ports:
   ```
   lsof -i :3000,3001,5000 | grep LISTEN
   ```

2. Kill any conflicting processes:
   ```
   kill -9 <PID>
   ```

3. Use different ports for server and client by setting the PORT environment variable:
   ```
   PORT=3001 npm run dev  # For server
   ```

### Images Not Loading

If images are not displaying correctly:

1. Verify that image paths in `Data.ts` are correctly set to reference files in the public directory
2. Access images using paths relative to the root (e.g., `/Screenshot 2025-03-02 at 7.33.00 AM.png`)
3. Check browser console for 404 errors related to image loading

## Development

### Server

The server is built with Express.js and provides REST API endpoints for:
- Camera feed data
- Detection events
- Case management

### Client

The client is built with:
- React for UI components
- Tailwind CSS for styling
- React Router for navigation

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## License

This project is licensed under the MIT License.
