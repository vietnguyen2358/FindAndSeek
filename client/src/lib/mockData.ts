import type { MapPin, DetectedPerson } from "@shared/types";

// Generate a grid of pins around NYC
export const mockPins: MapPin[] = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  lat: 40.7128 + (Math.random() - 0.5) * 0.02,
  lng: -74.006 + (Math.random() - 0.5) * 0.02,
  type: i % 3 === 0 ? "camera" : "lastSeen",
  timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
  location: `Location ${i + 1}`
}));

// Mock detections with rich descriptions
export const mockDetections: DetectedPerson[] = [
  {
    id: 1,
    time: new Date(Date.now() - 1800000).toLocaleString(),
    description: "Young woman in red coat walking north",
    confidence: 0.92,
    details: {
      age: "25-30",
      clothing: "Red winter coat, black pants, brown boots",
      environment: "Crossing at main intersection",
      movement: "Walking north at moderate pace",
      distinctive_features: ["Red coat", "Shoulder-length brown hair", "Large black tote bag"]
    }
  },
  {
    id: 2,
    time: new Date(Date.now() - 2400000).toLocaleString(),
    description: "Elderly man with walking stick",
    confidence: 0.88,
    details: {
      age: "65-75",
      clothing: "Navy blue jacket, grey slacks, flat cap",
      environment: "Near bus stop on Main Street",
      movement: "Walking slowly eastbound",
      distinctive_features: ["Walking stick", "Flat cap", "Grey beard"]
    }
  },
  {
    id: 3,
    time: new Date(Date.now() - 3000000).toLocaleString(),
    description: "Teenager with backpack on skateboard",
    confidence: 0.95,
    details: {
      age: "15-18",
      clothing: "Black hoodie, ripped jeans, white sneakers",
      environment: "Skate park entrance",
      movement: "Skateboarding west",
      distinctive_features: ["Black backpack", "Red skateboard", "White baseball cap"]
    }
  },
  {
    id: 4,
    time: new Date(Date.now() - 3600000).toLocaleString(),
    description: "Business woman with briefcase",
    confidence: 0.91,
    details: {
      age: "35-45",
      clothing: "Grey business suit, white blouse, black heels",
      environment: "Financial district sidewalk",
      movement: "Walking briskly south",
      distinctive_features: ["Black leather briefcase", "Professional attire", "Short blonde hair"]
    }
  },
  {
    id: 5,
    time: new Date(Date.now() - 4200000).toLocaleString(),
    description: "Construction worker in safety gear",
    confidence: 0.89,
    details: {
      age: "30-40",
      clothing: "Yellow safety vest, blue jeans, work boots",
      environment: "Construction site entrance",
      movement: "Standing still, then walking east",
      distinctive_features: ["Hard hat", "Safety vest", "Tool belt"]
    }
  }
];

// Test images for visualization
export const personImages = {
  1: "https://images.unsplash.com/photo-1517732306149-e8f829eb588a",
  2: "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c",
  3: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea",
  4: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
  5: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990"
};