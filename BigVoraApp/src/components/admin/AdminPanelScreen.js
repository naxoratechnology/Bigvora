import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';

export default function AdminPanelScreen({
  title,
  subtitle,
  actionLabel,
  items,
  searchPlaceholder,
  onAdd,
  onBack,
  onItemPress,
  onRefresh,
  loading = false,
  error = '',
}) {
  const [query, setQuery] = useState('');
  const visibleItems = useMemo(
    () =>
      items.filter(item =>
        `${item.title} ${item.subtitle} ${item.meta}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [items, query],
  );
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {onBack && (
          <Pressable onPress={onBack} style={styles.back}>
            <Ionicons name="arrow-back" size={21} color={colors.primary} />
          </Pressable>
        )}
        <View style={onBack && styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {onAdd && (
          <Pressable onPress={onAdd} style={styles.add}>
            <Ionicons name="add" size={22} color={colors.background} />
            <Text style={styles.addText}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.search}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <Ionicons name="options-outline" size={20} color={colors.primary} />
      </View>
      <ScrollView
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          ) : undefined
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {loading && <Text style={styles.emptyText}>Loading...</Text>}
        {Boolean(error) && (
          <Pressable onPress={onRefresh}>
            <Text style={styles.emptyText}>{error} Tap to retry.</Text>
          </Pressable>
        )}
        {visibleItems.map(item => (
          <Pressable
            key={item.id || item.title}
            onPress={() => onItemPress?.(item)}
            style={styles.card}
          >
            <View
              style={[styles.icon, { backgroundColor: item.tone || '#FFF0E8' }]}
            >
              <Ionicons name={item.icon} size={23} color={colors.primary} />
            </View>
            <View style={styles.copy}>
              <Text numberOfLines={1} style={styles.itemTitle}>
                {item.title}
              </Text>
              <Text numberOfLines={1} style={styles.itemSubtitle}>
                {item.subtitle}
              </Text>
              <Text style={styles.meta}>{item.meta}</Text>
            </View>
            <View style={styles.trailing}>
              <View
                style={[
                  styles.badge,
                  (item.status === 'Active' || item.status === 'Delivered') &&
                    styles.successBadge,
                ]}
              >
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </View>
          </Pressable>
        ))}
        {!loading && !error && visibleItems.length === 0 && (
          <View style={styles.empty}>
            <Ionicons
              name="search-outline"
              size={38}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>Try a different search term.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 17,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    borderRadius: 13,
    backgroundColor: colors.background,
  },
  headerCopy: { flex: 1 },
  title: { color: colors.primary, fontSize: 26, fontWeight: '800' },
  subtitle: { marginTop: 3, color: colors.textMuted, fontSize: 11 },
  add: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: colors.accent,
  },
  addText: {
    marginLeft: 4,
    color: colors.background,
    fontSize: 11,
    fontWeight: '800',
  },
  search: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  input: { flex: 1, marginHorizontal: 10, color: colors.text, fontSize: 13 },
  list: { padding: 20, paddingTop: 14, paddingBottom: 110 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  copy: { flex: 1, marginLeft: 12 },
  itemTitle: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  itemSubtitle: { marginTop: 3, color: colors.textMuted, fontSize: 10 },
  meta: { marginTop: 6, color: colors.accent, fontSize: 10, fontWeight: '700' },
  trailing: { alignItems: 'flex-end', gap: 10 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFF0E8',
  },
  successBadge: { backgroundColor: '#EAF7F1' },
  badgeText: { color: colors.primary, fontSize: 8, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 70 },
  emptyTitle: {
    marginTop: 14,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: { marginTop: 5, color: colors.textMuted, fontSize: 11 },
});
