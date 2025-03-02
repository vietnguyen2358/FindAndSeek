export interface MapPin {
  id: number;
  lat: number;
  lng: number;
  type: "camera" | "lastSeen";
  timestamp?: string;
  location: string;
  detectionCount?: number;
}

export interface DetectedPersonDetails {
  age: string;
  clothing: string;
  environment: string;
  movement: string;
  distinctive_features: string[];
}

export interface DetectedPerson {
  id: number;
  cameraId: number;
  time: string;
  description: string;
  confidence: number;
  thumbnail: string;
  bbox: [number, number, number, number];
  details: DetectedPersonDetails;
  matchScore?: number;
}

export interface Alert {
  id: number;
  type: "detection" | "match" | "area_update";
  title: string;
  description: string;
  time: string;
  confidence?: number;
}

export interface SearchFilter {
  category: 'clothing' | 'physical' | 'location' | 'time' | 'age' | 'action';
  value: string;
}

export interface AIAnalysisResult {
  entities: string[];
  locations: string[];
  timestamps: string[];
  confidence: number;
  detections?: {
    bbox: [number, number, number, number];
    confidence: number;
    description: string;
    details: DetectedPersonDetails;
  }[];
}