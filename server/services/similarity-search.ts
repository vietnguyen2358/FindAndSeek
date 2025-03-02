import OpenAI from "openai";
import { db } from "../db";
import { personDetections, cameras } from "@shared/schema";
import type { SearchCriteria, SearchResult, EmbeddingVector } from "@shared/types";
import { desc, sql } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateEmbedding(text: string): Promise<EmbeddingVector> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536
  });
  
  return response.data[0].embedding;
}

export async function findSimilarDetections(criteria: SearchCriteria): Promise<SearchResult[]> {
  // Generate embedding for the search query
  const queryEmbedding = await generateEmbedding(criteria.description);

  // Perform similarity search using cosine similarity
  const results = await db.execute(sql`
    WITH similarity_scores AS (
      SELECT 
        pd.*,
        1 - (pd.embedding <=> ${queryEmbedding}::vector) as similarity
      FROM ${personDetections} pd
      WHERE 
        ${criteria.timeRange ? sql`
          pd.timestamp BETWEEN ${criteria.timeRange.start} AND ${criteria.timeRange.end}
        ` : sql`TRUE`}
        AND
        ${criteria.location ? sql`
          pd.detection_location ILIKE ${`%${criteria.location}%`}
        ` : sql`TRUE`}
    )
    SELECT ss.*, c.*
    FROM similarity_scores ss
    LEFT JOIN ${cameras} c ON ss.camera_id = c.id
    WHERE similarity > 0.7
    ORDER BY similarity DESC
    LIMIT 5
  `);

  // Process results
  return results.map(row => ({
    detection: {
      id: row.id,
      description: row.description,
      confidence: row.confidence,
      timestamp: row.timestamp,
      thumbnail: row.thumbnail,
      bbox: row.bbox,
      details: row.details,
      cameraId: row.camera_id,
      matchScore: row.similarity,
      embedding: row.embedding,
      clothingDescription: row.clothing_description,
      detectionLocation: row.detection_location
    },
    similarity: row.similarity,
    camera: {
      id: row.id,
      location: row.location,
      lastActive: row.last_active,
      type: row.type,
      status: row.status
    }
  }));
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
