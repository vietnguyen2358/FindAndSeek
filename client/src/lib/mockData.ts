import type { MapPin, DetectedPerson } from "@shared/types";

// Define 4 key locations in New York
export const mockPins: MapPin[] = [
  {
    id: 1,
    lat: 40.7580, // Times Square
    lng: -73.9855,
    type: "camera",
    timestamp: new Date().toISOString(),
    location: "Times Square",
    detectionCount: 0
  },
  {
    id: 2,
    lat: 40.7527, // Grand Central
    lng: -73.9772,
    type: "camera",
    timestamp: new Date().toISOString(),
    location: "Grand Central Terminal",
    detectionCount: 0
  },
  {
    id: 3,
    lat: 40.7484, // Empire State
    lng: -73.9857,
    type: "camera",
    timestamp: new Date().toISOString(),
    location: "Empire State Building",
    detectionCount: 0
  },
  {
    id: 4,
    lat: 40.7829, // Central Park
    lng: -73.9654,
    type: "camera",
    timestamp: new Date().toISOString(),
    location: "Central Park",
    detectionCount: 0
  }
];

// Empty mock data for other features
export const cameraFeeds = {};
export const cameraImages = {};
export const mockDetections: DetectedPerson[] = [];
export const personImages = {};