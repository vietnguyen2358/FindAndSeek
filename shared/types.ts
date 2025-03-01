export interface MapPin {
  id: number;
  lat: number;
  lng: number;
  type: "camera" | "lastSeen";
  timestamp?: string;
  location: string;
}

export interface DetectedPerson {
  id: number;
  time: string;
  description: string;
  confidence: number;
  thumbnail: string;
  bbox: [number, number, number, number];
}

export interface Alert {
  id: number;
  type: "detection" | "match" | "area_update";
  title: string;
  description: string;
  time: string;
  confidence?: number;
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
  }[];
}
