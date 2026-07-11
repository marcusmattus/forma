import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

interface WeeklyChartProps {
  title?: string;
  data: Array<{ label: string; value: number }>;
  color?: string;
}

export function WeeklyChart({ title, data, color = COLORS.green }: WeeklyChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.card}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.row}>
        {data.map((d) => (
          <View key={d.label} style={styles.col}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height: (d.value / max) * 72,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text style={styles.label}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.mute,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    gap: 6,
  },
  col: { flex: 1, alignItems: 'center' },
  barTrack: {
    width: '100%',
    height: 80,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  label: {
    color: COLORS.mute,
    fontSize: 9,
    marginTop: 8,
    fontWeight: '600',
  },
});
