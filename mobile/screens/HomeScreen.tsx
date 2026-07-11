import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WeeklyChart } from '../components/WeeklyChart';
import { useVoice } from '../context/VoiceContext';
import { COLORS } from '../theme';

const WEEKLY = [
  { label: 'M', value: 72 },
  { label: 'T', value: 85 },
  { label: 'W', value: 45 },
  { label: 'T', value: 78 },
  { label: 'F', value: 90 },
  { label: 'S', value: 60 },
  { label: 'S', value: 76 },
];

interface HomeScreenProps {
  onStartWorkout: () => void;
}

export function HomeScreen({ onStartWorkout }: HomeScreenProps) {
  const {
    profile,
    scores,
    loading,
    workoutPlan,
    spokenFeedback,
    proactivePrompt,
    adaptations,
    refreshData,
  } = useVoice();

  const recovery = scores.find((s) => s.key === 'recovery_score')?.value ?? 76;
  const greeting = recovery >= 70 ? 'Good Morning' : recovery >= 50 ? 'Take It Easy' : 'Recovery Day';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.badge}>FORMA · VOICE-FIRST</Text>
          <Text style={styles.greeting}>
            {greeting}, {profile.name}.
          </Text>
        </View>
        <Pressable onPress={refreshData} style={styles.refresh}>
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>

      {proactivePrompt && (
        <View style={styles.proactive}>
          <Text style={styles.proactiveLabel}>COACH CHECK-IN</Text>
          <Text style={styles.proactiveText}>{proactivePrompt}</Text>
        </View>
      )}

      <View style={styles.workoutCard}>
        <Text style={styles.cardLabel}>TODAY&apos;S WORKOUT</Text>
        <Text style={styles.workoutTitle}>{workoutPlan.title}</Text>
        <Text style={styles.workoutMeta}>{workoutPlan.durationMin} min · {workoutPlan.exercises.join(' · ')}</Text>
        <Pressable style={styles.startBtn} onPress={onStartWorkout}>
          <Text style={styles.startText}>Start Workout</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.purple} style={{ marginVertical: 24 }} />
      ) : (
        <View style={styles.statsRow}>
          {scores.slice(0, 3).map((s) => (
            <View key={s.key} style={styles.stat}>
              <Text style={styles.statValue}>{Math.round(s.value)}</Text>
              <Text style={styles.statLabel}>
                {s.key === 'recovery_score' ? 'Recovery' : s.key === 'load_score' ? 'Load' : 'Risk'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <WeeklyChart title="Weekly Volume" data={WEEKLY} color={COLORS.violet} />

      {spokenFeedback && (
        <View style={styles.coachCard}>
          <Text style={styles.cardLabel}>AI COACH</Text>
          <Text style={styles.coachText}>&ldquo;{spokenFeedback}&rdquo;</Text>
        </View>
      )}

      {adaptations.length > 0 && (
        <View style={styles.adaptCard}>
          <Text style={styles.cardLabel}>ADAPTATIONS</Text>
          {adaptations.slice(0, 2).map((a, i) => (
            <View key={i} style={styles.adaptRow}>
              <Text style={styles.adaptType}>{a.type}</Text>
              <Text style={styles.adaptDesc}>{a.description}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 56, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  badge: { color: COLORS.purple, fontSize: 9, letterSpacing: 2, marginBottom: 6 },
  greeting: { color: COLORS.text, fontSize: 26, fontWeight: '700' },
  refresh: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: { color: COLORS.purple, fontSize: 18 },
  proactive: {
    backgroundColor: 'rgba(34,211,238,0.08)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.2)',
  },
  proactiveLabel: { color: COLORS.cyan, fontSize: 9, letterSpacing: 2, marginBottom: 6 },
  proactiveText: { color: COLORS.dim, fontSize: 13 },
  workoutCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLabel: { color: COLORS.mute, fontSize: 9, letterSpacing: 2, marginBottom: 10 },
  workoutTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginBottom: 6 },
  workoutMeta: { color: COLORS.dim, fontSize: 12, marginBottom: 18 },
  startBtn: {
    backgroundColor: COLORS.purple,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  startText: { color: COLORS.text, fontWeight: '700', fontSize: 14, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  stat: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  statLabel: { color: COLORS.mute, fontSize: 10, marginTop: 4 },
  coachCard: {
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
  },
  coachText: { color: COLORS.dim, fontSize: 14, fontStyle: 'italic' },
  adaptCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adaptRow: { marginTop: 10 },
  adaptType: { color: COLORS.cyan, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  adaptDesc: { color: COLORS.text, fontSize: 13, marginTop: 4 },
});
