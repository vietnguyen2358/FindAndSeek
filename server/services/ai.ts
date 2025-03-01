import OpenAI from "openai";

// Initialize the Groq client with API key
const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

interface AnalysisResult {
  entities: string[];
  locations: string[];
  timestamps: string[];
  confidence: number;
}

interface ImageAnalysisResult {
  detections: {
    confidence: number;
    bbox: [number, number, number, number];
    description: string;
  }[];
  summary: string;
}

interface MovementPrediction {
  radius: number;
  probableLocations: { lat: number; lng: number; probability: number }[];
  timeElapsed: number;
}

export async function analyzeReport(text: string): Promise<AnalysisResult> {
  const response = await groq.chat.completions.create({
    model: "grok-2-1212",
    messages: [
      {
        role: "system",
        content: `Analyze the given text and extract key information in JSON format with the following structure:
        {
          "entities": ["list of people, objects, vehicles mentioned"],
          "locations": ["list of locations mentioned"],
          "timestamps": ["list of times/dates mentioned"],
          "confidence": 0.95
        }`
      },
      { role: "user", content: text }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function analyzeImage(base64Image: string): Promise<ImageAnalysisResult> {
  const response = await groq.chat.completions.create({
    model: "grok-2-vision-1212",
    messages: [
      {
        role: "system",
        content: "Analyze this image for person detection. Return detected persons, their descriptions, and bounding boxes in JSON format."
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this image for person detection and describe the scene" },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function predictMovement(
  lastLocation: { lat: number; lng: number },
  timeElapsed: number,
  transportMode: "walking" | "vehicle" = "walking"
): Promise<MovementPrediction> {
  const averageSpeed = transportMode === "walking" ? 5 : 30; // km/h
  const radius = (timeElapsed / 3600) * averageSpeed; // Convert time to hours and multiply by speed

  // Generate probable locations in a circle around the last known location
  const numPoints = 8;
  const probableLocations = Array.from({ length: numPoints }).map((_, i) => {
    const angle = (2 * Math.PI * i) / numPoints;
    const distance = radius * (0.7 + 0.3 * Math.random()); // Vary the distance a bit
    const lat = lastLocation.lat + (distance / 111.32) * Math.cos(angle);
    const lng = lastLocation.lng + (distance / (111.32 * Math.cos(lastLocation.lat * Math.PI / 180))) * Math.sin(angle);
    return {
      lat,
      lng,
      probability: 0.5 + 0.5 * Math.random() // Random probability between 0.5 and 1
    };
  });

  return {
    radius,
    probableLocations,
    timeElapsed
  };
}
