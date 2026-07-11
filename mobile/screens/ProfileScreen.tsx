import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useVoice } from '../context/VoiceContext';
import { COLORS } from '../theme';
import type { VoiceCoachStyle } from '../types';

const COACH_STYLES: VoiceCoachStyle[] = ['Motivational', 'Calm', 'Technical', 'Friendly'];
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export function ProfileScreen() {
  const { profile, setProfile, resetOnboarding } = useVoice();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.badge}>PROFILE & CUSTOMIZATION</Text>
      <Text style={styles.title}>{profile.name}</Text>
      <Text style={styles.sub}>{profile.goals}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>GOALS</Text>
        <Text style={styles.sectionValue}>{profile.goals}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>EXPERIENCE LEVEL</Text>
        <View style={styles.chips}>
          {EXPERIENCE_LEVELS.map((level) => (
            <Pressable
              key={level}
              style={[styles.chip, profile.experience === level && styles.chipActive]}
              onPress={() => setProfile({ experience: level })}
            >
              <Text style={[styles.chipText, profile.experience === level && styles.chipTextActive]}>
                {level}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>EQUIPMENT</Text>
        <Text style={styles.sectionValue}>{profile.equipment}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>VOICE COACH</Text>
        <Text style={styles.sectionHint}>Choose how your AI coach speaks to you</Text>
        <View style={styles.chips}>
          {COACH_STYLES.map((style) => (
            <Pressable
              key={style}
              style={[styles.chip, profile.voiceCoach === style && styles.chipActive]}
              onPress={() => setProfile({ voiceCoach: style })}
            >
              <Text
                style={[styles.chipText, profile.voiceCoach === style && styles.chipTextActive]}
              >
                {style}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.pillars}>
        <Text style={styles.pillarsTitle}>POWERED BY</Text>
        {['Wispr Voice Agent', 'Hermes Memory', 'MotionOS Bio Twin', 'Vision Tracking'].map(
          (p) => (
            <Text key={p} style={styles.pillar}>
              {p}
            </Text>
          )
        )}
      </View>

      <Pressable style={styles.restartBtn} onPress={resetOnboarding}>
        <Text style={styles.restartText}>Restart Voice Onboarding</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 56, paddingBottom: 120 },
  badge: { color: COLORS.purple, fontSize: 9, letterSpacing: 2, marginBottom: 8 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '700' },
  sub: { color: COLORS.dim, fontSize: 14, marginBottom: 28 },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: { color: COLORS.mute, fontSize: 9, letterSpacing: 2, marginBottom: 10 },
  sectionValue: { color: COLORS.text, fontSize: 15 },
  sectionHint: { color: COLORS.mute, fontSize: 11, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  chipText: { color: COLORS.dim, fontSize: 12 },
  chipTextActive: { color: COLORS.text, fontWeight: '600' },
  pillars: { marginTop: 20, alignItems: 'center' },
  pillarsTitle: { color: COLORS.mute, fontSize: 9, letterSpacing: 2, marginBottom: 12 },
  pillar: { color: COLORS.mute, fontSize: 11, marginBottom: 6 },
  restartBtn: {
    marginTop: 24,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  restartText: { color: COLORS.mute, fontSize: 13 },
});
