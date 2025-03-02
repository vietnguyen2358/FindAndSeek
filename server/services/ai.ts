import OpenAI from "openai";
import fetch from "node-fetch";
import { storage } from "../storage";
import type { SearchCriteria, SearchResult } from "@shared/types";
import sharp from "sharp";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ImageAnalysisResult {
  detections: {
    description: string;
    confidence: number;
    details: {
      age: string;
      clothing: string;
      environment: string;
      movement: string;
      distinctive_features: string[];
    };
    embedding: number[]; // Added embedding field
  }[];
  summary: string;
}

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
  try {
    console.log('Starting GPT-4 Vision analysis for image:', imageUrl);

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `Analyze this image and identify people in the scene. Focus especially on clothing and distinctive features. For each person, provide detailed information in the following JSON format:
          {
            "detections": [
              {
                "description": "Brief one-line description",
                "confidence": 0.95,
                "details": {
                  "age": "Estimated age range",
                  "clothing": "Detailed clothing description including colors, styles, and brands if visible",
                  "environment": "Immediate surroundings and context",
                  "movement": "Direction and type of movement",
                  "distinctive_features": ["List of notable characteristics"]
                }
              }
            ],
            "summary": "Brief summary of all people detected in the scene"
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe all the people in this image in detail, focusing especially on their clothing."
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    console.log('GPT-4 Vision analysis complete:', analysis);

    // Generate embeddings for each detection
    for (const detection of analysis.detections) {
      const embedding = await generateEmbedding(
        `${detection.description} ${detection.details.clothing} ${detection.details.distinctive_features.join(" ")}`
      );
      detection.embedding = embedding;
    }

    return analysis;
  } catch (error) {
    console.error("Error analyzing image with GPT-4 Vision:", error);
    return {
      detections: [],
      summary: "Analysis failed"
    };
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

export async function findSimilarDetections(criteria: SearchCriteria): Promise<SearchResult[]> {
  try {
    // Get embedding for the search query
    const queryEmbedding = await generateEmbedding(criteria.description);

    // Search the database using vector similarity
    const detections = await storage.searchDetections(queryEmbedding, criteria);

    // Return the results sorted by similarity
    return detections;
  } catch (error) {
    console.error("Error finding similar detections:", error);
    throw error;
  }
}

export async function analyzeClothingDescription(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "Extract and normalize clothing descriptions from the text. Focus on colors, types of clothing, and distinctive features. Format the output as a concise, standardized description."
      },
      {
        role: "user",
        content: text
      }
    ]
  });

  return response.choices[0].message.content || "";
}

// Helper function to convert URL to base64 
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const buffer = await response.buffer();
  return buffer.toString('base64');
}

// Helper function to crop an image based on bounding box
async function cropImageFromUrl(imageUrl: string, bbox: [number, number, number, number]): Promise<string> {
  try {
    console.log('Downloading image for cropping:', imageUrl);
    const response = await fetch(imageUrl);
    const imageBuffer = await response.buffer();

    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    const [x, y, w, h] = bbox;
    const cropX = Math.floor(x * width);
    const cropY = Math.floor(y * height);
    const cropWidth = Math.floor(w * width);
    const cropHeight = Math.floor(h * height);

    console.log('Cropping image with dimensions:', { cropX, cropY, cropWidth, cropHeight });

    const croppedBuffer = await sharp(imageBuffer)
      .extract({
        left: cropX,
        top: cropY,
        width: cropWidth,
        height: cropHeight
      })
      .jpeg()
      .toBuffer();

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

interface MovementPrediction {
  radius: number;
  probableLocations: { lat: number; lng: number; probability: number }[];
  timeElapsed: number;
}

// Predict possible movement based on time elapsed
export async function predictMovement(
  lastLocation: { lat: number; lng: number },
  timeElapsed: number,
  transportMode: "walking" | "vehicle" = "walking"
): Promise<MovementPrediction> {
  const averageSpeed = transportMode === "walking" ? 5 : 30; // km/h
  const radius = (timeElapsed / 3600) * averageSpeed; // Convert time to hours and multiply by speed

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
    const queryEmbedding = await getEmbeddings(searchQuery);

    const detectionEmbeddings = detections.map(d => d.detections.map(det => det.embedding).flat());


    const matches: number[] = [];
    detectionEmbeddings.forEach((detection, index) => {
      const similarities = detection.map(emb => cosineSimilarity(queryEmbedding, emb));
      const maxSimilarity = Math.max(...similarities);
      if (maxSimilarity > 0.7) { 
        matches.push(index);
      }
    });

    return matches;
  } catch (error) {
    console.error("Error matching search terms:", error);
    return [];
  }
}