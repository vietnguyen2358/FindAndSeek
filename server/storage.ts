import { cases, cameraFootage, type Case, type InsertCase, type CameraFootage, type InsertCameraFootage } from "@shared/schema";

export interface IStorage {
  createCase(caseData: InsertCase): Promise<Case>;
  getCase(id: number): Promise<Case | undefined>;
  getAllCases(): Promise<Case[]>;
  updateCase(id: number, caseData: Partial<Case>): Promise<Case>;
  addCameraFootage(footage: InsertCameraFootage): Promise<CameraFootage>;
  getCaseFootage(caseId: number): Promise<CameraFootage[]>;
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
      images: []
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
      aiAnalysis: {}
    };
    this.cameraFootage.set(id, newFootage);
    return newFootage;
  }

  async getCaseFootage(caseId: number): Promise<CameraFootage[]> {
    return Array.from(this.cameraFootage.values()).filter(
      (footage) => footage.caseId === caseId
    );
  }
}

export const storage = new MemStorage();
