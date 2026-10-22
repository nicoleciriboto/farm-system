import React, { useEffect } from 'react';
import { View, StyleSheet, Text, BackHandler, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useApp, TAB_SCREENS } from '@/store';
import { NativeHeader } from '@/components/NativeHeader';
import { NativeTabBar } from '@/components/NativeTabBar';
import { NativeNotificationCenter } from '@/components/NativeNotificationCenter';
import { HomeScreen } from '@/screens/HomeScreen';
import { LivestockScreen } from '@/screens/LivestockScreen';
import { AddAnimalScreen } from '@/screens/AddAnimalScreen';
import { AnimalProfileScreen } from '@/screens/AnimalProfileScreen';
import { HealthScreen, HealthTaskDetailScreen } from '@/screens/HealthScreen';
import { OperationsScreen, OperationsSectionScreen, operationsSectionTitles, type OperationsSection } from '@/screens/OperationsScreen';
import { ReportsScreen } from '@/screens/ReportsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { colors, radius, font, weight } from '@/theme';

// Keep the native splash up until saved farm data has been loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

function AppToast({ topOffset }: { topOffset: number }) {
  const { toast } = useApp();
  if (!toast) return null;

  const bgColor = toast.type === 'error' ? colors.danger : colors.forest700;

  return (
    <View style={[styles.toastContainer, { top: topOffset, backgroundColor: bgColor }]}>
      <Text style={styles.toastText}>{toast.message}</Text>
    </View>
  );
}

const headerTitles: Partial<Record<string, string>> = {
  addAnimal: 'Add Animal',
  animalProfile: 'Animal Profile',
  healthTaskDetail: 'Task Details',
  settings: 'Settings',
  reports: 'Farm Performance',
};

function MainNavigator() {
  const {
    screen,
    selectedAnimalId,
    selectedTaskId,
    operationsTab,
    goBack,
    hydrated,
    isNotificationsOpen,
    setIsNotificationsOpen,
  } = useApp();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  // Android hardware / gesture back: close the alerts sheet, then pop the stack, then exit
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isNotificationsOpen) {
        setIsNotificationsOpen(false);
        return true;
      }
      return goBack();
    });
    return () => sub.remove();
  }, [goBack, isNotificationsOpen, setIsNotificationsOpen]);

  if (!hydrated) return null;

  const isTabScreen = TAB_SCREENS.includes(screen);
  // Home draws its green header up behind the status bar, so it handles the top inset itself
  const fullBleedTop = screen === 'home';
  const headerTitle =
    screen === 'operationsSection' ? operationsSectionTitles[operationsTab as OperationsSection] ?? 'Operations' : headerTitles[screen];

  return (
    <SafeAreaView
      style={styles.safeArea}
      // Tab screens let the tab bar own the bottom inset; stacked screens pad it here
      edges={[...(fullBleedTop ? [] : (['top'] as const)), 'left', 'right', ...(isTabScreen ? [] : (['bottom'] as const))]}
    >
      <StatusBar style={fullBleedTop ? 'light' : 'dark'} />
      {headerTitle && (
        <NativeHeader title={headerTitle} showBack showNotifications={false} showProfile={false} />
      )}

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {screen === 'home' && <HomeScreen />}
        {screen === 'livestock' && <LivestockScreen />}
        {screen === 'addAnimal' && <AddAnimalScreen />}
        {/* Keyed so jumping between animals (e.g. dam → calf) starts fresh */}
        {screen === 'animalProfile' && <AnimalProfileScreen key={selectedAnimalId ?? 'none'} />}
        {screen === 'health' && <HealthScreen />}
        {screen === 'healthTaskDetail' && <HealthTaskDetailScreen key={selectedTaskId ?? 'none'} />}
        {screen === 'operations' && <OperationsScreen />}
        {screen === 'operationsSection' && <OperationsSectionScreen key={operationsTab} />}
        {screen === 'reports' && <ReportsScreen />}
        {screen === 'settings' && <SettingsScreen />}
      </KeyboardAvoidingView>

      {isTabScreen && <NativeTabBar />}

      <NativeNotificationCenter />
      <AppToast topOffset={(fullBleedTop ? insets.top : 0) + 12} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppProvider>
        <MainNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.charcoal50,
  },
  content: {
    flex: 1,
  },
  toastContainer: {
    pointerEvents: 'none',
    position: 'absolute',
    left: 20,
    right: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 9999,
  },
  toastText: {
    color: colors.white,
    fontSize: font.body,
    fontWeight: weight.semibold,
    textAlign: 'center',
  },
});
