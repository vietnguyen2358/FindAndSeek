import OpenAI from "openai";
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

// Helper function to crop an image based on bounding box
function cropImageFromBase64(base64Image: string, bbox: [number, number, number, number]): string {
  // Convert base64 to Buffer
  const imageBuffer = Buffer.from(base64Image, 'base64');

  // In a real implementation, this would use sharp or canvas to crop the image
  // For now, we'll return the original image segment
  return base64Image;
}

// First stage: Detect people using Roboflow via Python script
async function detectPeopleWithRoboflow(base64Image: string): Promise<{
  bbox: [number, number, number, number];
  confidence: number;
}[]> {
  try {
    console.log('Starting Roboflow person detection...');

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        path.join(__dirname, 'roboflow_detector.py')
      ]);

      let output = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error('Python error:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python process exited with code', code);
          return reject(new Error('Roboflow detection failed'));
        }

        try {
          const result = JSON.parse(output);
          if (!result.success) {
            return reject(new Error(result.error));
          }
          resolve(result.detections);
        } catch (error) {
          reject(error);
        }
      });

      // Send base64 image to Python script
      pythonProcess.stdin.write(base64Image);
      pythonProcess.stdin.end();
    });
  } catch (error) {
    console.error("Error detecting people with Roboflow:", error);
    return [];
  }
}

// Second stage: Analyze each detected person with GPT-4 Vision
async function analyzePersonWithGPT4(base64Image: string, bbox: [number, number, number, number]): Promise<{
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

export async function analyzeImage(base64Image: string): Promise<ImageAnalysisResult> {
  try {
    console.log('Starting image analysis pipeline...');
    // First detect all people using Roboflow
    const detections = await detectPeopleWithRoboflow(base64Image);
    console.log('Roboflow detections:', detections);

    // Then analyze each detected person with GPT-4 Vision
    const analysisPromises = detections.map(async (detection) => {
      const analysis = await analyzePersonWithGPT4(base64Image, detection.bbox);
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