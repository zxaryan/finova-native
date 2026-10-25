import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Transaction } from '@/features/transactions/types';
import { useTransactionStore } from '@/features/transactions/store/transaction-store';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const money = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

function transactionDate(value: string): Date | null {
  const direct = new Date(value);
  if (Number.isFinite(direct.getTime())) return direct;

  const match =
    /^(Today|Yesterday),\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value);

  if (!match) return null;

  const [, relativeDay, hourText, minuteText, period] = match;
  const date = new Date();

  if (relativeDay.toLowerCase() === 'yesterday') {
    date.setDate(date.getDate() - 1);
  }

  let hour = Number(hourText) % 12;
  if (period.toUpperCase() === 'PM') hour += 12;

  date.setHours(hour, Number(minuteText), 0, 0);
  return date;
}

type MonthSummary = {
  label: string;
  income: number;
  expenses: number;
};

function buildMonthSummaries(transactions: Transaction[]): MonthSummary[] {
  const now = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const summary: MonthSummary = {
      label: date.toLocaleDateString('en-IN', { month: 'short' }),
      income: 0,
      expenses: 0,
    };

    for (const transaction of transactions) {
      const parsed = transactionDate(transaction.date);
      if (
        !parsed ||
        parsed.getFullYear() !== date.getFullYear() ||
        parsed.getMonth() !== date.getMonth()
      ) {
        continue;
      }

      if (transaction.type === 'income') {
        summary.income += transaction.amount;
      } else {
        summary.expenses += transaction.amount;
      }
    }

    return summary;
  });
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const transactions = useTransactionStore((state) => state.transactions);

  const report = useMemo(() => {
    const now = new Date();
    let income = 0;
    let expenses = 0;

    const categories = new Map<string, number>();

    for (const transaction of transactions) {
      const date = transactionDate(transaction.date);

      if (
        date &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      ) {
        if (transaction.type === 'income') {
          income += transaction.amount;
        } else {
          expenses += transaction.amount;
        }
      }

      if (transaction.type === 'expense') {
        categories.set(
          transaction.category,
          (categories.get(transaction.category) ?? 0) + transaction.amount,
        );
      }
    }

    return {
      income,
      expenses,
      categories: [...categories.entries()]
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
      months: buildMonthSummaries(transactions),
    };
  }, [transactions]);

  const maxCategory = Math.max(
    1,
    ...report.categories.map((item) => item.amount),
  );

  const maxMonth = Math.max(
    1,
    ...report.months.flatMap((month) => [month.income, month.expenses]),
  );

  const monthName = new Date().toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

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
            <Text style={styles.eyebrow}>YOUR MONEY</Text>
            <Text style={styles.title}>Analytics</Text>
          </View>
          <View style={styles.periodBadge}>
            <Text style={styles.periodText}>MONTHLY</Text>
          </View>
        </View>

        <View style={styles.monthCard}>
          <Text style={styles.muted}>REPORTING PERIOD</Text>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <Text style={styles.monthCaption}>
            An overview of your recorded transactions this month.
          </Text>
          <View style={styles.netRow}>
            <View>
              <Text style={styles.muted}>NET CASH FLOW</Text>
              <Text
                style={[
                  styles.netValue,
                  { color: report.income - report.expenses >= 0
                    ? colors.success
                    : colors.danger },
                ]}
              >
                {report.income - report.expenses >= 0 ? '+' : '−'}
                {money(Math.abs(report.income - report.expenses))}
              </Text>
            </View>
            <View style={styles.netIcon}>
              <Text style={styles.netIconText}>↗</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { marginRight: spacing.sm }]}>
            <View style={styles.statHeading}>
              <View style={[styles.statDot, { backgroundColor: colors.success }]} />
              <Text style={styles.statLabel}>INCOME</Text>
            </View>
            <Text style={styles.statValue}>{money(report.income)}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statHeading}>
              <View style={[styles.statDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.statLabel}>SPENDING</Text>
            </View>
            <Text style={styles.statValue}>{money(report.expenses)}</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <View>
              <Text style={styles.panelTitle}>Spending breakdown</Text>
              <Text style={styles.panelSubtitle}>By transaction category</Text>
            </View>
            <Text style={styles.panelIcon}>◉</Text>
          </View>

          {report.categories.length === 0 ? (
            <Text style={styles.emptyText}>
              Your spending breakdown will appear when expenses are recorded.
            </Text>
          ) : (
            report.categories.map((item) => (
              <View key={item.category} style={styles.categoryItem}>
                <View style={styles.categoryHeading}>
                  <Text style={styles.categoryName}>{item.category}</Text>
                  <Text style={styles.categoryAmount}>{money(item.amount)}</Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.categoryBar,
                      { width: `${(item.amount / maxCategory) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <View>
              <Text style={styles.panelTitle}>Income vs spending</Text>
              <Text style={styles.panelSubtitle}>Last six calendar months</Text>
            </View>
            <Text style={styles.panelIcon}>▥</Text>
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Spending</Text>
            </View>
          </View>

          <View style={styles.chart}>
            {report.months.map((month, index) => (
              <View key={`${month.label}-${index}`} style={styles.chartColumn}>
                <View style={styles.bars}>
                  <View
                    style={[
                      styles.bar,
                      styles.incomeBar,
                      { height: `${Math.max(3, (month.income / maxMonth) * 100)}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      styles.expenseBar,
                      { height: `${Math.max(3, (month.expenses / maxMonth) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{month.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.chartFootnote}>
            Months without recorded activity are shown as empty periods.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.activityButton}
          onPress={() => router.push('/explore')}
        >
          <Text style={styles.activityButtonText}>View all transactions</Text>
          <Text style={styles.activityArrow}>→</Text>
        </Pressable>
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
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  periodBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  periodText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  monthCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  muted: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  monthTitle: { color: colors.text, fontSize: 23, fontWeight: '800', marginTop: 8 },
  monthCaption: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
  },
  netValue: { fontSize: 25, fontWeight: '800', marginTop: 6 },
  netIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  netIconText: { color: colors.primary, fontSize: 22 },
  statsRow: { flexDirection: 'row', marginBottom: spacing.md },
  statCard: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDot: { width: 7, height: 7, borderRadius: radius.pill },
  statLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  statValue: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: spacing.md },
  panel: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  panelHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  panelTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  panelSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  panelIcon: { color: colors.primary, fontSize: 23 },
  emptyText: { color: colors.textSecondary, fontSize: 12, lineHeight: 19 },
  categoryItem: { marginBottom: spacing.lg },
  categoryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryName: { color: colors.text, fontSize: 12, fontWeight: '600' },
  categoryAmount: { color: colors.text, fontSize: 12, fontWeight: '700' },
  track: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  legend: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: radius.pill },
  legendText: { color: colors.textSecondary, fontSize: 11 },
  chart: {
    height: 145,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bars: {
    width: '65%',
    height: 116,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
  },
  bar: { flex: 1, minWidth: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  incomeBar: { backgroundColor: colors.success },
  expenseBar: { backgroundColor: colors.primary },
  chartLabel: { color: colors.textSecondary, fontSize: 10, marginVertical: 8 },
  chartFootnote: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: spacing.md,
  },
  activityButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    marginTop: spacing.xs,
  },
  activityButtonText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  activityArrow: { color: colors.primary, fontSize: 20 },
});
