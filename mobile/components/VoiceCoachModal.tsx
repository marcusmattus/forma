import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useVoice } from '../context/VoiceContext';
import { COLORS } from '../theme';
import { VoiceOrb } from './VoiceOrb';

interface VoiceCoachModalProps {
  visible: boolean;
  onClose: () => void;
}

export function VoiceCoachModal({ visible, onClose }: VoiceCoachModalProps) {
  const { processVoice, processing, spokenFeedback, followUpPrompt, listening, setListening } =
    useVoice();
  const [transcript, setTranscript] = useState('');

  const handleSpeak = async () => {
    if (listening) {
      setListening(false);
      if (transcript.trim()) {
        await processVoice(transcript);
        setTranscript('');
      }
    } else {
      setListening(true);
      setTranscript('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Pressable style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <Text style={styles.badge}>FORMA · WISPR VOICE AGENT</Text>
          <Text style={styles.title}>Talk to Coach</Text>

          <VoiceOrb size={160} active={listening || processing} />

          {spokenFeedback && (
            <View style={styles.feedback}>
              <Text style={styles.feedbackText}>&ldquo;{spokenFeedback}&rdquo;</Text>
              {followUpPrompt && <Text style={styles.followUp}>→ {followUpPrompt}</Text>}
            </View>
          )}

          {listening && (
            <TextInput
              style={styles.input}
              value={transcript}
              onChangeText={setTranscript}
              placeholder="Type or speak your message..."
              placeholderTextColor={COLORS.mute}
              autoFocus
              onSubmitEditing={handleSpeak}
            />
          )}

          <Pressable
            style={[styles.mic, (listening || processing) && styles.micActive]}
            onPress={handleSpeak}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.micText}>{listening ? '■  Send' : '🎤  Tap to Speak'}</Text>
            )}
          </Pressable>

          <Text style={styles.hint}>
            Try: &ldquo;I&apos;m sore and only have 20 minutes&rdquo; or &ldquo;My knee hurts&rdquo;
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  close: { position: 'absolute', top: 16, right: 20, zIndex: 1 },
  closeText: { color: COLORS.mute, fontSize: 20 },
  badge: {
    color: COLORS.purple,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 8,
  },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginBottom: 16 },
  feedback: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 12,
    width: '100%',
  },
  feedbackText: { color: COLORS.dim, fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
  followUp: { color: COLORS.cyan, fontSize: 12, marginTop: 8, textAlign: 'center' },
  input: {
    width: '100%',
    marginTop: 16,
    backgroundColor: COLORS.elevated,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mic: {
    marginTop: 20,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  micActive: { backgroundColor: COLORS.pink },
  micText: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  hint: { color: COLORS.mute, fontSize: 11, marginTop: 16, textAlign: 'center' },
});
