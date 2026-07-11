import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useVoice } from '../context/VoiceContext';
import { VoiceOrb } from '../components/VoiceOrb';
import { COLORS } from '../theme';
import type { OnboardingStep } from '../types';

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    prompt: "I'm your FORMA AI Coach. Let's build your profile — what's your name?",
    placeholder: 'Alex',
    field: 'name',
  },
  {
    id: 'goals',
    prompt: 'What are your main fitness goals?',
    placeholder: 'Build strength, move better',
    field: 'goals',
  },
  {
    id: 'experience',
    prompt: 'How would you describe your experience level?',
    placeholder: 'Beginner, Intermediate, or Advanced',
    field: 'experience',
  },
  {
    id: 'equipment',
    prompt: 'What equipment do you have access to?',
    placeholder: 'Full gym, home setup, bodyweight only...',
    field: 'equipment',
  },
];

export function OnboardingScreen() {
  const { profile, setProfile, completeOnboarding, processVoice } = useVoice();
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);

  const step = STEPS[stepIndex];
  const isWelcome = stepIndex === 0;

  const advance = async () => {
    const value = input.trim();
    if (!value && step.field === 'name') return;

    const updated = value ? { [step.field]: value } : {};
    if (value) setProfile(updated);

    if (stepIndex < STEPS.length - 1) {
      if (stepIndex === 0 && value) {
        await processVoice(`My name is ${value}`);
      }
      setStepIndex((i) => i + 1);
      setInput('');
      setListening(false);
    } else {
      const name = (value && step.field === 'name') ? value : profile.name;
      const equipment = (value && step.field === 'equipment') ? value : profile.equipment;
      await processVoice(
        `I'm ${name}. My goals are ${profile.goals}. Experience: ${profile.experience}. Equipment: ${equipment}.`
      );
      completeOnboarding();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>FORMA</Text>
      <Text style={styles.tagline}>YOUR AI FITNESS COACH</Text>

      <View style={styles.orbWrap}>
        <VoiceOrb size={200} active={listening} />
      </View>

      <Text style={styles.prompt}>{step.prompt}</Text>

      {(listening || !isWelcome) && (
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={step.placeholder}
          placeholderTextColor={COLORS.mute}
          onSubmitEditing={advance}
        />
      )}

      <View style={styles.actions}>
        <Pressable
          style={[styles.micBtn, listening && styles.micActive]}
          onPress={() => {
            if (listening) advance();
            else setListening(true);
          }}
        >
          <Text style={styles.micText}>{listening ? '■  Continue' : '🎤  Tap to Answer'}</Text>
        </Pressable>

        {stepIndex > 0 && (
          <Pressable style={styles.skip} onPress={advance}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.dots}>
        {STEPS.map((s, i) => (
          <View key={s.id} style={[styles.dot, i <= stepIndex && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.pillars}>
        {['Voice First', 'Vision Tracking', 'AI Coaching', 'Real-Time Feedback'].map((p) => (
          <Text key={p} style={styles.pillar}>
            {p}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 28,
    paddingTop: 72,
    alignItems: 'center',
  },
  logo: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 6,
  },
  tagline: {
    color: COLORS.mute,
    fontSize: 9,
    letterSpacing: 3,
    marginTop: 6,
    marginBottom: 32,
  },
  orbWrap: { marginBottom: 28 },
  prompt: {
    color: COLORS.dim,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.elevated,
    borderRadius: 14,
    padding: 16,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  actions: { alignItems: 'center', gap: 12 },
  micBtn: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 32,
  },
  micActive: { backgroundColor: COLORS.indigo },
  micText: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  skip: { padding: 8 },
  skipText: { color: COLORS.mute, fontSize: 13 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 32 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: { backgroundColor: COLORS.violet },
  pillars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
  },
  pillar: {
    color: COLORS.mute,
    fontSize: 8,
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    textTransform: 'uppercase',
  },
});
