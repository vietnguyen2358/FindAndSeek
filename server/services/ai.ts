import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  try {
    const response = await groq.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping with missing persons cases. Analyze the given text and extract relevant information in the following format:
          {
            "entities": ["list all mentioned people, clothing, physical descriptions"],
            "locations": ["all mentioned locations, landmarks, areas"],
            "timestamps": ["all mentioned dates and times"],
            "confidence": 0.95
          }`
        },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error analyzing report:", error);
    return {
      entities: [],
      locations: [],
      timestamps: [],
      confidence: 0
    };
  }
}

export async function analyzeImage(base64Image: string): Promise<ImageAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant analyzing surveillance footage for missing persons cases. 
          For each person detected, provide:
          - Detailed physical description
          - Clothing description
          - Direction of movement
          - Any distinctive features
          Return the analysis in JSON format with bounding boxes and confidence scores.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image for person detection. Identify and describe each person detected." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Process and normalize the response
    return {
      detections: result.detections?.map((d: any) => ({
        confidence: d.confidence || 0.8,
        bbox: d.bbox || [0, 0, 1, 1],
        description: d.description || "Person detected"
      })) || [],
      summary: result.summary || ""
    };
  } catch (error) {
    console.error("Error analyzing image:", error);
    return {
      detections: [],
      summary: "Failed to analyze image"
    };
  }
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

// Helper function to match search terms with detections
export async function matchSearchTerms(searchQuery: string, detections: ImageAnalysisResult[]): Promise<number[]> {
  try {
    const response = await groq.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are analyzing search queries for missing persons cases. 
          Compare the search terms with the provided detections and return an array of indices 
          for detections that match the search criteria. Consider:
          - Physical descriptions
          - Clothing
          - Location
          - Time frame
          Return your response as a JSON array of indices.`
        },
        {
          role: "user",
          content: JSON.stringify({
            query: searchQuery,
            detections: detections.map(d => d.detections.map(det => det.description))
          })
        }
      ],
      response_format: { type: "json_object" }
    });

    const matches = JSON.parse(response.choices[0].message.content || "[]");
    return matches.indices || [];
  } catch (error) {
    console.error("Error matching search terms:", error);
    return [];
  }
}