import OpenAI from "openai";
import fetch from "node-fetch";
import sharp from "sharp";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to convert URL to base64
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const buffer = await response.buffer();
  return buffer.toString('base64');
}

// Helper function to crop an image based on bounding box
async function cropImageFromUrl(imageUrl: string, bbox: [number, number, number, number]): Promise<string> {
  try {
    // Download the image
    console.log('Downloading image for cropping:', imageUrl);
    const response = await fetch(imageUrl);
    const imageBuffer = await response.buffer();

    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Calculate crop dimensions
    const [x, y, w, h] = bbox;
    const cropX = Math.floor(x * width);
    const cropY = Math.floor(y * height);
    const cropWidth = Math.floor(w * width);
    const cropHeight = Math.floor(h * height);

    console.log('Cropping image with dimensions:', { cropX, cropY, cropWidth, cropHeight });

    // Crop the image
    const croppedBuffer = await sharp(imageBuffer)
      .extract({
        left: cropX,
        top: cropY,
        width: cropWidth,
        height: cropHeight
      })
      .jpeg()
      .toBuffer();

    // Convert to base64
    return `data:image/jpeg;base64,${croppedBuffer.toString('base64')}`;
  } catch (error) {
    console.error("Error cropping image:", error);
    return imageUrl;
  }
}

interface AnalysisResult {
  entities: string[];
  locations: string[];
  timestamps: string[];
  confidence: number;
}

interface MovementPrediction {
  radius: number;
  probableLocations: { lat: number; lng: number; probability: number }[];
  timeElapsed: number;
}

interface ImageAnalysisResult {
  detections: {
    bbox: [number, number, number, number];
    confidence: number;
    description: string;
    croppedImage: string;
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


// First stage: Detect people using Roboflow API
async function detectPeopleWithRoboflow(imageUrl: string): Promise<{
  bbox: [number, number, number, number];
  confidence: number;
}[]> {
  try {
    console.log('Starting Roboflow person detection for image:', imageUrl);

    const response = await fetch('https://detect.roboflow.com/infer/workflows/mizantech-bww5d/detect-count-and-visualize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: '3RyAsQaKrfI80jA1oi9Z',
        inputs: {
          "image": { "type": "url", "value": imageUrl }
        }
      })
    });

    const result = await response.json();
    console.log('Roboflow API response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      throw new Error(`Roboflow API error: ${JSON.stringify(result)}`);
    }

    // Extract and normalize person detections
    const detections = (result.predictions || [])
      .filter(pred => pred.class === "person")
      .map(pred => ({
        bbox: [
          pred.x / result.image.width,
          pred.y / result.image.height,
          pred.width / result.image.width,
          pred.height / result.image.height
        ] as [number, number, number, number],
        confidence: pred.confidence
      }));

    console.log(`Found ${detections.length} people in the image`);
    return detections;
  } catch (error) {
    console.error("Error detecting people with Roboflow:", error);
    return [];
  }
}

// Second stage: Analyze each detected person with GPT-4 Vision
async function analyzePersonWithGPT4(imageUrl: string, bbox: [number, number, number, number]): Promise<{
  description: string;
  croppedImage: string;
  details: {
    age: string;
    clothing: string;
    environment: string;
    movement: string;
    distinctive_features: string[];
  };
}> {
  try {
    console.log('Starting GPT-4 Vision analysis for detected person...');

    // First crop the image
    const croppedImage = await cropImageFromUrl(imageUrl, bbox);

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `Analyze this cropped image of a person and provide a detailed description in JSON format:
          {
            "description": "Brief one-line description",
            "details": {
              "age": "Estimated age range",
              "clothing": "Detailed clothing description",
              "environment": "Immediate surroundings and context",
              "movement": "Direction and type of movement",
              "distinctive_features": ["List of notable characteristics"]
            }
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    console.log('GPT-4 Vision analysis complete:', analysis);

    return {
      ...analysis,
      croppedImage
    };
  } catch (error) {
    console.error("Error analyzing person with GPT-4:", error);
    return {
      description: "Analysis failed",
      croppedImage: "",
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

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
  try {
    console.log('Starting image analysis pipeline...');
    // First detect all people using Roboflow API
    const detections = await detectPeopleWithRoboflow(imageUrl);
    console.log('Roboflow detections:', detections);

    // Then analyze each detected person with GPT-4 Vision
    const analysisPromises = detections.map(async (detection) => {
      const analysis = await analyzePersonWithGPT4(imageUrl, detection.bbox);
      return {
        ...detection,
        ...analysis
      };
    });

    const detailedDetections = await Promise.all(analysisPromises);
    console.log('GPT-4 analysis complete:', detailedDetections);

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

// Basic report analysis using GPT-4
export async function analyzeReport(text: string): Promise<AnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Analyze the given text and extract relevant information in this format:
          {
            "entities": ["list of people, clothing, physical descriptions"],
            "locations": ["mentioned locations, landmarks, areas"],
            "timestamps": ["dates and times mentioned"],
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

// Utility function for calculating cosine similarity
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const dotProduct = a.reduce((acc, val, i) => acc + val * b[i], 0);
  const aMagnitude = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
  const bMagnitude = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (aMagnitude * bMagnitude);
}

// Generate embeddings for text using GPT-4
export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float"
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error getting embeddings:", error);
    return Array(1536).fill(0);
  }
}

// Predict possible movement based on time elapsed
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

// Match search terms against detections
export async function matchSearchTerms(searchQuery: string, detections: ImageAnalysisResult[]): Promise<number[]> {
  try {
    // Get embeddings for the search query
    const queryEmbedding = await getEmbeddings(searchQuery);

    // Get embeddings for each detection's description
    const detectionPromises = detections.map(async (d) => {
      const descriptions = d.detections.map(det =>
        `${det.description} ${det.details.clothing} ${det.details.distinctive_features.join(" ")}`
      );
      return Promise.all(descriptions.map(desc => getEmbeddings(desc)));
    });

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