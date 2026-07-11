export type TabId = 'home' | 'workout' | 'camera' | 'progress' | 'profile';

export type VoiceCoachStyle = 'Motivational' | 'Calm' | 'Technical' | 'Friendly';

export interface UserProfile {
  name: string;
  goals: string;
  experience: string;
  equipment: string;
  voiceCoach: VoiceCoachStyle;
}

export interface Score {
  key: string;
  value: number;
}

export interface Adaptation {
  id?: string;
  type: string;
  description: string;
  magnitude?: string;
}

export interface WorkoutPlan {
  title: string;
  durationMin: number;
  exercises: string[];
  targetReps: number;
}

export interface OnboardingStep {
  id: string;
  prompt: string;
  placeholder: string;
  field: keyof UserProfile;
}
