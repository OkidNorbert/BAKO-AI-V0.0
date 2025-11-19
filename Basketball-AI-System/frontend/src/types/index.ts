// TypeScript types for Basketball AI System

export interface VideoAnalysisRequest {
  file: File;
  player_id?: string;
}

export interface ActionProbabilities {
  shooting: number;
  dribbling: number;
  passing: number;
  defense: number;
  idle: number;
}

export interface PerformanceMetrics {
  jump_height: number;      // meters
  movement_speed: number;   // m/s
  form_score: number;       // 0-1
  reaction_time: number;    // seconds
  pose_stability: number;   // 0-1
  energy_efficiency: number; // 0-1
}

export interface Recommendation {
  type: 'improvement' | 'focus' | 'excellent' | 'warning';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

export interface VideoAnalysisResult {
  video_id: string;
  action: {
    label: string;
    confidence: number;
    probabilities: ActionProbabilities;
  };
  metrics: PerformanceMetrics;
  recommendations: Recommendation[];
  keypoints?: number[][][]; // For visualization
  timestamp: string;
}

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

export interface HistoricalData {
  date: string;
  metrics: PerformanceMetrics;
  action: string;
}

