// TypeScript types for Basketball AI System

export interface VideoAnalysisRequest {
  file: File;
  player_id?: string;
}

export interface ActionProbabilities {
  // Shooting types (specific to court position)
  free_throw: number;
  two_point_shot: number;
  three_point_shot: number;
  layup: number;
  dunk: number;

  // Ball handling
  dribbling: number;
  passing: number;

  // Movement
  defense: number;
  running: number;
  walking: number;

  // Game actions
  blocking: number;
  picking: number;

  // Other
  ball_in_hand: number;
  idle: number;
}

export interface PerformanceMetrics {
  jump_height: number;      // meters
  movement_speed: number;   // m/s
  form_score: number;       // 0-1
  reaction_time: number;    // seconds
  pose_stability: number;   // 0-1
  energy_efficiency: number; // 0-1
  // Enhanced biomechanics features (optional)
  elbow_angle?: number;     // degrees
  release_angle?: number;   // degrees
  knee_angle?: number;     // degrees
  shoulder_angle?: number;  // degrees
  stability_score?: number; // 0-1
  smoothness_score?: number; // 0-1
  follow_through_score?: number; // 0-1
  dribble_height?: number;  // normalized units
  dribble_frequency?: number; // Hz
  consistency?: number;     // 0-1
}

export interface Recommendation {
  type: 'improvement' | 'focus' | 'excellent' | 'warning';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

export interface FormQualityIssue {
  issue_type: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  current_value?: number;
  optimal_value?: string;
  recommendation: string;
}

export interface FormQualityAssessment {
  overall_score: number;
  quality_rating: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  issues: FormQualityIssue[];
  strengths: string[];
}

export interface TimelineSegment {
  start_time: number;
  end_time: number;
  action: {
    label: string;
    confidence: number;
    probabilities: ActionProbabilities;
  };
  metrics: PerformanceMetrics;
  form_quality?: FormQualityAssessment;
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
  timeline?: TimelineSegment[];
  keypoints?: number[][][]; // For visualization
  annotated_video_url?: string;
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

