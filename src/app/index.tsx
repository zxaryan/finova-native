import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionRow } from '@/features/dashboard/components/TransactionRow';
import {
  calculateBalance,
  calculateTotals,
  useTransactionStore,
} from '@/features/transactions/store/transaction-store';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadUnreadStatus() {
        try {
          const saved = await AsyncStorage.getItem('finova-notifications-v1');
          const items = saved ? JSON.parse(saved) : [];
          const unread = Array.isArray(items) && items.some(
            (item) => item && item.read === false
          );

          if (active) setHasUnreadNotifications(unread);
        } catch {
          if (active) setHasUnreadNotifications(false);
        }
      }

      void loadUnreadStatus();

      return () => {
        active = false;
      };
    }, [])
  );

  const displayedTransactions = useTransactionStore(
    (state) => state.transactions,
  );
  const balance = calculateBalance(displayedTransactions);
  const totals = calculateTotals(displayedTransactions);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>WELCOME BACK</Text>
            <Text style={styles.greeting}>Your money, in focus.</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              style={styles.notificationButton}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {hasUnreadNotifications && <View style={styles.notificationDot} />}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              style={styles.avatar}
              onPress={() => router.push('/profile')}
            >
              <Text style={styles.avatarText}>AP</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>

          </View>

          <Text style={styles.balance}>{formatCurrency(balance)}</Text>
          <Text style={styles.balanceCaption}>
            Your finances at a glance
          </Text>

          <View style={styles.balanceDivider} />

          <View style={styles.balanceFooter}>
            <View>
              <Text style={styles.smallLabel}>MONTHLY INCOME</Text>
              <Text style={styles.incomeValue}>+{formatCurrency(totals.income)}</Text>
            </View>

            <View>
              <Text style={styles.smallLabel}>MONTHLY SPENDING</Text>
              <Text style={styles.spendingValue}>−{formatCurrency(totals.expenses)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.actionsScroll}
          contentContainerStyle={styles.actions}
          nestedScrollEnabled
        >
          <Pressable style={styles.action} onPress={() => router.push('/transfer')}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionSymbol}>↗</Text>
            </View>
            <Text style={styles.actionLabel}>Transfer</Text>
          </Pressable>

          <Pressable style={styles.action} onPress={() => router.push('/deposit')}>
            <View style={styles.actionIcon}>
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Deposit</Text>
          </Pressable>

          <Pressable style={styles.action} onPress={() => router.push('/withdraw')}>
            <View style={styles.actionIcon}>
              <Ionicons name="remove-circle-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Withdraw</Text>
          </Pressable>

          <Pressable style={styles.action} onPress={() => router.push('/cards')}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionSymbol}>▤</Text>
            </View>
            <Text style={styles.actionLabel}>My cards</Text>
          </Pressable>

          <Pressable style={styles.action} onPress={() => router.push('/explore')}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionSymbol}>↔</Text>
            </View>
            <Text style={styles.actionLabel}>Activity</Text>
          </Pressable>

          <Pressable style={styles.action} onPress={() => router.push('/analytics')}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionSymbol}>⌁</Text>
            </View>
            <Text style={styles.actionLabel}>Analytics</Text>
          </Pressable>
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open savings goals"
          onPress={() => router.push('/goals')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginBottom: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.md,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 22 }}>◎</Text>
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
                Savings goals
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                Track targets and build savings habits
              </Text>
            </View>
          </View>
          <Text style={{ color: colors.primary, fontSize: 22 }}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open budgets"
          onPress={() => router.push('/budgets')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginBottom: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.md,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 22 }}>◷</Text>
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
                Budgets
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                Set monthly limits and track spending
              </Text>
            </View>
          </View>
          <Text style={{ color: colors.primary, fontSize: 22 }}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open scheduled payments"
          onPress={() => router.push('/scheduled-payments')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginBottom: spacing.xl,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.md,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 22 }}>▦</Text>
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
                Scheduled payments
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                Manage upcoming bills and subscriptions
              </Text>
            </View>
          </View>
          <Text style={{ color: colors.primary, fontSize: 22 }}>›</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <Text style={styles.sectionSubtitle}>
              Your latest transactions
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.seeAll}>See all →</Text>
          </Pressable>
        </View>

        <View style={styles.transactionCard}>
          {displayedTransactions.slice(0, 4).map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
            />
          ))}
        </View>

        <Text style={styles.disclaimer}>
          Your finances, all in one place
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionsScroll: {
    flexGrow: 0,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  greeting: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBell: {
    color: colors.text,
    fontSize: 22,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  liveText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balance: {
    color: colors.text,
    fontSize: 35,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: spacing.lg,
  },
  balanceCaption: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  smallLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  incomeValue: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '700',
  },
  spendingValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },


  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingRight: spacing.sm,
    paddingBottom: spacing.xs,
  },
  action: {
    width: 70,
    flexShrink: 0,
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSymbol: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '600',
  },
  actionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  seeAll: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  transactionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  errorContainer: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  retryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  refreshButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  disclaimer: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});