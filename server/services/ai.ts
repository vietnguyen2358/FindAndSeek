import OpenAI from "openai";
import fetch from "node-fetch";
import { spawn } from 'child_process';
import path from 'path';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

// First stage: Detect people using Roboflow API
async function detectPeopleWithRoboflow(imageUrl: string): Promise<{
  bbox: [number, number, number, number];
  confidence: number;
}[]> {
  try {
    console.log('Starting Roboflow person detection...');

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
    console.log('Roboflow API response:', result);

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

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `Analyze this detected person and provide a detailed description in JSON format:
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
    console.log('GPT-4 Vision analysis complete');
    return analysis;
  } catch (error) {
    console.error("Error analyzing person with GPT-4:", error);
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

// Mock implementations for other functions
export async function analyzeReport(text: string): Promise<AnalysisResult> {
  return {
    entities: ['Example entity'],
    locations: ['Example location'],
    timestamps: [new Date().toISOString()],
    confidence: 0.95
  };
}

export async function matchSearchTerms(searchQuery: string, _detections: any[]): Promise<number[]> {
  console.log('Mock matchSearchTerms called with query:', searchQuery);
  return [0, 1]; // Mock matching indices
}

export async function predictMovement(
  lastLocation: { lat: number; lng: number },
  timeElapsed: number,
  transportMode: string = "walking"
): Promise<any> {
  return {
    radius: timeElapsed * (transportMode === "walking" ? 5 : 30) / 3600,
    probableLocations: [lastLocation],
    timeElapsed
  };
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((acc, val, i) => acc + val * b[i], 0);
  const aMagnitude = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
  const bMagnitude = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (aMagnitude * bMagnitude);
}

export async function getEmbeddings(text: string): Promise<number[]> {
  // Mock implementation returning a simple vector
  return Array(128).fill(0).map(() => Math.random());
}