import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const CLIENT_ID = 'demo_client';

const COLORS = {
  bg: '#0F0F16',
  card: '#1A1A2E',
  purple: '#7C3AED',
  cyan: '#22D3EE',
  green: '#22C55E',
  amber: '#F59E0B',
  text: '#F5F3FF',
  dim: '#B8B4CC',
  mute: '#6E6A86',
};

interface Score {
  key: string;
  value: number;
}

function RecoveryRing({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.ringContainer}>
      <View style={[styles.ring, { borderColor: color }]}>
        <Text style={styles.ringValue}>{Math.round(value)}</Text>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
    </View>
  );
}

export default function App() {
  const [scores, setScores] = useState<Score[]>([]);
  const [spokenFeedback, setSpokenFeedback] = useState<string | null>(null);
  const [adaptations, setAdaptations] = useState<Array<{ description: string; type: string }>>([]);
  const [voiceInput, setVoiceInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/bio/demo`, { method: 'POST' });
      const res = await fetch(`${API_BASE}/api/bio/twin?clientId=${CLIENT_ID}&tier=pro`);
      const json = await res.json();
      setScores(json.document?.digital_twin?.unified_scores ?? []);
    } catch {
      setScores([
        { key: 'recovery_score', value: 76 },
        { key: 'load_score', value: 58 },
        { key: 'overtraining_risk', value: 22 },
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVoice = async () => {
    if (!voiceInput.trim()) return;
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/bio/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: CLIENT_ID, transcript: voiceInput, tier: 'pro' }),
      });
      const json = await res.json();
      setSpokenFeedback(json.spokenFeedback ?? null);
      setAdaptations(json.adaptations ?? []);
      if (json.document?.digital_twin?.unified_scores) {
        setScores(json.document.digital_twin.unified_scores);
      }
      setVoiceInput('');
    } catch {
      setSpokenFeedback("Couldn't reach the coach — check your connection.");
    }
    setProcessing(false);
  };

  const ringColors: Record<string, string> = {
    recovery_score: COLORS.green,
    load_score: COLORS.purple,
    overtraining_risk: COLORS.amber,
  };

  const ringLabels: Record<string, string> = {
    recovery_score: 'Recovery',
    load_score: 'Load',
    overtraining_risk: 'Risk',
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.badge}>MOTIONOS · HERMES + WISPR</Text>
        <Text style={styles.title}>Hey Alex</Text>
        <Text style={styles.subtitle}>Today&apos;s Plan</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.purple} size="large" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>DAILY PROGRESS</Text>
            <View style={styles.ringsRow}>
              {scores.slice(0, 3).map((s) => (
                <RecoveryRing
                  key={s.key}
                  value={s.value}
                  label={ringLabels[s.key] ?? s.key}
                  color={ringColors[s.key] ?? COLORS.cyan}
                />
              ))}
            </View>
          </View>
        )}

        {spokenFeedback && (
          <View style={[styles.card, styles.feedbackCard]}>
            <Text style={styles.cardTitle}>AI COACH</Text>
            <Text style={styles.feedback}>&ldquo;{spokenFeedback}&rdquo;</Text>
          </View>
        )}

        {adaptations.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ADAPTATIONS</Text>
            {adaptations.map((a, i) => (
              <View key={i} style={styles.adaptRow}>
                <Text style={styles.adaptType}>{a.type}</Text>
                <Text style={styles.adaptDesc}>{a.description}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.card, styles.coachCard]}>
          <Text style={styles.cardTitle}>TALK TO COACH</Text>
          <Text style={styles.coachPrompt}>I&apos;m your AI Coach. How can I help today?</Text>
          <TextInput
            style={styles.input}
            value={voiceInput}
            onChangeText={setVoiceInput}
            placeholder="Try: I'm sore and only have 20 minutes"
            placeholderTextColor={COLORS.mute}
            onSubmitEditing={handleVoice}
          />
          <Pressable
            style={[styles.micButton, processing && styles.micDisabled]}
            onPress={handleVoice}
            disabled={processing}
          >
            <Text style={styles.micText}>{processing ? '...' : '🎤  Speak'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 24, paddingTop: 60 },
  badge: { color: COLORS.purple, fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  title: { color: COLORS.text, fontSize: 32, fontWeight: '700' },
  subtitle: { color: COLORS.dim, fontSize: 16, marginBottom: 24 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.15)',
  },
  cardTitle: { color: COLORS.mute, fontSize: 10, letterSpacing: 2, marginBottom: 16 },
  ringsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  ringContainer: { alignItems: 'center' },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  ringLabel: { color: COLORS.dim, fontSize: 11, marginTop: 8 },
  feedbackCard: { borderColor: 'rgba(34,211,238,0.3)' },
  feedback: { color: COLORS.dim, fontSize: 14, fontStyle: 'italic' },
  adaptRow: { marginBottom: 12 },
  adaptType: { color: COLORS.cyan, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  adaptDesc: { color: COLORS.text, fontSize: 13, marginTop: 4 },
  coachCard: { alignItems: 'center' },
  coachPrompt: { color: COLORS.dim, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  input: {
    width: '100%',
    backgroundColor: '#252540',
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    marginBottom: 12,
  },
  micButton: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  micDisabled: { opacity: 0.5 },
  micText: { color: COLORS.text, fontWeight: '600', fontSize: 15 },
});
