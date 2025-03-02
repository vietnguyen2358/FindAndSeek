import OpenAI from "openai";

// Initialize OpenAI client with fallback for development
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-development",
});

// Initialize the Groq client with API key and fallback for development
const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || "dummy-key-for-development",
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

// Get embeddings for a text using Groq
async function getEmbeddings(text: string): Promise<number[]> {
  // Check if we're using the dummy key for development
  if (process.env.GROQ_API_KEY === undefined || process.env.GROQ_API_KEY === "dummy-key-for-development") {
    console.log("Using mock embeddings for development");
    // Return a mock embedding (128-dimensional vector with random values)
    return Array(128).fill(0).map(() => Math.random());
  }

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

// Helper function to crop an image based on bounding box
function cropImageFromBase64(base64Image: string, bbox: [number, number, number, number]): string {
  // In a real implementation, this would use canvas or sharp to crop the image
  // For now, we'll simulate cropping by passing the original image and bbox info
  return base64Image;
}

// First stage: Detect people in the image using GPT-4V
async function detectPeople(base64Image: string): Promise<{
  bbox: [number, number, number, number];
  confidence: number;
}[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are a computer vision system specialized in detecting people in surveillance footage.
          For each person detected, provide:
          1. Precise bounding box coordinates [x, y, width, height] as normalized values between 0-1
          2. Detection confidence score between 0-1
          Return ONLY a JSON array of detections with no additional text.`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}` }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.detections || [];
  } catch (error) {
    console.error("Error detecting people:", error);
    return [];
  }
}

// Second stage: Analyze each detected person in detail
async function analyzePerson(base64Image: string, bbox: [number, number, number, number]): Promise<{
  description: string;
  details: {
    age: string;
    clothing: string;
    environment: string;
    movement: string;
    distinctive_features: string[];
  };
}> {
  try {
    const croppedImage = cropImageFromBase64(base64Image, bbox);
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `Analyze this cropped image of a person and provide detailed information in the following JSON format:
          {
            "description": "Brief one-line description",
            "details": {
              "age": "Estimated age range",
              "clothing": "Detailed clothing description",
              "environment": "Immediate surroundings and context",
              "movement": "Direction and type of movement",
              "distinctive_features": ["List", "of", "notable", "characteristics"]
            }
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${croppedImage}` }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error analyzing person:", error);
    return {
      description: "Analysis failed",
      details: {
        age: "Unknown",
        clothing: "Not visible",
        environment: "Not specified",
        movement: "Unknown",
        distinctive_features: []
      }
    };
  }
}

export async function analyzeImage(base64Image: string): Promise<ImageAnalysisResult> {
  // Check if we're using the dummy key for development
  if (process.env.OPENAI_API_KEY === undefined || process.env.OPENAI_API_KEY === "dummy-key-for-development") {
    console.log("Using mock image analysis for development");
    return {
      detections: [
        {
          confidence: 0.95,
          bbox: [50, 50, 200, 400],
          description: "Adult male with blue shirt walking towards the east side of the frame",
          details: {
            age: "30-40",
            clothing: "Blue shirt, black pants",
            environment: "Urban street setting",
            movement: "Walking east",
            distinctive_features: ["tall build", "baseball cap", "messenger bag"]
          }
        }
      ],
      summary: "Detected 1 person in the scene"
    };
  }

  try {
    // First detect all people in the image
    const detections = await detectPeople(base64Image);

    // Then analyze each detected person in detail
    const analysisPromises = detections.map(async (detection) => {
      const analysis = await analyzePerson(base64Image, detection.bbox);
      return {
        ...detection,
        ...analysis
      };
    });

    const detailedDetections = await Promise.all(analysisPromises);

    return {
      detections: detailedDetections,
      summary: `Detected ${detections.length} people in the scene`
    };
  } catch (error) {
    console.error("Error in image analysis pipeline:", error);
    return {
      detections: [],
      summary: "Analysis failed"
    };
  }
}

export async function analyzeReport(text: string): Promise<AnalysisResult> {
  // Check if we're using the dummy key for development
  if (process.env.GROQ_API_KEY === undefined || process.env.GROQ_API_KEY === "dummy-key-for-development") {
    console.log("Using mock report analysis for development");
    
    // Create some reasonable mock data based on common patterns in reports
    const mockEntities = ["John Doe", "blue jacket", "black jeans", "brown hair", "glasses"];
    const mockLocations = ["Central Park", "5th Avenue", "Downtown area", "Coffee shop"];
    const mockTimestamps = ["Yesterday at 3pm", "April 15th", "Last seen around noon"];
    
    return {
      entities: mockEntities,
      locations: mockLocations,
      timestamps: mockTimestamps,
      confidence: 0.85
    };
  }

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

    // Get embeddings for each detection's full description including details
    const detectionPromises = detections.map(d =>
      Promise.all(d.detections.map(det => {
        const fullDescription = `${det.description} ${det.details.clothing} ${det.details.distinctive_features.join(" ")}`;
        return getEmbeddings(fullDescription);
      }))
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

interface MovementPrediction {
  radius: number;
  probableLocations: { lat: number; lng: number; probability: number }[];
  timeElapsed: number;
}