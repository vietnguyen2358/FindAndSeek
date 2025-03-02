import type { MapPin, DetectedPerson } from "@shared/types";

// Define key locations in New York with live DOT traffic camera feeds
export const mockPins: MapPin[] = [
  {
    id: 1,
    lat: 40.7589, // Times Square - 7 Ave @ W 42 St
    lng: -73.9851,
    type: "camera",
    timestamp: new Date().toISOString(),
    location: "Times Square - 7 Ave @ W 42 St",
    detectionCount: 0
  },
  {
    id: 2,
    lat: 40.7527, // 5 Ave @ 42 St (near Grand Central)
    lng: -73.9803,
    type: "camera",
    timestamp: new Date().toISOString(),
    location: "5 Ave @ 42 St",
    detectionCount: 0
  },
  {
    id: 3,
    lat: 40.7484, // 34th St @ 6th Ave (Herald Square)
    lng: -73.9877,
    type: "camera",
    timestamp: new Date().toISOString(),
    location: "34th St @ 6th Ave",
    detectionCount: 0
  },
  {
    id: 4,
    lat: 40.7580, // Columbus Circle
    lng: -73.9814,
    type: "camera",
    timestamp: new Date().toISOString(),
    location: "Columbus Circle",
    detectionCount: 0
  }
];

// NYC DOT Traffic Camera feeds - using image URLs
export const cameraFeeds = {
  1: "/images/Screenshot 2025-03-02 at 7.32.50 AM.png", // Times Square
  2: "/images/Screenshot 2025-03-02 at 7.32.38 AM.png", // 5 Ave @ 42 St
  3: "/images/Screenshot 2025-03-02 at 7.32.10 AM.png", // Herald Square
  4: "/images/Screenshot 2025-03-02 at 7.33.00 AM.png"  // Columbus Circle
};

// Empty mock data for other features
export const cameraImages = {
  1: "/images/cameras/camera1.jpg",
  2: "/images/cameras/camera2.jpg",
  3: "/images/cameras/camera3.jpg",
  // Add more as needed
};
export const mockDetections: DetectedPerson[] = [];
export const personImages = {};