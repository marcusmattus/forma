import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TabId } from '../types';
import { COLORS } from '../theme';

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'workout', label: 'Workout', icon: '◎' },
  { id: 'camera', label: 'Vision', icon: '▣' },
  { id: 'progress', label: 'Progress', icon: '◔' },
  { id: 'profile', label: 'Profile', icon: '☺' },
];

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Pressable key={tab.id} style={styles.tab} onPress={() => onChange(tab.id)}>
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.ink,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 24,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  icon: { fontSize: 18, color: COLORS.mute },
  iconActive: { color: COLORS.violet },
  label: { fontSize: 9, color: COLORS.mute, fontWeight: '600' },
  labelActive: { color: COLORS.text },
});
