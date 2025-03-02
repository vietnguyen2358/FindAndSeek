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
export const mockDetections: DetectedPerson[] = [
  // Times Square Camera (id: 1)
  {
    id: 1,
    cameraId: 1,
    time: "2025-03-02T10:30:23",
    description: "Adult male walking south",
    confidence: 0.89,
    thumbnail: "/images/person1.jpg",
    bbox: [100, 200, 150, 300],
    details: {
      age: "30-40",
      clothing: "Navy blue peacoat, black jeans",
      environment: "Times Square sidewalk",
      movement: "Walking steadily south",
      distinctive_features: ["Grey beanie", "Brown messenger bag"]
    }
  },
  {
    id: 2,
    cameraId: 1,
    time: "2025-03-02T10:31:15",
    description: "Young female with shopping bags",
    confidence: 0.92,
    thumbnail: "/images/person2.jpg",
    bbox: [250, 150, 300, 280],
    details: {
      age: "20-25",
      clothing: "Red puffer jacket, white sneakers",
      environment: "Near crosswalk",
      movement: "Standing at intersection",
      distinctive_features: ["Multiple shopping bags", "Long blonde hair"]
    }
  },

  // 5 Ave @ 42 St Camera (id: 2)
  {
    id: 3,
    cameraId: 2,
    time: "2025-03-02T10:32:00",
    description: "Elderly person with cane",
    confidence: 0.87,
    thumbnail: "/images/person3.jpg",
    bbox: [400, 200, 450, 350],
    details: {
      age: "65-75",
      clothing: "Brown trench coat, grey slacks",
      environment: "Near bus stop",
      movement: "Walking slowly with assistance",
      distinctive_features: ["Walking cane", "Fedora hat"]
    }
  },
  {
    id: 4,
    cameraId: 2,
    time: "2025-03-02T10:32:45",
    description: "Business professional",
    confidence: 0.94,
    thumbnail: "/images/person4.jpg",
    bbox: [150, 300, 200, 400],
    details: {
      age: "35-45",
      clothing: "Black suit, burgundy tie",
      environment: "Building entrance",
      movement: "Entering office building",
      distinctive_features: ["Briefcase", "White dress shirt"]
    }
  },

  // Herald Square Camera (id: 3)
  {
    id: 5,
    cameraId: 3,
    time: "2025-03-02T10:31:30",
    description: "Teen with backpack",
    confidence: 0.88,
    thumbnail: "/images/person5.jpg",
    bbox: [300, 250, 350, 380],
    details: {
      age: "15-18",
      clothing: "Green hoodie, black backpack",
      environment: "Herald Square Plaza",
      movement: "Walking with friends",
      distinctive_features: ["Large black backpack", "White headphones"]
    }
  },
  {
    id: 6,
    cameraId: 3,
    time: "2025-03-02T10:32:15",
    description: "Delivery worker on bike",
    confidence: 0.91,
    thumbnail: "/images/person6.jpg",
    bbox: [200, 150, 250, 300],
    details: {
      age: "25-35",
      clothing: "Food delivery jacket, black pants",
      environment: "Bike lane",
      movement: "Cycling east",
      distinctive_features: ["Delivery bag", "Bicycle helmet"]
    }
  },

  // Columbus Circle Camera (id: 4)
  {
    id: 7,
    cameraId: 4,
    time: "2025-03-02T10:30:45",
    description: "Jogger in athletic wear",
    confidence: 0.93,
    thumbnail: "/images/person7.jpg",
    bbox: [350, 200, 400, 350],
    details: {
      age: "25-30",
      clothing: "Blue running jacket, black leggings",
      environment: "Park entrance",
      movement: "Jogging in place at light",
      distinctive_features: ["Fitness tracker", "Running shoes"]
    }
  },
  {
    id: 8,
    cameraId: 4,
    time: "2025-03-02T10:31:45",
    description: "Tourist with camera",
    confidence: 0.86,
    thumbnail: "/images/person8.jpg",
    bbox: [250, 300, 300, 450],
    details: {
      age: "40-50",
      clothing: "Khaki shorts, white t-shirt",
      environment: "Near monument",
      movement: "Taking photos",
      distinctive_features: ["DSLR camera", "Sun hat"]
    }
  }
];

export const personImages = {};