import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Cover, IconButton, Notice } from '../components/ui.jsx';
import { useCatalog } from '../hooks/useCatalog.js';
import { colors, fonts } from '../theme.js';

const FORMATS = [
  { value: 'all', label: 'All titles' },
  { value: 'manga', label: 'Manga' },
  { value: 'manhwa', label: 'Manhwa' },
];
const GENRES = [
  { value: '', label: 'All genres' },
  { value: 'action', label: 'Action' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'drama', label: 'Drama' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'romance', label: 'Romance' },
  { value: 'slice-of-life', label: 'Slice of life' },
  { value: 'sports', label: 'Sports' },
  { value: 'supernatural', label: 'Supernatural' },
];

function FeaturedTitle({ manga }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Explore ${manga.title}`}
      onPress={() => router.push(`/title/${manga.id}`)}
      style={({ pressed }) => [styles.feature, pressed && styles.pressed]}>
      <Cover uri={manga.imageUrl} title={manga.title} width={72} height={102} />
      <View style={styles.featureCopy}>
        <Text style={styles.featureLabel}>POPULAR NOW</Text>
        <Text numberOfLines={2} style={styles.featureTitle}>{manga.title}</Text>
        <Text numberOfLines={1} style={styles.meta}>{[manga.type, ...manga.genres.slice(0, 2)].filter(Boolean).join(' · ')}</Text>
        <Text style={styles.featureLink}>View details</Text>
      </View>
      <Ionicons name="arrow-forward-outline" size={19} color={colors.muted} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [format, setFormat] = useState('all');
  const [genre, setGenre] = useState('');
  const [genresOpen, setGenresOpen] = useState(true);
  const catalog = useCatalog(debouncedQuery, format, genre);
  const columns = width >= 1000 ? 5 : width >= 760 ? 4 : width >= 540 ? 3 : 2;
  const gutter = width < 540 ? 20 : 32;
  const gap = width < 540 ? 16 : 24;
  const cardWidth = (Math.min(width, 1120) - gutter * 2 - (columns - 1) * gap) / columns;
  const isSearching = debouncedQuery.length > 0;
  const hasFilters = Boolean(query || genre || format !== 'all');
  const genreLabel = GENRES.find(item => item.value === genre)?.label;

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 500);
    return () => clearTimeout(timeout);
  }, [query]);

  const titles = useMemo(() => {
    const seen = new Set();
    return (catalog.data?.pages.flatMap(page => page.items) ?? []).filter(manga => {
      if (seen.has(manga.id)) return false;
      seen.add(manga.id);
      return true;
    });
  }, [catalog.data]);
  const featured = !isSearching && !genre ? titles[0] : undefined;
  const gridTitles = featured ? titles.slice(1) : titles;

  function clearFilters() {
    setQuery('');
    setDebouncedQuery('');
    setFormat('all');
    setGenre('');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList key={columns} data={gridTitles} numColumns={columns} keyExtractor={item => String(item.id)}
        contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]} columnWrapperStyle={{ gap, alignItems: 'flex-start' }}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.topbar}>
              <View style={styles.brand}>
                <Image source={require('../../assets/branding/panelpaw-icon.png')} accessibilityLabel="PanelPaw logo" style={{ width: 38, height: 38 }} />
                <Text style={styles.wordmark}>PanelPaw</Text>
              </View>
              <IconButton name="options-outline" label="Configure tracker connection" onPress={() => router.push('/connection')} />
            </View>
            <View style={styles.intro}>
              <Text accessibilityRole="header" style={styles.heading}>Discover</Text>
              <Text style={styles.subtitle}>Manga and manhwa, ready for your reading list.</Text>
            </View>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color={colors.muted} />
              <TextInput accessibilityLabel="Search manga and manhwa" placeholder="Search by title"
                placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} returnKeyType="search"
                autoCapitalize="none" autoCorrect={false} onSubmitEditing={() => setDebouncedQuery(query.trim())} style={styles.searchInput} />
              {query.length > 0 && <IconButton name="close-outline" label="Clear search" onPress={() => { setQuery(''); setDebouncedQuery(''); }} />}
            </View>
            <View style={styles.filterBar}>
              <View style={styles.formats}>
                {FORMATS.map(item => (
                  <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: format === item.value }} aria-pressed={format === item.value}
                    onPress={() => setFormat(item.value)} style={[styles.formatButton, format === item.value && styles.formatSelected]}>
                    <Text style={[styles.formatText, format === item.value && styles.formatTextSelected]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Genres" accessibilityState={{ expanded: genresOpen }} aria-expanded={genresOpen}
                onPress={() => setGenresOpen(!genresOpen)} style={styles.genreToggle}>
                <Text style={styles.formatTextSelected}>{genre ? genreLabel : 'Genres'}</Text>
                <Ionicons name={genresOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={14} color={colors.ink} />
              </Pressable>
            </View>
            {genresOpen && <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.genres}>
              {GENRES.map(item => <Chip key={item.value} label={item.label} selected={genre === item.value} onPress={() => setGenre(item.value)} />)}
            </ScrollView>}
            {hasFilters && <View style={styles.filterSummary}>
              <Text style={styles.meta}>{[format === 'all' ? 'Manga & manhwa' : format === 'manga' ? 'Manga' : 'Manhwa', genre ? genreLabel : 'All genres'].join(' / ')}</Text>
              <Pressable accessibilityRole="button" onPress={clearFilters} style={styles.clearFilters}>
                <Text style={styles.clearText}>Clear filters</Text>
              </Pressable>
            </View>}
            {featured && <FeaturedTitle manga={featured} />}
            <View style={styles.catalogHeading}>
              <View style={{ flex: 1, gap: 5 }}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>{isSearching ? 'Search results' : genre ? `${genreLabel} titles` : 'Browse titles'}</Text>
                {isSearching && <Text style={styles.meta}>Results for “{debouncedQuery}”{genre ? ` in ${genreLabel}` : ''}</Text>}
              </View>
              {catalog.isFetching && !catalog.isPending && <ActivityIndicator accessibilityLabel="Refreshing catalog" color={colors.accent} />}
            </View>
            {catalog.isError && <View style={styles.notice}>
              <Notice title="Could not load titles" message={catalog.error.message} actionLabel="Try again" onAction={() => void catalog.refetch()} tone="error" />
            </View>}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.type}${item.score ? `, rated ${item.score.toFixed(1)} out of 10` : ''}. View details`}
            onPress={() => router.push(`/title/${item.id}`)}
            style={({ pressed }) => [styles.catalogCard, { width: cardWidth }, pressed && styles.pressed]}>
            <Cover uri={item.imageUrl} title={item.title} width={cardWidth} height={Math.round(cardWidth * 1.42)} />
            <View style={styles.cardMeta}>
              <Text style={styles.meta}>{item.type || 'Manga'}</Text>
              {item.score !== null && <View style={styles.score}><Ionicons name="star-outline" color={colors.muted} size={12} /><Text style={styles.meta}>{item.score.toFixed(1)}</Text></View>}
            </View>
            <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
            <Text numberOfLines={1} style={styles.cardGenres}>{item.genres.slice(0, 2).join(' · ')}</Text>
          </Pressable>
        )}
        ListEmptyComponent={catalog.isPending ? (
          <View style={styles.empty}><ActivityIndicator color={colors.accent} /><Text style={styles.subtitle}>Loading titles…</Text></View>
        ) : !catalog.isError && !featured ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={28} color={colors.muted} />
            <Text style={styles.sectionTitle}>No titles found</Text>
            <Text style={styles.emptyText}>Try another title, format, or genre.</Text>
            <Button label="Clear filters" variant="secondary" onPress={clearFilters} />
          </View>
        ) : null}
        ListFooterComponent={<View style={styles.footer}>
          {catalog.hasNextPage && <Button label="Load more titles" variant="secondary" icon="arrow-down-outline" loading={catalog.isFetchingNextPage} onPress={() => void catalog.fetchNextPage()} />}
          <Text style={styles.attribution}>Catalog by Kitsu</Text>
        </View>} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingBottom: 24 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontSize: 25, fontFamily: fonts.bold, letterSpacing: -0.8, color: colors.ink },
  intro: { paddingTop: 30, paddingBottom: 22, gap: 8 },
  heading: { fontSize: 36, lineHeight: 44, letterSpacing: -1.1, fontFamily: fonts.semibold, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, lineHeight: 22 },
  searchBox: { minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingLeft: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paper, gap: 10 },
  searchInput: { fontFamily: fonts.regular, flex: 1, minWidth: 0, paddingVertical: 14, paddingRight: 10, color: colors.ink, fontSize: 16 },
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: 12, gap: 8, flexWrap: 'wrap' },
  formats: { flexDirection: 'row', gap: 20 },
  formatButton: { minHeight: 48, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  formatSelected: { borderBottomColor: colors.ink },
  formatText: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  formatTextSelected: { fontSize: 13, color: colors.ink, fontFamily: fonts.semibold },
  genreToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48 },
  genres: { gap: 8, paddingVertical: 16, paddingRight: 4 },
  filterSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  clearFilters: { minHeight: 44, justifyContent: 'center' },
  clearText: { fontFamily: fonts.regular, fontSize: 12, color: colors.accent, textDecorationLine: 'underline' },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  featureCopy: { flex: 1, gap: 6 },
  featureLabel: { fontSize: 10, letterSpacing: 1, fontFamily: fonts.semibold, color: colors.muted },
  featureTitle: { fontSize: 20, lineHeight: 28, fontFamily: fonts.semibold, color: colors.ink },
  featureLink: { fontFamily: fonts.regular, fontSize: 12, color: colors.accent, marginTop: 3 },
  catalogHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, paddingBottom: 20, gap: 12 },
  sectionTitle: { fontSize: 20, fontFamily: fonts.semibold, color: colors.ink },
  catalogCard: { marginBottom: 28 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, lineHeight: 18 },
  score: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardTitle: { color: colors.ink, fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  cardGenres: { fontFamily: fonts.regular, color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  notice: { marginBottom: 20 },
  empty: { paddingVertical: 48, alignItems: 'center', gap: 14, paddingHorizontal: 12 },
  emptyText: { fontFamily: fonts.regular, color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  footer: { alignItems: 'center', gap: 24, paddingVertical: 16 },
  attribution: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  pressed: { opacity: 0.7 },
});
