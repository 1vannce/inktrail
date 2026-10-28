import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createTrackerApi } from "../api/tracker.js";
import { getErrorMessage } from "../api/http.js";
import { isLegacyDemoUrl, normalizeBaseUrl } from "../config.js";
import { useConnection } from "../providers/ConnectionProvider.jsx";
import { Button, IconButton, Notice, PageHeader } from "../components/ui.jsx";
import { colors, fonts } from "../theme.js";

export default function ConnectionScreen() {
  const connection = useConnection();
  const [value, setValue] = useState(connection.baseUrl);
  const [edited, setEdited] = useState(false);
  useEffect(() => {if (connection.isReady && !edited) setValue(connection.baseUrl);}, [connection.baseUrl, connection.isReady, edited]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function connect() {
    setError('');setSuccess('');setBusy(true);
    try {
      const baseUrl = normalizeBaseUrl(value);
      if (!baseUrl) throw new Error('Enter your tracker endpoint first.');
      const api = createTrackerApi(baseUrl);
      await Promise.all([api.listEntries(), api.listLists()]);
      await connection.setBaseUrl(baseUrl);
      setSuccess('Connected. Your reading library is ready.');
    } catch (cause) {setError(getErrorMessage(cause));} finally {setBusy(false);}
  }
  async function disconnect() {
    setBusy(true);setError('');setSuccess('');
    try {await connection.setBaseUrl('');setValue('');setSuccess('Disconnected. Your saved titles remain on the service.');}
    catch (cause) {setError(getErrorMessage(cause));} finally {setBusy(false);}
  }
  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.top}><IconButton name="arrow-back" label="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
        <Text style={styles.brand}>inktrail / settings</Text><Ionicons name="cloud-outline" size={23} color={colors.accent} /></View>
      <PageHeader title="Tracker connection" subtitle="Discover titles freely. Connect a dedicated tracker endpoint to keep your reading progress across sessions." />
      <View style={styles.card}>
        <Text style={styles.heading}>Connection settings</Text>
        <Text style={styles.body}>Use your MockAPI project's base URL, including its API prefix. The endpoint needs two collections: entries and lists.</Text>
        {isLegacyDemoUrl(connection.baseUrl) ? <Notice title="Move your demo library" message="The public Beeceptor demo may expire around November 10, 2026. Back up its entries and lists, then connect your own MockAPI project. Switching URLs does not copy records." /> : null}
        <Text style={styles.label}>API BASE URL</Text>
        <TextInput accessibilityLabel="Tracker API base URL" value={value} onChangeText={(text) => {setEdited(true);setValue(text);}} editable={!busy && connection.isReady}
          placeholder="https://your-project.mockapi.io/api/v1" placeholderTextColor={colors.muted}
          autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.input} />
        {connection.defaultUrl && connection.defaultUrl !== value ? <Button label="Use configured default URL" variant="secondary" disabled={busy || !connection.isReady} onPress={() => {
          setEdited(true);setValue(connection.defaultUrl);setError('');setSuccess('');
        }} /> : null}
        {error ? <Notice title="Could not connect" message={error} tone="error" /> : null}
        {connection.storageError ? <Notice title="Connection preference" message={connection.storageError} tone="error" /> : null}
        {success ? <Notice title="Connection updated" message={success} /> : null}
        <Button label="Test & connect" disabled={!connection.isReady} loading={busy} onPress={connect} icon="link-outline" />
        {connection.isConfigured ? <Button label="Disconnect" onPress={disconnect} disabled={busy} variant="ghost" /> : null}
        {success && connection.isConfigured ? <Button label="Open my library" variant="secondary" onPress={() => router.replace('/(tabs)/library')} /> : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Set up your MockAPI tracker</Text>
        <Text style={styles.body}>Create an account-owned MockAPI project with entries and lists resources, then copy its base URL above. The field setup and migration steps are in docs/API_SETUP.md. Changing the connection does not transfer your library.</Text>
        <Button label="Open MockAPI" variant="secondary" icon="open-outline" onPress={() => void Linking.openURL('https://mockapi.io/')} />
      </View>
      <Text style={styles.footnote}>Public mock services are for demos. Anyone with the endpoint may access or edit its data. Use sample reading data and a dedicated endpoint; never enter secret API keys here.</Text>
    </ScrollView></KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 24, gap: 26, width: '100%', maxWidth: 680, alignSelf: 'center', paddingBottom: 50 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, brand: { fontSize: 13, fontFamily: fonts.medium, color: colors.muted },
  card: { backgroundColor: colors.paper, padding: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.border, gap: 16 },
  heading: { fontSize: 19, fontFamily: fonts.bold, color: colors.ink }, body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 23, color: colors.muted },
  label: { fontSize: 11, letterSpacing: 0.6, color: colors.muted, fontFamily: fonts.semibold },
  input: { fontFamily: fonts.regular, backgroundColor: colors.background, padding: 15, minHeight: 50, borderRadius: 6, borderColor: colors.border, borderWidth: 1, fontSize: 16, color: colors.ink },
  footnote: { fontFamily: fonts.regular, color: colors.muted, fontSize: 12, lineHeight: 20 }
});
