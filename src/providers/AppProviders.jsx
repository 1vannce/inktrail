import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import { useFonts } from 'expo-font';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConnectionProvider } from "./ConnectionProvider.jsx";
import { colors } from '../theme.js';
export function AppProviders({ children }) {
  const [fontsLoaded, fontError] = useFonts({
    'Geist-Regular': require('../../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('../../assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('../../assets/fonts/Geist-SemiBold.ttf'),
    'Geist-Bold': require('../../assets/fonts/Geist-Bold.ttf'),
  });
  const [client] = useState(() => new QueryClient({ defaultOptions: {
      queries: { staleTime: 60_000, gcTime: 15 * 60_000, retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false }
    } }));
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const listener = AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
    return () => listener.remove();
  }, []);
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator accessibilityLabel="Loading InkTrail" color={colors.ink} />
    </View>;
  }
  return <SafeAreaProvider><QueryClientProvider client={client}><ConnectionProvider>{children}</ConnectionProvider></QueryClientProvider></SafeAreaProvider>;
}
