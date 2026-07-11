import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Adaptation, Score, UserProfile, WorkoutPlan } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const CLIENT_ID = 'demo_client';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Athlete',
  goals: 'Build strength & move better',
  experience: 'Intermediate',
  equipment: 'Full gym',
  voiceCoach: 'Motivational',
};

const DEFAULT_WORKOUT: WorkoutPlan = {
  title: 'Push Strength',
  durationMin: 45,
  exercises: ['Bench Press', 'Overhead Press', 'Dips'],
  targetReps: 15,
};

interface VoiceContextValue {
  profile: UserProfile;
  setProfile: (patch: Partial<UserProfile>) => void;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  scores: Score[];
  adaptations: Adaptation[];
  spokenFeedback: string | null;
  followUpPrompt: string | null;
  proactivePrompt: string | null;
  workoutPlan: WorkoutPlan;
  processing: boolean;
  listening: boolean;
  setListening: (v: boolean) => void;
  loading: boolean;
  cameraConnected: boolean;
  setCameraConnected: (v: boolean) => void;
  processVoice: (transcript: string) => Promise<void>;
  refreshData: () => Promise<void>;
  coachCue: string;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

const COACH_CUES = [
  'Great depth. Keep pushing.',
  'Control the eccentric. Nice work.',
  'Breathe. Drive through your heels.',
  'One more rep — you\'ve got this.',
];

function deriveWorkoutFromAdaptations(adaptations: Adaptation[], current: WorkoutPlan): WorkoutPlan {
  const swap = adaptations.find((a) => a.type.includes('workout') || a.type.includes('exercise'));
  if (!swap) return current;
  if (swap.description.toLowerCase().includes('20 min') || swap.description.toLowerCase().includes('quick')) {
    return { ...current, title: 'Quick Push', durationMin: 20, targetReps: 12 };
  }
  if (swap.description.toLowerCase().includes('knee') || swap.description.toLowerCase().includes('sore')) {
    return {
      ...current,
      title: 'Modified Push',
      exercises: ['Incline Press', 'Landmine Press', 'Push-ups'],
    };
  }
  return { ...current, title: swap.description.split('.')[0] || current.title };
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [scores, setScores] = useState<Score[]>([]);
  const [adaptations, setAdaptations] = useState<Adaptation[]>([]);
  const [spokenFeedback, setSpokenFeedback] = useState<string | null>(null);
  const [followUpPrompt, setFollowUpPrompt] = useState<string | null>(null);
  const [proactivePrompt, setProactivePrompt] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>(DEFAULT_WORKOUT);
  const [processing, setProcessing] = useState(false);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cameraConnected, setCameraConnected] = useState(false);
  const [coachCueIndex, setCoachCueIndex] = useState(0);
  const [sessionId] = useState(() => `mobile_${Date.now()}`);

  const setProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfileState((p: UserProfile) => ({ ...p, ...patch }));
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/bio/demo`, { method: 'POST' });
      const res = await fetch(`${API_BASE}/api/bio/twin?clientId=${CLIENT_ID}&tier=pro`);
      const json = await res.json();
      setScores(json.document?.digital_twin?.unified_scores ?? []);
      setAdaptations(json.document?.adaptation_log ?? []);
    } catch {
      setScores([
        { key: 'recovery_score', value: 76 },
        { key: 'load_score', value: 58 },
        { key: 'overtraining_risk', value: 22 },
      ]);
    }
    try {
      const res = await fetch(
        `${API_BASE}/api/bio/voice?clientId=${CLIENT_ID}&proactive=true&tier=pro`
      );
      const json = await res.json();
      if (json.proactive?.spoken_response) {
        setProactivePrompt(json.proactive.spoken_response);
      }
    } catch { /* optional */ }
    setLoading(false);
  }, []);

  const processVoice = useCallback(
    async (transcript: string) => {
      if (!transcript.trim()) return;
      setProcessing(true);
      setListening(false);
      try {
        const res = await fetch(`${API_BASE}/api/bio/voice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: CLIENT_ID,
            transcript,
            sessionId,
            tier: 'pro',
          }),
        });
        const json = await res.json();
        const feedback =
          json.spokenFeedback ??
          json.intentResult?.output?.spoken_response ??
          null;
        setSpokenFeedback(feedback);
        setFollowUpPrompt(
          json.intentResult?.output?.follow_up_prompt ??
            json.intentResult?.clarification_prompt ??
            null
        );
        if (json.adaptations?.length) {
          setAdaptations(json.adaptations);
          setWorkoutPlan((w: WorkoutPlan) => deriveWorkoutFromAdaptations(json.adaptations, w));
        }
        if (json.document?.digital_twin?.unified_scores) {
          setScores(json.document.digital_twin.unified_scores);
        }
        if (feedback) {
          setCoachCueIndex((i) => (i + 1) % COACH_CUES.length);
        }
      } catch {
        setSpokenFeedback("Couldn't reach your coach — check your connection.");
      }
      setProcessing(false);
    },
    [sessionId]
  );

  const completeOnboarding = useCallback(() => {
    setOnboardingComplete(true);
    setSpokenFeedback(
      `Welcome, ${profile.name}. I've built your plan around ${profile.goals.toLowerCase()}. Ready when you are.`
    );
  }, [profile.name, profile.goals]);

  const resetOnboarding = useCallback(() => {
    setOnboardingComplete(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const coachCue = spokenFeedback ?? COACH_CUES[coachCueIndex];

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      onboardingComplete,
      completeOnboarding,
      resetOnboarding,
      scores,
      adaptations,
      spokenFeedback,
      followUpPrompt,
      proactivePrompt,
      workoutPlan,
      processing,
      listening,
      setListening,
      loading,
      cameraConnected,
      setCameraConnected,
      processVoice,
      refreshData,
      coachCue,
    }),
    [
      profile,
      setProfile,
      onboardingComplete,
      completeOnboarding,
      resetOnboarding,
      scores,
      adaptations,
      spokenFeedback,
      followUpPrompt,
      proactivePrompt,
      workoutPlan,
      processing,
      listening,
      loading,
      cameraConnected,
      processVoice,
      refreshData,
      coachCue,
    ]
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider');
  return ctx;
}
