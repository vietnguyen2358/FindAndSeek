import { apiRequest } from './queryClient';

export async function analyzeImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/analyze-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to analyze image');
  }

  return response.json();
}

export async function searchDetections(query: string, detections: any[]) {
  const response = await apiRequest('POST', '/api/search', {
    query,
    detections,
  });

  if (!response.ok) {
    throw new Error('Failed to search detections');
  }

  return response.json();
}
