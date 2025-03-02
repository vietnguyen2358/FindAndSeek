import type { MapPin, DetectedPerson, DetectedPersonDetails } from "@shared/types";

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
  1: "/images/cameras/camera1.png", // Times Square
  2: "/images/cameras/camera2.png", // 5 Ave @ 42 St
  3: "/images/cameras/camera3.png", // Herald Square
  4: "/images/cameras/camera4.png"  // Columbus Circle
};

// Empty mock data for other features
export const cameraImages = {
  1: "/images/cameras/camera1.png",
  2: "/images/cameras/camera2.png",
  3: "/images/cameras/camera3.png",
  4: "/images/cameras/camera4.png"
};
export const mockDetections: DetectedPerson[] = [
  // Times Square Camera (id: 1)
  {
    id: 1,
    cameraId: 1,
    time: "2025-03-02T15:32:10.000Z",
    description: "Male, early 30s, athletic build",
    confidence: 0.92,
    thumbnail: "/images/cameras/camera1.png",
    bbox: [120, 80, 100, 200],
    details: {
      age: "30-35",
      clothing: "Red hoodie, black joggers",
      environment: "Near park bench",
      movement: "Walking slowly",
      distinctive_features: ["Baseball cap", "White sneakers"]
    }
  },
  {
    id: 2,
    cameraId: 1,
    time: "2025-03-02T15:32:10.000Z",
    description: "Female, mid-20s, slim build",
    confidence: 0.87,
    thumbnail: "/images/cameras/camera1.png",
    bbox: [320, 120, 90, 180],
    details: {
      age: "23-28",
      clothing: "Blue denim jacket, white t-shirt, black leggings",
      environment: "Walking on path",
      movement: "Brisk walking",
      distinctive_features: ["Large tote bag", "Ponytail"]
    }
  },
  {
    id: 3,
    cameraId: 1,
    time: "2025-03-02T15:32:10.000Z",
    description: "Male, teenager, medium build",
    confidence: 0.78,
    thumbnail: "/images/cameras/camera1.png",
    bbox: [450, 150, 80, 160],
    details: {
      age: "15-18",
      clothing: "Green t-shirt with logo, khaki shorts",
      environment: "Near water fountain",
      movement: "Standing still",
      distinctive_features: ["Skateboard", "Headphones"]
    }
  },

  // Downtown Mall Camera (id: 2)
  {
    id: 4,
    cameraId: 2,
    time: "2025-03-02T15:32:38.000Z",
    description: "Female, early 40s, tall",
    confidence: 0.89,
    thumbnail: "/images/cameras/camera2.png",
    bbox: [200, 100, 95, 190],
    details: {
      age: "40-45",
      clothing: "Yellow blouse, black pants, formal coat",
      environment: "Near mall entrance",
      movement: "Walking through doors",
      distinctive_features: ["Glasses", "Shoulder-length hair"]
    }
  },
  {
    id: 5,
    cameraId: 2,
    time: "2025-03-02T15:32:38.000Z",
    description: "Male, late 20s, muscular build",
    confidence: 0.91,
    thumbnail: "/images/cameras/camera2.png",
    bbox: [350, 130, 110, 210],
    details: {
      age: "27-32",
      clothing: "Navy blue polo shirt, beige chinos",
      environment: "Walking through doors",
      movement: "Entering building",
      distinctive_features: ["Beard", "Wristwatch"]
    }
  },
  
  // Subway Station Camera (id: 3)
  {
    id: 8,
    cameraId: 3,
    time: "2025-03-02T15:32:50.000Z",
    description: "Male, mid-30s, average build",
    confidence: 0.94,
    thumbnail: "/images/cameras/camera3.png",
    bbox: [150, 120, 100, 200],
    details: {
      age: "33-38",
      clothing: "Brown leather jacket, black jeans",
      environment: "Coming up stairs",
      movement: "Climbing stairs",
      distinctive_features: ["Messenger bag", "Beanie hat"]
    }
  },
  {
    id: 9,
    cameraId: 3,
    time: "2025-03-02T15:32:50.000Z",
    description: "Female, late 20s, athletic",
    confidence: 0.88,
    thumbnail: "/images/cameras/camera3.png",
    bbox: [300, 150, 90, 180],
    details: {
      age: "26-30",
      clothing: "Gray athletic jacket, black leggings",
      environment: "Near ticket machines",
      movement: "Checking phone",
      distinctive_features: ["Headphones", "Water bottle"]
    }
  },

  // City Park Camera (id: 4)
  {
    id: 11,
    cameraId: 4,
    time: "2025-03-02T15:33:00.000Z",
    description: "Female, mid-30s, tall",
    confidence: 0.93,
    thumbnail: "/images/cameras/camera4.png",
    bbox: [180, 110, 95, 190],
    details: {
      age: "33-38",
      clothing: "Green rain jacket, dark jeans",
      environment: "Walking on path",
      movement: "Walking with dog",
      distinctive_features: ["Long blonde hair", "Dog on leash"]
    }
  },
  {
    id: 12,
    cameraId: 4,
    time: "2025-03-02T15:33:00.000Z",
    description: "Male, early 20s, slim",
    confidence: 0.84,
    thumbnail: "/images/cameras/camera4.png",
    bbox: [320, 140, 90, 180],
    details: {
      age: "20-25",
      clothing: "Blue university sweatshirt, gray sweatpants",
      environment: "Jogging near trees",
      movement: "Jogging",
      distinctive_features: ["Backpack", "Running shoes"]
    }
  },
  {
    id: 13,
    cameraId: 4,
    time: "2025-03-02T15:33:00.000Z",
    description: "Female, child (approximately 8-10), small",
    confidence: 0.76,
    thumbnail: "/images/cameras/camera4.png",
    bbox: [420, 160, 70, 140],
    details: {
      age: "8-10",
      clothing: "Pink jacket, purple skirt, white tights",
      environment: "Near playground",
      movement: "Playing",
      distinctive_features: ["Pigtails", "Holding balloon"]
    }
  }
];

export const personImages = {};