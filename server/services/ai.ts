import OpenAI from "openai";
import vision from '@google-cloud/vision';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Google Vision client
const googleVisionClient = new vision.ImageAnnotatorClient({
  apiKey: process.env.GOOGLE_VISION_API_KEY
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

// First stage: Detect people using Google Vision API
async function detectPeopleWithGoogleVision(base64Image: string): Promise<{
  bbox: [number, number, number, number];
  confidence: number;
}[]> {
  try {
    console.log('Starting Google Vision person detection...');
    const request = {
      image: {
        content: base64Image
      }
    };

    const [result] = await googleVisionClient.objectLocalization(request);
    const objects = result.localizedObjectAnnotations || [];
    console.log(`Google Vision detected ${objects.length} objects`);

    // Filter for person detections and normalize coordinates
    const detections = objects
      .filter(obj => obj.name === 'Person')
      .map(obj => {
        const vertices = obj.boundingPoly?.normalizedVertices || [];
        if (vertices.length === 4) {
          // Convert to [x, y, width, height] format
          const x = vertices[0].x || 0;
          const y = vertices[0].y || 0;
          const width = (vertices[1].x || 0) - x;
          const height = (vertices[2].y || 0) - y;

          return {
            bbox: [x, y, width, height] as [number, number, number, number],
            confidence: obj.score || 0
          };
        }
        return null;
      })
      .filter((detection): detection is NonNullable<typeof detection> => detection !== null);

    console.log(`Found ${detections.length} people in the image`);
    return detections;
  } catch (error) {
    console.error("Error detecting people with Google Vision:", error);
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
    // First detect all people using Google Vision API
    const detections = await detectPeopleWithGoogleVision(base64Image);
    console.log('Google Vision detections:', detections);

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

// Mock implementation for missing functions
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