import type { MapPin, DetectedPerson } from "@shared/types";

// Define key locations in New York with Herald Square as primary camera
export const mockPins: MapPin[] = [
  {
    id: 1,
    lat: 40.7502, // Herald Square
    lng: -73.9877,
    type: "camera",
    timestamp: new Date().toISOString(),
    location: "Herald Square",
    detectionCount: 0
  },
  {
    id: 2,
    lat: 40.7580, // Times Square
    lng: -73.9855,
    type: "camera",
    timestamp: new Date().toISOString(),
    location: "Times Square",
    detectionCount: 0
  },
  {
    id: 3,
    lat: 40.7527, // Grand Central
    lng: -73.9772,
    type: "camera",
    timestamp: new Date().toISOString(),
    location: "Grand Central Terminal",
    detectionCount: 0
  },
  {
    id: 4,
    lat: 40.7484, // Empire State
    lng: -73.9857,
    type: "camera",
    timestamp: new Date().toISOString(),
    location: "Empire State Building",
    detectionCount: 0
  }
];

// Live camera feed for Herald Square and other locations (if available)
export const cameraFeeds = {
  1: "https://www.earthcam.com/usa/newyork/heraldsquare/?cam=heraldsquare_nyc",
  2: "",
  3: "",
  4: ""
};

// Empty mock data for other features
export const cameraImages = {};
export const mockDetections: DetectedPerson[] = [];
export const personImages = {};