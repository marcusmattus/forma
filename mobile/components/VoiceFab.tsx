import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useVoice } from '../context/VoiceContext';
import { COLORS } from '../theme';

interface VoiceFabProps {
  onPress: () => void;
}

export function VoiceFab({ onPress }: VoiceFabProps) {
  const { processing } = useVoice();

  return (
    <Pressable style={[styles.fab, processing && styles.fabBusy]} onPress={onPress}>
      <Text style={styles.icon}>🎤</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 50,
  },
  fabBusy: { opacity: 0.7 },
  icon: { fontSize: 22 },
});
