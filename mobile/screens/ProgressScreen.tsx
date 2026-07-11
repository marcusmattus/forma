import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProgressRing } from '../components/ProgressRing';
import { WeeklyChart } from '../components/WeeklyChart';
import { useVoice } from '../context/VoiceContext';
import { COLORS } from '../theme';

const WEEKLY_RECOVERY = [
  { label: 'M', value: 72 },
  { label: 'T', value: 85 },
  { label: 'W', value: 45 },
  { label: 'T', value: 78 },
  { label: 'F', value: 90 },
  { label: 'S', value: 60 },
  { label: 'S', value: 76 },
];

export function ProgressScreen() {
  const { scores, loading } = useVoice();

  const recovery = scores.find((s) => s.key === 'recovery_score')?.value ?? 76;
  const load = scores.find((s) => s.key === 'load_score')?.value ?? 58;
  const strengthScore = Math.round((recovery * 0.6 + load * 0.4));

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.badge}>PROGRESS & ANALYTICS</Text>
      <Text style={styles.title}>Your Trajectory</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.purple} style={{ marginVertical: 40 }} />
      ) : (
        <>
          <View style={styles.scoreSection}>
            <ProgressRing
              value={strengthScore}
              max={100}
              size={180}
              label="Strength"
              sublabel="/ 100"
              color={COLORS.green}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Workouts</Text>
              <Text style={styles.statSub}>This month</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(load * 42)}k</Text>
              <Text style={styles.statLabel}>Volume</Text>
              <Text style={styles.statSub}>lbs moved</Text>
            </View>
          </View>

          <WeeklyChart title="Weekly Recovery Trend" data={WEEKLY_RECOVERY} color={COLORS.green} />

          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>AI INSIGHT</Text>
            <Text style={styles.insightText}>
              Recovery trending up {Math.round(recovery - 70)}% this week. Your voice-adapted sessions
              are keeping load in the optimal zone.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 56, paddingBottom: 120 },
  badge: { color: COLORS.green, fontSize: 9, letterSpacing: 2, marginBottom: 8 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '700', marginBottom: 24 },
  scoreSection: { alignItems: 'center', marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { color: COLORS.text, fontSize: 28, fontWeight: '700' },
  statLabel: { color: COLORS.dim, fontSize: 12, marginTop: 4 },
  statSub: { color: COLORS.mute, fontSize: 10, marginTop: 2 },
  insightCard: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  insightLabel: { color: COLORS.green, fontSize: 9, letterSpacing: 2, marginBottom: 8 },
  insightText: { color: COLORS.dim, fontSize: 13, lineHeight: 20 },
});
