import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS } from '../theme';

const BAR_COUNT = 24;
const HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => 20 + ((i * 137) % 80));

interface VoiceWaveformProps {
  active?: boolean;
  height?: number;
}

export function VoiceWaveform({ active = true, height = 64 }: VoiceWaveformProps) {
  const anims = useRef(HEIGHTS.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (!active) return;
    const loops = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300 + (i % 5) * 80,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.25,
            duration: 300 + (i % 3) * 60,
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, anims]);

  return (
    <View style={[styles.row, { height }]}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              transform: [{ scaleY: anim }],
              height: HEIGHTS[i] * 0.6,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: COLORS.violet,
    opacity: 0.85,
  },
});
