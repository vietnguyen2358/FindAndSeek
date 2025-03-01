import type { Alert, DetectedPerson, MapPin } from "@shared/types";

export const mockPins: MapPin[] = [
  {
    id: 1,
    lat: 40.7128,
    lng: -74.006,
    type: "camera",
    timestamp: "2024-03-21 15:30",
    location: "Transit Center",
  },
  {
    id: 2,
    lat: 40.7158,
    lng: -74.009,
    type: "camera",
    timestamp: "2024-03-21 16:45",
    location: "Downtown Plaza",
  },
  {
    id: 3,
    lat: 40.7148,
    lng: -74.007,
    type: "lastSeen",
    timestamp: "2024-03-21 16:00",
    location: "City Hall",
  },
];

export const mockDetections: DetectedPerson[] = [
  {
    id: 1,
    time: "10:15 AM",
    description: "Male, mid-20s, red jacket, blue jeans, carrying backpack",
    confidence: 0.89,
    thumbnail: "https://placehold.co/100x100/darkblue/white?text=Person+1",
    bbox: [0.2, 0.1, 0.4, 0.9],
  },
  {
    id: 2,
    time: "10:16 AM",
    description: "Female, early 20s, black coat, blonde hair",
    confidence: 0.75,
    thumbnail: "https://placehold.co/100x100/darkblue/white?text=Person+2",
    bbox: [0.6, 0.1, 0.8, 0.9],
  },
  {
    id: 3,
    time: "10:17 AM",
    description: "Male, late 30s, brown leather jacket, glasses",
    confidence: 0.82,
    thumbnail: "https://placehold.co/100x100/darkblue/white?text=Person+3",
    bbox: [0.4, 0.1, 0.6, 0.9],
  },
];

export const mockAlerts: Alert[] = [
  {
    id: 1,
    type: "detection",
    title: "High Confidence Detection",
    description: "Person matching description spotted at Transit Center",
    time: "2 minutes ago",
    confidence: 0.89,
  },
  {
    id: 2,
    type: "area_update",
    title: "Search Area Updated",
    description: "Search radius expanded to include Downtown district",
    time: "5 minutes ago",
  },
  {
    id: 3,
    type: "match",
    title: "Potential Match Found",
    description: "Red jacket, male, 5'10\" spotted on 5th Avenue camera",
    time: "10 minutes ago",
    confidence: 0.75,
  },
];

// Mock video stream frames (base64 encoded black frames with white text)
export const mockVideoFrames = Array.from({ length: 30 }, (_, i) => 
  `data:image/svg+xml,${encodeURIComponent(`
    <svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="black"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
        Camera Feed Frame ${i + 1}
      </text>
    </svg>
  `)}`
);
