import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TabBar } from './components/TabBar';
import { VoiceCoachModal } from './components/VoiceCoachModal';
import { VoiceFab } from './components/VoiceFab';
import { VoiceProvider, useVoice } from './context/VoiceContext';
import { CameraScreen } from './screens/CameraScreen';
import { HomeScreen } from './screens/HomeScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { COLORS } from './theme';
import type { TabId } from './types';

function AppShell() {
  const { onboardingComplete } = useVoice();
  const [tab, setTab] = useState<TabId>('home');
  const [voiceOpen, setVoiceOpen] = useState(false);

  if (!onboardingComplete) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <OnboardingScreen />
      </View>
    );
  }

  const renderScreen = () => {
    switch (tab) {
      case 'home':
        return <HomeScreen onStartWorkout={() => setTab('workout')} />;
      case 'workout':
        return <WorkoutScreen />;
      case 'camera':
        return <CameraScreen />;
      case 'progress':
        return <ProgressScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen onStartWorkout={() => setTab('workout')} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderScreen()}
      <VoiceFab onPress={() => setVoiceOpen(true)} />
      <TabBar active={tab} onChange={setTab} />
      <VoiceCoachModal visible={voiceOpen} onClose={() => setVoiceOpen(false)} />
    </View>
  );
}

export default function App() {
  return (
    <VoiceProvider>
      <AppShell />
    </VoiceProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
});
