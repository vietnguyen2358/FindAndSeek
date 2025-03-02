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
  1: "https://webcams.nyctmc.org/api/cameras/9254a9b3-56dd-4498-94d9-4f2e60b1c090/image", // Times Square
  2: "https://webcams.nyctmc.org/api/cameras/8724e8fa-9e04-4c35-8ac8-46c30531e78d/image", // 5 Ave @ 42 St
  3: "https://webcams.nyctmc.org/api/cameras/4ac8d9c0-1fc9-4d87-96e2-f6fa6c6f185b/image", // Herald Square
  4: "https://webcams.nyctmc.org/api/cameras/cd9bac28-0d41-4fb9-bf0d-6549f39c4724/image"  // Columbus Circle
};

// Empty mock data for other features
export const cameraImages = {};
export const mockDetections: DetectedPerson[] = [];
export const personImages = {};