import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from "../../src/theme.js";
export default function TabLayout() {
  const { bottom } = useSafeAreaInsets();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.ink, tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.border, height: 64 + Math.max(bottom, 12), paddingTop: 8, paddingBottom: Math.max(bottom, 12) },
    tabBarLabelStyle: { fontSize: 12, lineHeight: 16, flexShrink: 0, fontFamily: fonts.medium, marginTop: 3 }, sceneStyle: { backgroundColor: colors.background } }}>
    <Tabs.Screen name="index" options={{ title: 'Discover', tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="library" options={{ title: 'My library', tabBarIcon: ({ color, size }) => <Ionicons name="bookmarks-outline" color={color} size={size} /> }} />
  </Tabs>;
}
