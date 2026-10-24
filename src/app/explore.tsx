import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionRow } from '@/features/dashboard/components/TransactionRow';
import { useTransactionStore } from '@/features/transactions/store/transaction-store';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type Filter = 'All' | 'Income' | 'Expenses';

const filters: Filter[] = ['All', 'Income', 'Expenses'];

export default function ActivityScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('All');

  const allTransactions = useTransactionStore(
    (state) => state.transactions,
  );

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
    });
  }, [allTransactions, search, activeFilter]);

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
          Search and review your demo transactions.
        </Text>

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
          Demo data only · No real financial accounts connected
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