import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  category: 'Transaction' | 'Security' | 'Card';
  icon: string;
  read: boolean;
};

const STORAGE_KEY = 'finova-notifications-v1';

const initialNotifications: NotificationItem[] = [
  {
    id: 'welcome',
    title: 'Welcome to Finova',
    message: 'Your financial activity is organised in one place.',
    time: 'Just now',
    category: 'Security',
    icon: '✦',
    read: false,
  },
  {
    id: 'card',
    title: 'Card controls are ready',
    message: 'You can lock or reactivate your virtual card from My Cards.',
    time: 'Today',
    category: 'Card',
    icon: '▤',
    read: false,
  },
  {
    id: 'activity',
    title: 'Track every transaction',
    message: 'Visit Activity to review income, spending and transfers.',
    time: 'Today',
    category: 'Transaction',
    icon: '↔',
    read: false,
  },
];

const filters = ['All', 'Unread', 'Transactions', 'Security', 'Cards'] as const;
type Filter = (typeof filters)[number];

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : null;

        if (
          active &&
          Array.isArray(parsed) &&
          parsed.every(
            (item) =>
              item &&
              typeof item.id === 'string' &&
              typeof item.title === 'string' &&
              typeof item.read === 'boolean',
          )
        ) {
          setItems(parsed);
        } else if (active) {
          setItems(initialNotifications);
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(initialNotifications),
          );
        }
      } catch {
        if (active) setItems(initialNotifications);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  const saveItems = useCallback(async (next: NotificationItem[]) => {
    setItems(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Keep the current screen usable if local storage is unavailable.
    }
  }, []);

  const unreadCount = items.filter((item) => !item.read).length;

  const visibleItems = items.filter((item) => {
    if (filter === 'Unread') return !item.read;
    if (filter === 'Transactions') return item.category === 'Transaction';
    if (filter === 'Security') return item.category === 'Security';
    if (filter === 'Cards') return item.category === 'Card';
    return true;
  });

  function markAllRead() {
    void saveItems(items.map((item) => ({ ...item, read: true })));
  }

  function markRead(id: string) {
    void saveItems(
      items.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>YOUR INBOX</Text>
            <Text style={styles.title}>Notifications</Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>{unreadCount}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Text style={styles.summarySymbol}>♧</Text>
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>
              {unreadCount === 0
                ? 'You’re all caught up'
                : `${unreadCount} unread ${unreadCount === 1 ? 'update' : 'updates'}`}
            </Text>
            <Text style={styles.summaryDescription}>
              Important updates about your Finova activity.
            </Text>
          </View>
        </View>

        <View style={styles.toolbar}>
          <Text style={styles.sectionTitle}>Recent updates</Text>
          {unreadCount > 0 && (
            <Pressable onPress={markAllRead} accessibilityRole="button">
              <Text style={styles.markAll}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((item) => {
            const selected = item === filter;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setFilter(item)}
                style={[styles.filter, selected && styles.filterSelected]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={styles.loader}
            size="large"
          />
        ) : visibleItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>Nothing to see here</Text>
            <Text style={styles.emptyText}>
              New updates will appear here when available.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleItems.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.read ? 'Read' : 'Unread'}`}
                onPress={() => markRead(item.id)}
                style={[styles.notification, !item.read && styles.unreadItem]}
              >
                <View style={styles.notificationIcon}>
                  <Text style={styles.notificationSymbol}>{item.icon}</Text>
                </View>

                <View style={styles.notificationCopy}>
                  <View style={styles.notificationHeading}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notificationMessage}>
                    {item.message}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.category}>{item.category}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.footer}>
          Notifications are stored on this device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.text, fontSize: 34, lineHeight: 38 },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  title: { color: colors.text, fontSize: 25, fontWeight: '800' },
  countBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summarySymbol: { color: colors.primary, fontSize: 26 },
  summaryCopy: { flex: 1 },
  summaryTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  summaryDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  markAll: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  filters: { gap: spacing.sm, paddingBottom: spacing.lg },
  filter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  filterTextSelected: { color: colors.text },
  loader: { marginTop: spacing.xxl },
  list: { gap: spacing.md },
  notification: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  unreadItem: { borderColor: '#494078' },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationSymbol: { color: colors.primary, fontSize: 21, fontWeight: '700' },
  notificationCopy: { flex: 1 },
  notificationHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  notificationTitle: { color: colors.text, fontSize: 14, fontWeight: '800', flex: 1 },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  notificationMessage: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  category: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  time: { color: colors.textSecondary, fontSize: 10 },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyIcon: { color: colors.success, fontSize: 32, marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footer: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
