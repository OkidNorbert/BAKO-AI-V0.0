import axios from 'axios';
import type { VideoAnalysisResult, UploadProgress, HistoricalData } from '../types';

// API base URL - adjust based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Upload and analyze basketball video
 */
export async function analyzeVideo(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<VideoAnalysisResult> {
  const formData = new FormData();
  formData.append('video', file);

  try {
    // Upload progress callback
    const response = await api.post<VideoAnalysisResult>('/api/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.({
            progress,
            status: 'uploading',
            message: `Uploading: ${progress}%`,
          });
        }
      },
    });

    return response.data;
  } catch (error) {
    console.error('Video analysis error:', error);
    throw error;
  }
}

/**
 * Get analysis results by ID
 */
export async function getAnalysisResult(videoId: string): Promise<VideoAnalysisResult> {
  const response = await api.get<VideoAnalysisResult>(`/api/results/${videoId}`);
  return response.data;
}

/**
 * Get historical analysis data
 */
export async function getHistory(limit: number = 10): Promise<HistoricalData[]> {
  try {
    const response = await api.get<HistoricalData[]>('/api/history', {
      params: { limit },
    });
    return response.data;
  } catch (error: any) {
    // If endpoint returns 501 (not implemented) or empty array, return empty array
    if (error?.response?.status === 501 || error?.response?.status === 404) {
      return [];
    }
    console.error('Get history error:', error);
    throw error;
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string }> {
  const response = await api.get('/api/health');
  return response.data;
}

export default api;

