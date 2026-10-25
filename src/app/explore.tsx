import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import {
  Alert, Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionRow } from '@/features/dashboard/components/TransactionRow';
import { useTransactionStore } from '@/features/transactions/store/transaction-store';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type Filter = 'All' | 'Income' | 'Expenses';
type SortOption = 'Newest' | 'Oldest' | 'Highest amount' | 'Lowest amount';

const sortOptions: SortOption[] = [
  'Newest',
  'Oldest',
  'Highest amount',
  'Lowest amount',
];

function getTransactionTimestamp(value: string): number {
  const isoTimestamp = new Date(value).getTime();
  if (Number.isFinite(isoTimestamp)) return isoTimestamp;

  const relativeMatch =
    /^(Today|Yesterday),\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value);

  if (!relativeMatch) return 0;

  const [, relativeDay, hourText, minuteText, period] = relativeMatch;
  const date = new Date();

  if (relativeDay.toLowerCase() === 'yesterday') {
    date.setDate(date.getDate() - 1);
  }

  let hour = Number(hourText) % 12;
  if (period.toUpperCase() === 'PM') hour += 12;

  date.setHours(hour, Number(minuteText), 0, 0);
  return date.getTime();
}

const filters: Filter[] = ['All', 'Income', 'Expenses'];

export default function ActivityScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [sortOption, setSortOption] = useState<SortOption>('Newest');

  const allTransactions = useTransactionStore(
    (state) => state.transactions,
  );

  const expenseInsights = useMemo(() => {
    const totals = new Map<string, number>();

    for (const transaction of allTransactions) {
      if (transaction.type !== 'expense') continue;

      totals.set(
        transaction.category,
        (totals.get(transaction.category) ?? 0) + transaction.amount,
      );
    }

    return Array.from(totals, ([category, amount]) => ({
      category,
      amount,
    })).sort((a, b) => b.amount - a.amount);
  }, [allTransactions]);

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return allTransactions.filter((transaction) => {
      const matchesSearch =
        transaction.merchant.toLowerCase().includes(normalizedSearch) ||
        transaction.category.toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Income' && transaction.type === 'income') ||
        (activeFilter === 'Expenses' && transaction.type === 'expense');

      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      switch (sortOption) {
        case 'Oldest':
          return getTransactionTimestamp(a.date) - getTransactionTimestamp(b.date);
        case 'Highest amount':
          return b.amount - a.amount;
        case 'Lowest amount':
          return a.amount - b.amount;
        case 'Newest':
        default:
          return getTransactionTimestamp(b.date) - getTransactionTimestamp(a.date);
      }
    });
  }, [allTransactions, search, activeFilter, sortOption]);

  async function exportTransactions() {
    try {
      if (!allTransactions.length) {
        Alert.alert('Nothing to export', 'There are no transactions to export.');
        return;
      }

      if (!FileSystem.cacheDirectory) {
        Alert.alert('Export unavailable', 'File storage is not available on this device.');
        return;
      }

      const escapeCsv = (value: string | number) =>
        `"${String(value).replace(/"/g, '""')}"`;

      const rows = [
        ['Transaction ID', 'Merchant', 'Category', 'Amount', 'Type', 'Date'],
        ...allTransactions.map((transaction) => [
          transaction.id,
          transaction.merchant,
          transaction.category,
          transaction.amount,
          transaction.type,
          transaction.date,
        ]),
      ];

      const csv = rows
        .map((row) => row.map(escapeCsv).join(','))
        .join('\r\n');

      const fileUri = `${FileSystem.cacheDirectory}finova-transactions.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert('Sharing unavailable', 'This device cannot open the share sheet.');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        UTI: 'public.comma-separated-values-text',
        dialogTitle: 'Export Finova transactions',
      });
    } catch {
      Alert.alert('Export failed', 'Could not export transactions. Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back to dashboard"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Dashboard</Text>
        </Pressable>

        <Text style={styles.eyebrow}>YOUR FINANCES</Text>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>
          Search and review your transactions.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={exportTransactions}
          style={({ pressed }) => [
            styles.exportButton,
            pressed && styles.exportButtonPressed,
          ]}
        >
          <Text style={styles.exportButtonText}>Export transactions CSV ↗</Text>
        </Pressable>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Search transactions"
            placeholder="Search transactions..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            returnKeyType="search"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearch('')}
              hitSlop={8}
            >
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.filters}>
          {filters.map((filter) => {
            const selected = activeFilter === filter;

            return (
              <Pressable
                key={filter}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterButton,
                  selected && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.insightsCard}>
          <Text style={styles.sectionTitle}>Spending by category</Text>
          <Text style={styles.insightsSubtitle}>
            Based on your recorded expenses
          </Text>

          {expenseInsights.length > 0 ? (
            expenseInsights.map((item) => {
              const maximum = expenseInsights[0]?.amount ?? 1;
              const percentage = (item.amount / maximum) * 100;

              return (
                <View key={item.category} style={styles.insightRow}>
                  <View style={styles.insightLabels}>
                    <Text style={styles.insightCategory}>{item.category}</Text>
                    <Text style={styles.insightAmount}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                  <View
                    accessibilityLabel={`${item.category}: ${Math.round(percentage)} percent of the largest category`}
                    style={styles.progressTrack}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${percentage}%` },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.stateText}>
              Your recorded expenses will appear here.
            </Text>
          )}
        </View>

        <Text style={styles.sortLabel}>Sort transactions</Text>
        <View style={styles.sortOptions}>
          {sortOptions.map((option) => {
            const selected = sortOption === option;

            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSortOption(option)}
                style={[
                  styles.sortButton,
                  selected && styles.sortButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.sortText,
                    selected && styles.sortTextActive,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <Text style={styles.count}>
            {filteredTransactions.length} found
          </Text>
        </View>

        <View style={styles.transactionCard}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No transactions found</Text>
              <Text style={styles.stateText}>
                Try another search or change the filter.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setSearch('');
                  setActiveFilter('All');
                }}
                style={styles.resetButton}
              >
                <Text style={styles.retryText}>Clear filters</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Text style={styles.disclaimer}>
          
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  backText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  exportButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  exportButtonPressed: {
    opacity: 0.7,
  },
  exportButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  searchIcon: {
    color: colors.textSecondary,
    fontSize: 24,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: spacing.md,
  },
  clearText: {
    color: colors.textSecondary,
    fontSize: 16,
    padding: spacing.xs,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.text,
  },
  sortLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  sortButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sortButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  sortText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  sortTextActive: {
    color: colors.text,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  count: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  insightsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  insightsSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: -spacing.sm,
  },
  insightRow: {
    gap: spacing.sm,
  },
  insightLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  insightCategory: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  insightAmount: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  transactionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
  retryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  resetButton: {
    padding: spacing.sm,
  },
  disclaimer: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});