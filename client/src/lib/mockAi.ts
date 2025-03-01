import type { Case } from "@shared/schema";

export async function simulateAiImageAnalysis(image: File): Promise<{
  confidence: number;
  matches: string[];
  locations: string[];
}> {
  await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate processing
  return {
    confidence: Math.random() * 0.5 + 0.3,
    matches: [
      "Person wearing red jacket",
      "Male, approximately 5'10\"",
      "Baseball cap",
    ],
    locations: [
      "Downtown area",
      "Near Central Park",
      "Main Street crossing",
    ],
  };
}

export async function simulateAiTextAnalysis(text: string): Promise<{
  entities: string[];
  locations: string[];
  timestamps: string[];
}> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    entities: [
      "John Doe",
      "Red jacket",
      "Black backpack",
    ],
    locations: [
      "Central Park",
      "5th Avenue",
    ],
    timestamps: [
      "2024-03-21 15:30",
      "2024-03-21 16:45",
    ],
  };
}

export function generateMockTimeline(caseData: Case): {
  time: string;
  event: string;
}[] {
  return [
    {
      time: new Date(caseData.createdAt).toLocaleString(),
      event: "Case opened",
    },
    {
      time: new Date(Date.now() - 3600000).toLocaleString(),
      event: "AI analysis completed",
    },
    {
      time: new Date(Date.now() - 1800000).toLocaleString(),
      event: "New footage analyzed",
    },
  ];
}
