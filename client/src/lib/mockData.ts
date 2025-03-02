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
    description: "Person in dark clothing crossing at crosswalk, heading east",
    confidence: 0.89,
    thumbnail: "https://media.gettyimages.com/id/1459839633/photo/people-walking-across-crosswalk-in-city-downtown-top-view.jpg?s=612x612&w=gi&k=20&c=U2wnD0_EEZDO2xT62DAR4HexIsjBThPwOpykkabEKOU=",
    bbox: [0.3, 0.4, 0.1, 0.2],
    details: {
      age: "20-30 years",
      clothing: "Dark winter coat, blue jeans, carrying backpack",
      environment: "Crossing at marked pedestrian crosswalk",
      movement: "Walking east at moderate pace",
      distinctive_features: [
        "Large black backpack",
        "Quick, purposeful stride",
        "Solo pedestrian"
      ]
    }
  },
  {
    id: 2,
    time: "10:16 AM",
    description: "Individual with light-colored coat using crosswalk, northbound",
    confidence: 0.85,
    thumbnail: "https://media.gettyimages.com/id/1459839633/photo/people-walking-across-crosswalk-in-city-downtown-top-view.jpg?s=612x612&w=gi&k=20&c=U2wnD0_EEZDO2xT62DAR4HexIsjBThPwOpykkabEKOU=",
    bbox: [0.5, 0.45, 0.1, 0.2],
    details: {
      age: "30-40 years",
      clothing: "Light beige coat, dark pants, possible shoulder bag",
      environment: "Middle of crosswalk intersection",
      movement: "Walking north, slightly slower pace",
      distinctive_features: [
        "Light-colored coat stands out",
        "Carrying shoulder bag",
        "Careful walking pattern"
      ]
    }
  },
  {
    id: 3,
    time: "10:17 AM",
    description: "Person with backpack at intersection corner, waiting to cross",
    confidence: 0.92,
    thumbnail: "https://media.gettyimages.com/id/1459839633/photo/people-walking-across-crosswalk-in-city-downtown-top-view.jpg?s=612x612&w=gi&k=20&c=U2wnD0_EEZDO2xT62DAR4HexIsjBThPwOpykkabEKOU=",
    bbox: [0.7, 0.3, 0.1, 0.2],
    details: {
      age: "20-25 years",
      clothing: "Red jacket, dark jeans, black backpack",
      environment: "Standing at corner of intersection",
      movement: "Stationary, waiting to cross",
      distinctive_features: [
        "Bright red jacket",
        "Black backpack",
        "Looking at phone"
      ]
    }
  },
];

export const mockAlerts: Alert[] = [
  {
    id: 1,
    type: "detection",
    title: "Multiple Matches in Downtown Area",
    description: "Several individuals detected crossing at main intersection",
    time: "2 minutes ago",
    confidence: 0.89,
  },
  {
    id: 2,
    type: "area_update",
    title: "High Activity Zone Identified",
    description: "Increased foot traffic at downtown crosswalk",
    time: "5 minutes ago",
  },
  {
    id: 3,
    type: "match",
    title: "Potential Match Found",
    description: "Person with similar clothing pattern observed at crosswalk",
    time: "10 minutes ago",
    confidence: 0.75,
  },
];

export const mockVideoFrames = [
  // Real image URL for the first frame
  "https://media.gettyimages.com/id/1459839633/photo/people-walking-across-crosswalk-in-city-downtown-top-view.jpg?s=612x612&w=gi&k=20&c=U2wnD0_EEZDO2xT62DAR4HexIsjBThPwOpykkabEKOU=",
  // Generated frames for the rest
  ...Array.from({ length: 29 }, (_, i) => 
    `data:image/svg+xml,${encodeURIComponent(`
      <svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="black"/>
        <text x="50%" y="10%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
          Live Camera Feed - Frame ${i + 2}
        </text>
      </svg>
    `)}`
  )
];