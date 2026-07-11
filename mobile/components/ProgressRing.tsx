import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  strokeWidth?: number;
}

export function ProgressRing({
  value,
  max = 100,
  size = 160,
  label,
  sublabel,
  color = COLORS.violet,
  strokeWidth = 8,
}: ProgressRingProps) {
  const pct = Math.min(value / max, 1);
  const inner = size - strokeWidth * 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.track,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
          },
        ]}
      />
      <View
        style={[
          styles.progress,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: pct > 0.25 ? color : 'transparent',
            borderRightColor: pct > 0.5 ? color : 'transparent',
            borderBottomColor: pct > 0.75 ? color : 'transparent',
            borderLeftColor: pct > 0 ? color : 'transparent',
            opacity: 0.95,
          },
        ]}
      />
      <View style={[styles.center, { width: inner, height: inner, borderRadius: inner / 2 }]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <Text style={styles.value}>{Math.round(value)}</Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  track: {
    position: 'absolute',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  progress: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: COLORS.mute,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    color: COLORS.text,
    fontSize: 48,
    fontWeight: '300',
  },
  sublabel: {
    color: COLORS.mute,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 4,
  },
});
