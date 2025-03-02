import { personDetections, cameras, type PersonDetection, type InsertPersonDetection, type Camera, type InsertCamera } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import type { SearchCriteria, SearchResult } from "@shared/types";

export interface IStorage {
  createDetection(detection: InsertPersonDetection): Promise<PersonDetection>;
  getDetection(id: number): Promise<PersonDetection | undefined>;
  getAllDetections(): Promise<PersonDetection[]>;
  updateDetectionMatchScore(id: number, matchScore: number): Promise<PersonDetection>;
  createCamera(camera: InsertCamera): Promise<Camera>;
  getCamera(id: number): Promise<Camera | undefined>;
  getAllCameras(): Promise<Camera[]>;
  searchDetections(queryEmbedding: number[], criteria: SearchCriteria): Promise<SearchResult[]>;
  createCase(caseData: InsertCase): Promise<Case>;
  getCase(id: number): Promise<Case | undefined>;
  getAllCases(): Promise<Case[]>;
  updateCase(id: number, caseData: Partial<Case>): Promise<Case>;
  addCameraFootage(footage: InsertCameraFootage): Promise<CameraFootage>;
  getCaseFootage(caseId: number): Promise<CameraFootage[]>;
  updateCaseAIAnalysis(id: number, analysis: AIAnalysis): Promise<Case>;
  updateCaseSearchRadius(id: number, searchRadius: SearchRadius): Promise<Case>;
  updateFootageAnalysis(id: number, analysis: CameraAIAnalysis): Promise<CameraFootage>;
  addTimelineEvent(caseId: number, event: { time: string; event: string; details?: Record<string, any> }): Promise<Case>;
}

export class DatabaseStorage implements IStorage {
  async createDetection(detection: InsertPersonDetection): Promise<PersonDetection> {
    const [newDetection] = await db
      .insert(personDetections)
      .values(detection)
      .returning();
    return newDetection;
  }

  async getDetection(id: number): Promise<PersonDetection | undefined> {
    const [detection] = await db
      .select()
      .from(personDetections)
      .where(eq(personDetections.id, id));
    return detection;
  }

  async getAllDetections(): Promise<PersonDetection[]> {
    return db
      .select()
      .from(personDetections)
      .orderBy(desc(personDetections.timestamp));
  }

  async updateDetectionMatchScore(id: number, matchScore: number): Promise<PersonDetection> {
    const [detection] = await db
      .update(personDetections)
      .set({ matchScore })
      .where(eq(personDetections.id, id))
      .returning();
    return detection;
  }

  async createCamera(camera: InsertCamera): Promise<Camera> {
    const [newCamera] = await db
      .insert(cameras)
      .values(camera)
      .returning();
    return newCamera;
  }

  async getCamera(id: number): Promise<Camera | undefined> {
    const [camera] = await db
      .select()
      .from(cameras)
      .where(eq(cameras.id, id));
    return camera;
  }

  async getAllCameras(): Promise<Camera[]> {
    return db
      .select()
      .from(cameras)
      .orderBy(desc(cameras.lastActive));
  }

  async searchDetections(queryEmbedding: number[], criteria: SearchCriteria): Promise<SearchResult[]> {
    // Use vector similarity search with additional filters
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
  async createCase(caseData: InsertCase): Promise<Case> {
    throw new Error("Method not implemented.");
  }
  async getCase(id: number): Promise<Case | undefined> {
    throw new Error("Method not implemented.");
  }
  async getAllCases(): Promise<Case[]> {
    throw new Error("Method not implemented.");
  }
  async updateCase(id: number, caseData: Partial<Case>): Promise<Case> {
    throw new Error("Method not implemented.");
  }
  async addCameraFootage(footage: InsertCameraFootage): Promise<CameraFootage> {
    throw new Error("Method not implemented.");
  }
  async getCaseFootage(caseId: number): Promise<CameraFootage[]> {
    throw new Error("Method not implemented.");
  }
  async updateCaseAIAnalysis(id: number, analysis: AIAnalysis): Promise<Case> {
    throw new Error("Method not implemented.");
  }
  async updateCaseSearchRadius(id: number, searchRadius: SearchRadius): Promise<Case> {
    throw new Error("Method not implemented.");
  }
  async updateFootageAnalysis(id: number, analysis: CameraAIAnalysis): Promise<CameraFootage> {
    throw new Error("Method not implemented.");
  }
  async addTimelineEvent(caseId: number, event: { time: string; event: string; details?: Record<string, any> }): Promise<Case> {
    throw new Error("Method not implemented.");
  }
}

export const storage = new DatabaseStorage();

import { cases, cameraFootage, type Case, type InsertCase, type CameraFootage, type AIAnalysis, type CameraAIAnalysis, type SearchRadius } from "@shared/schema";