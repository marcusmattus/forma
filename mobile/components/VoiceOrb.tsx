import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS } from '../theme';
import { VoiceWaveform } from './VoiceWaveform';

interface VoiceOrbProps {
  size?: number;
  active?: boolean;
  showWaveform?: boolean;
}

export function VoiceOrb({ size = 180, active = false, showWaveform = true }: VoiceOrbProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.9, duration: 1400, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.4, duration: 1400, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, glow]);

  const ringSize = size;
  const innerSize = size * 0.72;

  return (
    <View style={[styles.wrap, { width: size, height: size + (showWaveform ? 80 : 0) }]}>
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            opacity: glow,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.midRing,
          {
            width: ringSize * 0.88,
            height: ringSize * 0.88,
            borderRadius: (ringSize * 0.88) / 2,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      <View
        style={[
          styles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        {showWaveform && <VoiceWaveform active={active} height={innerSize * 0.5} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  outerRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.purple,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  midRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.4)',
    backgroundColor: 'rgba(79,70,229,0.06)',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,26,46,0.9)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
