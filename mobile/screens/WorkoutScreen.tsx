import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressRing } from '../components/ProgressRing';
import { VoiceWaveform } from '../components/VoiceWaveform';
import { useVoice } from '../context/VoiceContext';
import { COLORS } from '../theme';

export function WorkoutScreen() {
  const { workoutPlan, coachCue, listening, processing } = useVoice();
  const [reps, setReps] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');

  const addRep = () => {
    if (!active) setActive(true);
    setReps((r) => Math.min(r + 1, workoutPlan.targetReps));
  };

  const cueLines = coachCue.includes('.')
    ? coachCue.split(/(?<=\.)\s+/)
    : coachCue.split('\n');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sessionLabel}>{workoutPlan.title.toUpperCase()}</Text>
        <Text style={styles.timer}>
          {mins}:{secs}
        </Text>
      </View>

      <View style={styles.ringWrap}>
        <ProgressRing
          value={reps}
          max={workoutPlan.targetReps}
          size={200}
          label="Reps"
          sublabel={`/${workoutPlan.targetReps}`}
          color={COLORS.violet}
        />
      </View>

      <View style={styles.cueBox}>
        {cueLines.map((line, i) => (
          <Text key={i} style={styles.cue}>
            {line}
          </Text>
        ))}
      </View>

      <VoiceWaveform active={active || listening || processing} height={56} />

      <View style={styles.actions}>
        <Pressable style={styles.repBtn} onPress={addRep}>
          <Text style={styles.repBtnText}>+ Rep</Text>
        </Pressable>
        <Pressable
          style={[styles.controlBtn, active && styles.controlActive]}
          onPress={() => setActive((a) => !a)}
        >
          <Text style={styles.controlText}>{active ? 'Pause' : 'Start Set'}</Text>
        </Pressable>
      </View>

      <Text style={styles.voiceHint}>Voice agent adapts this session in real-time</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 120,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sessionLabel: {
    color: COLORS.violet,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
  },
  timer: { color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 2, fontFamily: 'monospace' },
  ringWrap: { marginVertical: 16 },
  cueBox: { alignItems: 'center', marginVertical: 20, minHeight: 56 },
  cue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 28,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  repBtn: {
    backgroundColor: COLORS.indigo,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  repBtnText: { color: COLORS.text, fontWeight: '700' },
  controlBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  controlActive: { borderColor: COLORS.cyan, backgroundColor: 'rgba(34,211,238,0.1)' },
  controlText: { color: COLORS.dim, fontWeight: '600' },
  voiceHint: { color: COLORS.mute, fontSize: 10, marginTop: 20, letterSpacing: 1 },
});
