import type { MapPin } from "@shared/types";

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

// Use a single real image for testing person detection
export const cameraImages = {
  1: "https://images.unsplash.com/photo-1517732306149-e8f829eb588a?q=80&w=1000&auto=format&fit=crop",
  2: "https://images.unsplash.com/photo-1517732306149-e8f829eb588a?q=80&w=1000&auto=format&fit=crop",
  3: "https://images.unsplash.com/photo-1517732306149-e8f829eb588a?q=80&w=1000&auto=format&fit=crop"
};