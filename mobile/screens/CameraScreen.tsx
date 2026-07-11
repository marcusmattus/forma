import { Pressable, StyleSheet, Text, View } from 'react-native';
import { VoiceOrb } from '../components/VoiceOrb';
import { useVoice } from '../context/VoiceContext';
import { COLORS } from '../theme';

const QR_PATTERN = [
  [1, 1, 1, 0, 1, 1, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0],
  [1, 0, 1, 1, 0, 1, 0],
  [0, 1, 0, 1, 1, 0, 1],
  [1, 1, 0, 0, 1, 1, 1],
];

export function CameraScreen() {
  const { cameraConnected, setCameraConnected, spokenFeedback } = useVoice();

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>VISION TRACKING</Text>
      <Text style={styles.title}>Connect Your{'\n'}Tracking Device</Text>
      <Text style={styles.sub}>
        Pair an external camera or use your phone for real-time form analysis.
      </Text>

      <View style={styles.qrCard}>
        <View style={styles.qr}>
          {QR_PATTERN.map((row, y) => (
            <View key={y} style={styles.qrRow}>
              {row.map((cell, x) => (
                <View
                  key={`${x}-${y}`}
                  style={[styles.qrCell, cell === 1 && styles.qrCellOn]}
                />
              ))}
            </View>
          ))}
        </View>
        <Text style={styles.qrHint}>Scan with laptop camera app</Text>
        <Text style={styles.sessionId}>Session: FORMA-8A26</Text>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.dot, cameraConnected && styles.dotOn]} />
        <Text style={styles.statusText}>
          {cameraConnected ? 'Connected — Vision agent active' : 'Waiting for device...'}
        </Text>
      </View>

      <Pressable
        style={[styles.connectBtn, cameraConnected && styles.connectedBtn]}
        onPress={() => setCameraConnected(!cameraConnected)}
      >
        <Text style={styles.connectText}>
          {cameraConnected ? 'Disconnect' : 'Simulate Connect'}
        </Text>
      </Pressable>

      <View style={styles.orbSection}>
        <VoiceOrb size={120} active={cameraConnected} showWaveform={cameraConnected} />
        <Text style={styles.voiceNote}>
          Say &ldquo;Start tracking&rdquo; once connected
        </Text>
      </View>

      {spokenFeedback && cameraConnected && (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>{spokenFeedback}</Text>
        </View>
      )}

      <View style={styles.features}>
        {['Rep counting', 'Depth analysis', 'Posture cues', 'Real-time feedback'].map((f) => (
          <Text key={f} style={styles.feature}>
            {f}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 120,
    alignItems: 'center',
  },
  badge: { color: COLORS.cyan, fontSize: 9, letterSpacing: 2, marginBottom: 12 },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 10,
  },
  sub: { color: COLORS.dim, fontSize: 13, textAlign: 'center', marginBottom: 28 },
  qrCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  qr: { gap: 3, marginBottom: 16 },
  qrRow: { flexDirection: 'row', gap: 3 },
  qrCell: { width: 14, height: 14, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)' },
  qrCellOn: { backgroundColor: COLORS.text },
  qrHint: { color: COLORS.mute, fontSize: 11 },
  sessionId: { color: COLORS.violet, fontSize: 10, marginTop: 8, letterSpacing: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.amber },
  dotOn: { backgroundColor: COLORS.green },
  statusText: { color: COLORS.dim, fontSize: 13 },
  connectBtn: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    marginBottom: 28,
  },
  connectedBtn: { backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.green },
  connectText: { color: COLORS.text, fontWeight: '700' },
  orbSection: { alignItems: 'center', marginBottom: 20 },
  voiceNote: { color: COLORS.mute, fontSize: 11, marginTop: 12 },
  feedback: {
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 16,
  },
  feedbackText: { color: COLORS.dim, fontSize: 13, textAlign: 'center', fontStyle: 'italic' },
  features: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  feature: {
    color: COLORS.mute,
    fontSize: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
