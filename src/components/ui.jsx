import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme.js';

export function Button({ label, onPress, variant = 'primary', disabled = false, loading = false, icon }) {
  const light = variant === 'primary' || variant === 'danger';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }} disabled={disabled || loading} onPress={onPress}
      style={({ pressed }) => [styles.button,
        variant === 'primary' && { backgroundColor: colors.ink, borderColor: colors.ink },
        variant === 'secondary' && { backgroundColor: colors.paper, borderColor: colors.border },
        variant === 'danger' && { backgroundColor: colors.danger, borderColor: colors.danger },
        (disabled || loading) && { opacity: 0.5 }, pressed && { opacity: 0.75 }]}>
      {loading ? <ActivityIndicator size="small" color={light ? '#FFF' : colors.ink} /> :
        icon ? <Ionicons name={icon} size={17} color={light ? '#FFF' : colors.ink} /> : null}
      <Text style={[styles.buttonText, { color: light ? '#FFF' : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ name, label, onPress, disabled = false }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.iconButton, disabled && { opacity: 0.4 }, pressed && { backgroundColor: colors.surface }]}>
    <Ionicons name={name} size={21} color={colors.ink} />
  </Pressable>;
}

export function Chip({ label, selected = false, onPress }) {
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityState={{ selected }} aria-pressed={selected}
    onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && { opacity: 0.7 }]}>
    <Text style={[styles.chipText, selected && { color: colors.paper }]}>{label}</Text>
  </Pressable>;
}

export function Cover({ uri, title, width = 108, height = 156 }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  return <View style={[styles.cover, { width, height }]}>
    {uri && !failed ? <Image source={{ uri }} accessibilityLabel={title + ' cover'} resizeMode="cover"
      style={{ width: '100%', height: '100%' }} onError={() => setFailed(true)} /> :
      <View style={styles.coverFallback}><Ionicons name="book-outline" size={28} color={colors.muted} />
        <Text numberOfLines={3} style={styles.coverLabel}>{title}</Text></View>}
  </View>;
}

export function Notice({ title, message, actionLabel, onAction, tone = 'info' }) {
  return <View accessibilityLiveRegion="polite" style={[styles.notice, tone === 'error' && { borderLeftColor: colors.danger, backgroundColor: colors.surface }]}>
    <Ionicons name={tone === 'error' ? 'alert-circle-outline' : 'information-circle-outline'} size={21} color={tone === 'error' ? colors.danger : colors.accent} />
    <View style={{ flex: 1, gap: 7 }}><Text style={styles.noticeTitle}>{title}</Text><Text style={styles.body}>{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}</View>
  </View>;
}

export function SectionHeading({ title, subtitle, action, onAction }) {
  return <View style={styles.sectionRow}><View style={{ flex: 1, gap: 5 }}>
    <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
    {subtitle ? <Text style={styles.body}>{subtitle}</Text> : null}</View>
    {action && onAction ? <Button label={action} onPress={onAction} variant="ghost" /> : null}</View>;
}

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return <View style={{ gap: 10 }}>
    {(eyebrow || action) && <View style={styles.pageTop}><Text style={styles.eyebrow}>{eyebrow}</Text>{action}</View>}
    <Text accessibilityRole="header" style={styles.pageTitle}>{title}</Text>
    {subtitle ? <Text style={styles.body}>{subtitle}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  button: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, borderWidth: 1, borderColor: 'transparent', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 14, lineHeight: 20, fontFamily: fonts.semibold, flexShrink: 1, textAlign: 'center' },
  iconButton: { minWidth: 44, minHeight: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  chip: { minHeight: 44, borderRadius: 5, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', backgroundColor: colors.paper },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, lineHeight: 20, color: colors.ink, fontFamily: fonts.medium },
  cover: { borderRadius: 4, overflow: 'hidden', backgroundColor: colors.surface },
  coverFallback: { flex: 1, padding: 12, justifyContent: 'center', alignItems: 'center', gap: 12 },
  coverLabel: { color: colors.muted, textAlign: 'center', fontFamily: fonts.medium, fontSize: 12 },
  notice: { padding: 16, borderLeftWidth: 2, borderLeftColor: colors.accent, borderRadius: 4, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noticeTitle: { fontSize: 14, fontFamily: fonts.semibold, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.muted },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontFamily: fonts.semibold, letterSpacing: -0.3 },
  pageTop: { minHeight: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 14 },
  eyebrow: { fontSize: 14, fontFamily: fonts.semibold, color: colors.muted },
  pageTitle: { fontSize: 32, lineHeight: 40, fontFamily: fonts.semibold, letterSpacing: -0.6, color: colors.ink },
});
