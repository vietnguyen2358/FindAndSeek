import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCaseSchema, insertCameraFootageSchema } from "@shared/schema";
import { z } from "zod";
import type { SearchFilter, DetectedPerson } from "@shared/types";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to get similarity score between search criteria and a detection
async function getSimilarityScore(query: string, detection: DetectedPerson): Promise<number> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a matcher for finding missing persons. Compare the search query with the detection and return a similarity score between 0 and 1 as a JSON number. Focus mainly on clothing and physical description matches.`
        },
        {
          role: "user",
          content: `Search: "${query}"
Detection: ${detection.description}
Clothing: ${detection.details.clothing}
Features: ${detection.details.distinctive_features.join(", ")}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.score || 0;
  } catch (error) {
    console.error("Error getting similarity score:", error);
    return 0;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/cases", async (req, res) => {
    try {
      const caseData = insertCaseSchema.parse(req.body);
      let newCase = await storage.createCase(caseData);

      // Perform AI analysis on the case description
      const analysis = await analyzeReport(caseData.description);
      newCase = await storage.updateCaseAIAnalysis(newCase.id, analysis);

      // If we have a last known location, calculate initial search radius
      if (caseData.lastLocation) {
        const prediction = await predictMovement(
          { lat: 0, lng: 0 }, // TODO: Geocode the lastLocation string to coordinates
          0, // Initial time elapsed
          "walking"
        );
        newCase = await storage.updateCaseSearchRadius(newCase.id, prediction);
      }

      res.json(newCase);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/cases", async (_req, res) => {
    const cases = await storage.getAllCases();
    res.json(cases);
  });

  app.get("/api/cases/:id", async (req, res) => {
    const caseId = parseInt(req.params.id);
    const caseData = await storage.getCase(caseId);
    if (!caseData) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    res.json(caseData);
  });

  app.patch("/api/cases/:id", async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const updatedCase = await storage.updateCase(caseId, req.body);
      res.json(updatedCase);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/cases/:id/analyze-image", async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const schema = z.object({ image: z.string() });
      const { image } = schema.parse(req.body);

      const analysis = await analyzeImage(image);
      const case_ = await storage.getCase(caseId);

      if (!case_) {
        throw new Error("Case not found");
      }

      // Add the image to the case
      const updatedCase = await storage.updateCase(caseId, {
        images: [...case_.images, image]
      });

      // Add a timeline event for the image analysis
      await storage.addTimelineEvent(caseId, {
        time: new Date().toISOString(),
        event: "Image analyzed",
        details: analysis
      });

      res.json({ analysis, case: updatedCase });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/footage", async (req, res) => {
    try {
      const footageData = insertCameraFootageSchema.parse(req.body);
      const newFootage = await storage.addCameraFootage(footageData);

      // Process the footage with AI
      const analysis = await analyzeImage(footageData.footage);
      const processedFootage = await storage.updateFootageAnalysis(newFootage.id, {
        ...analysis,
        processedAt: new Date().toISOString()
      });

      // Add a timeline event for the new footage
      await storage.addTimelineEvent(footageData.caseId, {
        time: new Date().toISOString(),
        event: "New camera footage processed",
        details: {
          footageId: newFootage.id,
          location: footageData.location,
          detections: analysis.detections.length
        }
      });

      res.json(processedFootage);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/cases/:id/footage", async (req, res) => {
    const caseId = parseInt(req.params.id);
    const footage = await storage.getCaseFootage(caseId);
    res.json(footage);
  });

  app.post("/api/cases/:id/predict-movement", async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const schema = z.object({
        lat: z.number(),
        lng: z.number(),
        timeElapsed: z.number(),
        transportMode: z.enum(["walking", "vehicle"])
      });

      const data = schema.parse(req.body);
      const prediction = await predictMovement(
        { lat: data.lat, lng: data.lng },
        data.timeElapsed,
        data.transportMode
      );

      const updatedCase = await storage.updateCaseSearchRadius(caseId, prediction);

      // Add a timeline event for the prediction update
      await storage.addTimelineEvent(caseId, {
        time: new Date().toISOString(),
        event: "Search radius updated",
        details: {
          radius: prediction.radius,
          transportMode: data.transportMode
        }
      });

      res.json({ prediction, case: updatedCase });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/analyze-frame", async (req, res) => {
    try {
      console.log('Received analyze-frame request:', req.body);

      const schema = z.object({
        imageUrl: z.string(),
        timestamp: z.string()
      });

      const { imageUrl, timestamp } = schema.parse(req.body);
      console.log('Parsed request data:', { imageUrl, timestamp });

      // Use our AI service to analyze the frame
      const analysis = await analyzeImage(imageUrl);
      console.log('Analysis completed:', {
        detectionCount: analysis.detections.length,
        summary: analysis.summary
      });

      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing frame:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/parse-search", async (req, res) => {
    try {
      console.log('Received search parsing request:', req.body);

      const schema = z.object({
        query: z.string(),
        detections: z.array(z.any()).optional()
      });

      const { query, detections = [] } = schema.parse(req.body);

      // First, get search analysis from ChatGPT
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `Extract key clothing and physical features from the search query. Return a JSON object:
{
  "filters": [
    {"category": "clothing", "value": "specific clothing item"},
    {"category": "physical", "value": "physical description"}
  ],
  "response": "Brief summary of what to look for - focus on clothing"
}`
          },
          {
            role: "user",
            content: `Extract search information from: ${query}`
          }
        ],
        response_format: { type: "json_object" }
      });

      if (!response.choices[0].message.content) {
        throw new Error('No response content received from ChatGPT');
      }

      const searchAnalysis = JSON.parse(response.choices[0].message.content);

      // If detections were provided, analyze them for matches
      if (detections.length > 0) {
        // Get similarity scores for each detection
        const scoredDetections = await Promise.all(
          detections.map(async (detection) => ({
            detection,
            score: await getSimilarityScore(query, detection)
          }))
        );

        // Sort by score and get top 3
        const topMatches = scoredDetections
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(({ detection, score }) => ({
            ...detection,
            matchScore: score
          }));

        // Get brief analysis of matches
        const matchAnalysis = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "Provide a very brief explanation of the clothing matches. One short sentence per match."
            },
            {
              role: "user",
              content: `Search: "${query}"
Matches: ${topMatches.map((match, i) => 
  `Match ${i + 1}: ${match.description}, wearing ${match.details.clothing}`
).join('\n')}`
            }
          ]
        });

        // Return combined results in a single response
        res.json({
          ...searchAnalysis,
          topMatches,
          matchAnalysis: matchAnalysis.choices[0].message.content?.split('\n')
        });
      } else {
        res.json(searchAnalysis);
      }

    } catch (error: any) {
      console.error("Error parsing search query:", error);
      res.status(400).json({
        error: error.message,
        filters: [],
        response: "Sorry, I couldn't process that search. Please try again.",
        matchAnalysis: []
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { Router } from "express";
import { z } from "zod";
import { findSimilarDetections, analyzeClothingDescription } from "./services/similarity-search";
import type { SearchCriteria } from "@shared/types";
import OpenAI from "openai";

const openai2 = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = Router();

router.post("/api/search", async (req, res) => {
  try {
    const schema = z.object({
      description: z.string(),
      timeRange: z.object({
        start: z.string(),
        end: z.string()
      }).optional(),
      location: z.string().optional()
    });

    const criteria: SearchCriteria = schema.parse(req.body);

    // First, analyze the clothing description
    const enhancedDescription = await analyzeClothingDescription(criteria.description);
    criteria.description = enhancedDescription;

    // Perform similarity search
    const matches = await findSimilarDetections(criteria);

    // Get ChatGPT to explain the matches
    const analysis = await openai2.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "Analyze why these detections match the search criteria. Focus on clothing matches and any distinctive features."
        },
        {
          role: "user",
          content: `Search criteria: "${criteria.description}"
Matches found:
${matches.map((match, i) => `
Match ${i + 1} (${Math.round(match.similarity * 100)}% similar):
- Location: ${match.detection.detectionLocation}
- Description: ${match.detection.description}
- Clothing: ${match.detection.clothingDescription}
`).join('\n')}`
        }
      ]
    });

    res.json({
      matches,
      analysis: analysis.choices[0].message.content,
      enhancedDescription
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to process search request" });
  }
});

export default router;