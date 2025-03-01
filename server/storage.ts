import { cases, cameraFootage, type Case, type InsertCase, type CameraFootage, type InsertCameraFootage, type AIAnalysis, type CameraAIAnalysis, type SearchRadius } from "@shared/schema";

export interface IStorage {
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

export class MemStorage implements IStorage {
  private cases: Map<number, Case>;
  private cameraFootage: Map<number, CameraFootage>;
  private currentCaseId: number;
  private currentFootageId: number;

  constructor() {
    this.cases = new Map();
    this.cameraFootage = new Map();
    this.currentCaseId = 1;
    this.currentFootageId = 1;
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    const id = this.currentCaseId++;
    const newCase: Case = {
      ...caseData,
      id,
      status: "active",
      timeline: [],
      createdAt: new Date(),
      images: [],
      aiAnalysis: {
        entities: [],
        locations: [],
        timestamps: [],
        confidence: 0
      },
      searchRadius: {
        radius: 0,
        probableLocations: []
      },
      lastSighting: null,
      transportMode: "walking"
    };
    this.cases.set(id, newCase);
    return newCase;
  }

  async getCase(id: number): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async getAllCases(): Promise<Case[]> {
    return Array.from(this.cases.values());
  }

  async updateCase(id: number, caseData: Partial<Case>): Promise<Case> {
    const existingCase = this.cases.get(id);
    if (!existingCase) {
      throw new Error("Case not found");
    }
    const updatedCase = { ...existingCase, ...caseData };
    this.cases.set(id, updatedCase);
    return updatedCase;
  }

  async addCameraFootage(footage: InsertCameraFootage): Promise<CameraFootage> {
    const id = this.currentFootageId++;
    const newFootage: CameraFootage = {
      ...footage,
      id,
      aiAnalysis: {
        detections: [],
        summary: "",
        processedAt: null
      }
    };
    this.cameraFootage.set(id, newFootage);
    return newFootage;
  }

  async getCaseFootage(caseId: number): Promise<CameraFootage[]> {
    return Array.from(this.cameraFootage.values()).filter(
      (footage) => footage.caseId === caseId
    );
  }

  async updateCaseAIAnalysis(id: number, analysis: AIAnalysis): Promise<Case> {
    const existingCase = await this.getCase(id);
    if (!existingCase) {
      throw new Error("Case not found");
    }
    return this.updateCase(id, { aiAnalysis: analysis });
  }

  async updateCaseSearchRadius(id: number, searchRadius: SearchRadius): Promise<Case> {
    const existingCase = await this.getCase(id);
    if (!existingCase) {
      throw new Error("Case not found");
    }
    return this.updateCase(id, { searchRadius });
  }

  async updateFootageAnalysis(id: number, analysis: CameraAIAnalysis): Promise<CameraFootage> {
    const footage = this.cameraFootage.get(id);
    if (!footage) {
      throw new Error("Footage not found");
    }
    const updatedFootage = { ...footage, aiAnalysis: analysis };
    this.cameraFootage.set(id, updatedFootage);
    return updatedFootage;
  }

  async addTimelineEvent(
    caseId: number,
    event: { time: string; event: string; details?: Record<string, any> }
  ): Promise<Case> {
    const existingCase = await this.getCase(caseId);
    if (!existingCase) {
      throw new Error("Case not found");
    }
    const timeline = [...existingCase.timeline, event];
    return this.updateCase(caseId, { timeline });
  }
}

export const storage = new MemStorage();