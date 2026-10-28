import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Cover, IconButton, Notice, SectionHeading } from "../components/ui.jsx";
import { useTitle } from "../hooks/useCatalog.js";
import { useEntries, useLists, useTrackerMutations } from "../hooks/useTracker.js";
import { useConnection } from "../providers/ConnectionProvider.jsx";
import { colors, fonts } from "../theme.js";
import { READING_STATUSES, STATUS_LABELS } from "../types.js";


export default function TitleDetailsScreen() {
  const params = useLocalSearchParams();
  const id = Number(params.id);
  const { width } = useWindowDimensions();
  const connection = useConnection();
  const title = useTitle(id);
  const entries = useEntries();
  const lists = useLists();
  const { addEntry, updateEntry } = useTrackerMutations();
  const manga = title.data;
  const entry = entries.data?.find((item) => item.mangaId === id);
  const [status, setStatus] = useState('planned');
  const [progress, setProgress] = useState('0');
  const [listId, setListId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [linkError, setLinkError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const pending = addEntry.isPending || updateEntry.isPending;

  useEffect(() => {
    setStatus(entry?.status ?? 'planned');
    setProgress(String(entry?.progress ?? 0));
    setListId(entry?.listId ?? null);
    setDirty(false);
  }, [entry?.id, entry?.updatedAt, id, connection.baseUrl]);

  function changed() {
    setDirty(true);
    setMessage('');
    setError('');
  }
  function chooseStatus(next) {
    changed();
    setStatus(next);
    if (next === 'completed' && manga?.chapters) setProgress(String(manga.chapters));
  }
  function stepProgress(amount) {
    changed();
    const current = Number(progress);
    const next = Math.max(0, (Number.isSafeInteger(current) ? current : 0) + amount);
    setProgress(String(manga?.chapters ? Math.min(next, manga.chapters) : next));
  }
  async function save() {
    if (!manga || pending) return;
    setError('');
    setMessage('');
    if (!/^\d+$/.test(progress.trim()) || !Number.isSafeInteger(Number(progress))) {
      setError('Enter a whole chapter number, starting at zero.');
      return;
    }
    const chapter = Number(progress);
    if (manga.chapters && chapter > manga.chapters) {
      setError(`This title has ${manga.chapters} chapters. Choose a chapter within that range.`);
      return;
    }
    try {
      const changes = { status, progress: chapter, listId };
      if (entry) await updateEntry.mutateAsync({ entry, changes });else
      await addEntry.mutateAsync({ manga, ...changes });
      setDirty(false);
      setMessage(entry ? 'Your reading progress is saved.' : 'Title saved to your library.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your changes could not be saved. Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.navigation}>
            <IconButton name="arrow-back-outline" label="Back to discovery" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
            <Text style={styles.navLabel}>Title details</Text>
            <IconButton name="bookmarks-outline" label="Open my library" onPress={() => router.push('/(tabs)/library')} />
          </View>
          {title.isPending && <View style={styles.loading}><ActivityIndicator color={colors.accent} size="large" /><Text style={styles.body}>Loading title…</Text></View>}
          {title.isError && <Notice title="This story could not be opened" message={title.error.message} actionLabel="Try again" onAction={() => {void title.refetch();}} tone="error" />}
          {manga &&
          <>
              <View style={{ flexDirection: 'row', gap: width >= 540 ? 28 : 18 }}>
              <View style={styles.titleHero}>

                <View style={styles.cover}>
                  <Cover uri={manga.imageUrl} title={manga.title} width={width < 540 ? 110 : 164} height={width < 540 ? 160 : 235} />
                </View>
                <View style={styles.heroType}><Text style={styles.heroTypeText}>{manga.type || 'Manga'}</Text></View>
              </View>
              <View style={styles.titleBlock}>
                <Text accessibilityRole="header" style={[styles.title, width < 540 && { fontSize: 23, lineHeight: 29 }]}>{manga.title}</Text>
                {manga.originalTitle && manga.originalTitle !== manga.title && <Text style={styles.originalTitle}>{manga.originalTitle}</Text>}
                <Text style={styles.author}>{manga.authors.length ? `By ${manga.authors.join(', ')}` : manga.type}</Text>
              </View>
              </View>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <View style={styles.statValueRow}><Ionicons name="star" color={colors.ink} size={16} /><Text style={styles.statValue}>{manga.score?.toFixed(1) ?? '—'}</Text></View>
                  <Text style={styles.statLabel}>RATING</Text>
                </View>
                <View style={[styles.stat, styles.statMiddle]}><Text style={styles.statValue}>{manga.chapters ?? '—'}</Text><Text style={styles.statLabel}>CHAPTERS</Text></View>
                <View style={styles.stat}><Text numberOfLines={2} style={[styles.statValue, styles.publication]}>{manga.status || 'Unknown'}</Text><Text style={styles.statLabel}>PUBLICATION</Text></View>
              </View>
              {manga.genres.length > 0 && <View style={styles.genres}>{manga.genres.map((genre) => <View key={genre} style={styles.genre}><Text style={styles.genreText}>{genre}</Text></View>)}</View>}
              <View style={styles.section}>
                <SectionHeading title="Synopsis" />
                <Text numberOfLines={expanded ? undefined : 5} style={styles.synopsis}>{manga.synopsis || 'A synopsis is not available for this title yet.'}</Text>
                {manga.synopsis.length > 320 && <Pressable accessibilityRole="button" onPress={() => setExpanded(!expanded)} style={styles.readMore}>
                  <Text style={styles.linkText}>{expanded ? 'Read less' : 'Read more'}</Text><Ionicons name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={colors.accent} />
                </Pressable>}
              </View>
              <View style={styles.trackerCard}>
                <View style={styles.trackerHeading}>
                  <View style={styles.trackerIcon}><Ionicons name="bookmark-outline" size={23} color={colors.accent} /></View>
                  <View style={styles.flex}><Text style={styles.trackerTitle}>{entry ? 'Reading progress' : 'Add to your library'}</Text><Text style={styles.body}>Choose a status, chapter, and reading list.</Text></View>
                </View>
                {!connection.isReady ? <ActivityIndicator color={colors.accent} /> : !connection.isConfigured ?
              <Notice title="Connect your tracker" message="Connect your tracker to save this story and keep your place." actionLabel="Set up my tracker" onAction={() => router.push('/connection')} /> :

              <>
                    {entries.isPending && <View style={styles.inlineLoading}><ActivityIndicator color={colors.accent} /><Text style={styles.body}>Checking your library...</Text></View>}
                    {entries.isError && <Notice title="Your library could not be checked" message={entries.error.message} actionLabel="Retry library" onAction={() => {void entries.refetch();}} tone="error" />}
                    <Text style={styles.fieldLabel}>READING STATUS</Text>
                    <View style={styles.options}>{READING_STATUSES.map((value) => <Chip key={value} label={STATUS_LABELS[value]} selected={status === value} onPress={pending ? undefined : () => chooseStatus(value)} />)}</View>
                    <View style={styles.progressHeading}><Text style={styles.fieldLabel}>CHAPTER PROGRESS</Text><Text style={styles.total}>{manga.chapters ? `of ${manga.chapters} chapters` : 'Total chapters unknown'}</Text></View>
                    <View style={styles.stepper}>
                      <Pressable accessibilityRole="button" accessibilityLabel="Previous chapter" disabled={pending || Number(progress) <= 0} onPress={() => stepProgress(-1)} style={styles.stepButton}>
                        <Ionicons name="remove-outline" size={23} color={colors.accent} />
                      </Pressable>
                      <TextInput accessibilityLabel="Current chapter" value={progress} keyboardType="number-pad" inputMode="numeric" selectTextOnFocus editable={!pending} maxLength={7}
                  onChangeText={(value) => {changed();setProgress(value);}} style={styles.chapterInput} />
                      <Pressable accessibilityRole="button" accessibilityLabel="Next chapter" disabled={pending || manga.chapters !== null && Number(progress) >= manga.chapters} onPress={() => stepProgress(1)} style={styles.stepButton}>
                        <Ionicons name="add-outline" size={23} color={colors.accent} />
                      </Pressable>
                    </View>
                    <Text style={styles.fieldLabel}>READING LIST</Text>
                    {lists.isPending && <Text style={styles.body}>Loading your lists...</Text>}
                    {lists.isError && <Notice title="Reading lists are unavailable" message={lists.error.message} actionLabel="Retry lists" onAction={() => {void lists.refetch();}} tone="error" />}
                    <View style={styles.options}>
                      <Chip label="Unfiled" selected={listId === null} onPress={pending ? undefined : () => {changed();setListId(null);}} />
                      {lists.data?.map((list) => <Chip key={list.id} label={list.name} selected={listId === list.id} onPress={pending ? undefined : () => {changed();setListId(list.id);}} />)}
                    </View>
                    {lists.isSuccess && lists.data.length === 0 && <Text style={styles.hint}>Create reading lists in your library to organize your stories.</Text>}
                    {error.length > 0 && <Notice title="Could not save changes" message={error} tone="error" />}
                    {message.length > 0 && <Notice title="Saved to your library" message={message} actionLabel="Visit my library" onAction={() => router.push('/(tabs)/library')} />}
                    <Button label={entry ? 'Save progress' : 'Add to my library'} icon={entry ? 'checkmark-outline' : 'add-outline'}
                loading={pending} disabled={!entries.isSuccess || Boolean(entry) && !dirty} onPress={() => {void save();}} />
                    <Text style={styles.saveHint}>{entry ? 'Changes are saved to your connected tracker.' : 'You can update your progress from your library.'}</Text>
                  </>
              }
              </View>
              {manga.url ? <Button label="View on Kitsu" variant="ghost" icon="open-outline" onPress={() => {
              setLinkError('');
              void Linking.openURL(manga.url).catch(() => setLinkError('The source link could not be opened.'));
            }} /> : null}
              {linkError.length > 0 && <Notice title="Unable to open the source" message={linkError} tone="error" />}
              <Text style={styles.attribution}>Title information provided by Kitsu.</Text>
            </>
          }
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>);

}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 },
  content: { width: '100%', maxWidth: 740, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 36 },
  navigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginHorizontal: -8 },
  navLabel: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium },
  loading: { paddingVertical: 90, alignItems: 'center', gap: 20 },
  body: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, lineHeight: 22 },
  titleHero: { alignItems: 'flex-start', paddingVertical: 20, gap: 12 },

  cover: { borderRadius: 4, overflow: 'hidden' },
  heroType: { alignSelf: 'flex-start', paddingVertical: 4 },
  heroTypeText: { fontSize: 11, fontFamily: fonts.semibold, color: colors.accent, textTransform: 'uppercase', letterSpacing: 1.1 },
  titleBlock: { flex: 1, justifyContent: 'center', gap: 10, paddingVertical: 20 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 35, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  originalTitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, lineHeight: 20 },
  author: { fontFamily: fonts.regular, color: colors.muted, fontSize: 12, lineHeight: 19 },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 19 },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 6 },
  statMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  statValueRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  statValue: { fontVariant: ['tabular-nums'], fontSize: 20, fontFamily: fonts.bold, color: colors.ink, textAlign: 'center' },
  publication: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 }, statLabel: { fontSize: 10, letterSpacing: 0.8, color: colors.muted, fontFamily: fonts.semibold },
  genres: { flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginTop: 20 },
  genre: { backgroundColor: colors.surface, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  genreText: { fontFamily: fonts.regular, fontSize: 12, color: colors.accent },
  section: { paddingVertical: 26, gap: 15 },
  synopsis: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 24, color: colors.muted },
  readMore: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, marginTop: -9 },
  linkText: { fontSize: 13, color: colors.accent, fontFamily: fonts.semibold },
  trackerCard: { backgroundColor: colors.paper, padding: 21, borderWidth: 1, borderColor: colors.border, borderRadius: 6, gap: 17, marginBottom: 16 },
  trackerHeading: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingBottom: 5 },
  trackerIcon: { width: 44, height: 44, backgroundColor: colors.surface, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  trackerTitle: { fontSize: 19, lineHeight: 26, fontFamily: fonts.semibold, color: colors.ink },
  inlineLoading: { flexDirection: 'row', gap: 9, alignItems: 'center' },
  fieldLabel: { fontSize: 11, color: colors.muted, letterSpacing: 0.8, fontFamily: fonts.bold, marginTop: 6 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: -5 },
  progressHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  total: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.background },
  stepButton: { minWidth: 54, minHeight: 54, justifyContent: 'center', alignItems: 'center' },
  chapterInput: { fontVariant: ['tabular-nums'], flex: 1, minWidth: 0, color: colors.ink, fontSize: 23, fontFamily: fonts.semibold, textAlign: 'center', paddingVertical: 12 },
  hint: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, lineHeight: 18, marginTop: -6 },
  saveHint: { fontFamily: fonts.regular, color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: -6 },
  attribution: { fontFamily: fonts.regular, color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 10, lineHeight: 17 }
});
