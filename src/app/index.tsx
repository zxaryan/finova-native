import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            style={styles.avatar}
            onPress={() =>
              Alert.alert('Finova profile', 'Profile screen coming next.')
            }
          >
            <Text style={styles.avatarText}>AP</Text>
          </Pressable>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>DEMO</Text>
            </View>
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

        <View style={styles.actions}>
          <Pressable
            style={styles.action}
            onPress={() => router.push('/transfer')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionSymbol}>↗</Text>
            </View>
            <Text style={styles.actionLabel}>Transfer</Text>
          </Pressable>

          <Pressable
            style={styles.action}
            onPress={() =>
              Alert.alert('Cards', 'Cards screen coming next.')
            }
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionSymbol}>▤</Text>
            </View>
            <Text style={styles.actionLabel}>My cards</Text>
          </Pressable>

          <Pressable
            style={styles.action}
            onPress={() => router.push('/explore')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionSymbol}>↔</Text>
            </View>
            <Text style={styles.actionLabel}>Activity</Text>
          </Pressable>

          <Pressable
            style={styles.action}
            onPress={() =>
              Alert.alert('Insights', 'Spending insights coming next.')
            }
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionSymbol}>⌁</Text>
            </View>
            <Text style={styles.actionLabel}>Insights</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <Text style={styles.sectionSubtitle}>
              Your latest demo transactions
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
          Demo only · No real financial accounts connected
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  action: {
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 62,
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