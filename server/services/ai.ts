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
    details: {
      age: string;
      clothing: string;
      environment: string;
      movement: string;
      distinctive_features: string[];
    };
  }[];
  summary: string;
}

interface MovementPrediction {
  radius: number;
  probableLocations: { lat: number; lng: number; probability: number }[];
  timeElapsed: number;
}

// Get embeddings for a text using Groq
async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await groq.embeddings.create({
      model: "grok-2-1212",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error getting embeddings:", error);
    return [];
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((acc, val, i) => acc + val * b[i], 0);
  const aMagnitude = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
  const bMagnitude = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (aMagnitude * bMagnitude);
}

export async function analyzeImage(base64Image: string): Promise<ImageAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are an advanced person detection system specializing in missing persons cases.
          For each person detected in the image, provide detailed analysis in the following format:
          {
            "detections": [
              {
                "confidence": <0.0-1.0>,
                "bbox": [x, y, width, height],
                "description": "Brief overview",
                "details": {
                  "age": "Estimated age range",
                  "clothing": "Detailed clothing description",
                  "environment": "Immediate surroundings and context",
                  "movement": "Direction and type of movement",
                  "distinctive_features": ["List", "of", "notable", "characteristics"]
                }
              }
            ],
            "summary": "Overall scene description"
          }
          Be precise and thorough in your analysis.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image for detailed person detection." },
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
    return {
      detections: result.detections?.map((d: any) => ({
        confidence: d.confidence || 0.8,
        bbox: d.bbox || [0, 0, 1, 1],
        description: d.description || "Person detected",
        details: d.details || {
          age: "Unknown",
          clothing: "Not visible",
          environment: "Not specified",
          movement: "Stationary",
          distinctive_features: []
        }
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

export async function matchSearchTerms(searchQuery: string, detections: ImageAnalysisResult[]): Promise<number[]> {
  try {
    // Get embeddings for the search query
    const queryEmbedding = await getEmbeddings(searchQuery);

    // Get embeddings for each detection description
    const detectionPromises = detections.map(d =>
      Promise.all(d.detections.map(det => getEmbeddings(det.description)))
    );
    const detectionEmbeddings = await Promise.all(detectionPromises);

    // Find matches using cosine similarity
    const matches: number[] = [];
    detectionEmbeddings.forEach((detection, index) => {
      const similarities = detection.map(emb => cosineSimilarity(queryEmbedding, emb));
      const maxSimilarity = Math.max(...similarities);
      if (maxSimilarity > 0.7) { // Threshold for considering it a match
        matches.push(index);
      }
    });

    return matches;
  } catch (error) {
    console.error("Error matching search terms:", error);
    return [];
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