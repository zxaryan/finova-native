import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTransactionStore } from '@/features/transactions/store/transaction-store';
import type { Transaction } from '@/features/transactions/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const STORAGE_KEY = 'finova-budgets-v1';

type Budget = {
  id: string;
  category: string;
  limit: number;
};

const COMMON_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health',
  'Travel',
  'Education',
  'Other',
];

function money(amount: number) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function transactionDate(value: string): Date | null {
  const direct = new Date(value);

  if (Number.isFinite(direct.getTime())) {
    return direct;
  }

  const relative = /^(Today|Yesterday),\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value);

  if (!relative) return null;

  const [, day, hours, minutes, period] = relative;
  const date = new Date();

  if (day.toLowerCase() === 'yesterday') {
    date.setDate(date.getDate() - 1);
  }

  let hour = Number(hours) % 12;
  if (period.toUpperCase() === 'PM') hour += 12;

  date.setHours(hour, Number(minutes), 0, 0);
  return date;
}

function spentThisMonth(transactions: Transaction[], category: string) {
  const now = new Date();

  return transactions.reduce((total, transaction) => {
    if (
      transaction.type !== 'expense' ||
      transaction.category !== category
    ) {
      return total;
    }

    const date = transactionDate(transaction.date);

    if (
      !date ||
      date.getFullYear() !== now.getFullYear() ||
      date.getMonth() !== now.getMonth()
    ) {
      return total;
    }

    return total + transaction.amount;
  }, 0);
}

export default function BudgetsScreen() {
  const transactions = useTransactionStore((state) => state.transactions);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [limitText, setLimitText] = useState('');

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;

        if (stored) {
          try {
            const parsed: unknown = JSON.parse(stored);

            if (Array.isArray(parsed)) {
              setBudgets(
                parsed.filter(
                  (item): item is Budget =>
                    item !== null &&
                    typeof item === 'object' &&
                    typeof item.id === 'string' &&
                    typeof item.category === 'string' &&
                    typeof item.limit === 'number' &&
                    Number.isFinite(item.limit) &&
                    item.limit > 0,
                ),
              );
            }
          } catch {
            Alert.alert(
              'Budgets could not be loaded',
              'Saved budget data was invalid. You can create new budgets.',
            );
          }
        }
      })
      .catch(() => {
        Alert.alert(
          'Storage unavailable',
          'Budgets could not be loaded from local storage.',
        );
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(budgets)).catch(() => {
      Alert.alert(
        'Save failed',
        'Your budget changes could not be saved to this device.',
      );
    });
  }, [budgets, loaded]);

  const categories = useMemo(() => {
    const transactionCategories = transactions
      .filter((transaction) => transaction.type === 'expense')
      .map((transaction) => transaction.category.trim())
      .filter(Boolean);

    return [...new Set([...COMMON_CATEGORIES, ...transactionCategories])].sort(
      (a, b) => a.localeCompare(b),
    );
  }, [transactions]);

  const budgetRows = useMemo(
    () =>
      budgets
        .map((budget) => ({
          ...budget,
          spent: spentThisMonth(transactions, budget.category),
        }))
        .sort((a, b) => b.spent / b.limit - a.spent / a.limit),
    [budgets, transactions],
  );

  const totalLimit = budgetRows.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = budgetRows.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const monthLabel = new Date().toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  function openAdd() {
    const firstAvailable =
      categories.find((item) => !budgets.some((budget) => budget.category === item)) ??
      categories[0] ??
      'Other';

    setEditingId(null);
    setCategory(firstAvailable);
    setLimitText('');
    setModalVisible(true);
  }

  function openEdit(budget: Budget) {
    setEditingId(budget.id);
    setCategory(budget.category);
    setLimitText(String(budget.limit));
    setModalVisible(true);
  }

  function saveBudget() {
    const limit = Number(limitText.trim());

    if (!category.trim()) {
      Alert.alert('Choose a category', 'Select a category for this budget.');
      return;
    }

    if (!limitText.trim() || !Number.isFinite(limit) || limit <= 0) {
      Alert.alert(
        'Invalid budget',
        'Enter a valid budget limit greater than ₹0.',
      );
      return;
    }

    const duplicate = budgets.some(
      (budget) =>
        budget.category.toLowerCase() === category.toLowerCase() &&
        budget.id !== editingId,
    );

    if (duplicate) {
      Alert.alert(
        'Category already exists',
        'Edit the existing budget for this category instead.',
      );
      return;
    }

    if (editingId) {
      setBudgets((current) =>
        current.map((budget) =>
          budget.id === editingId
            ? { ...budget, category, limit }
            : budget,
        ),
      );
    } else {
      setBudgets((current) => [
        ...current,
        { id: `${Date.now()}`, category, limit },
      ]);
    }

    setModalVisible(false);
  }

  function confirmDelete(budget: Budget) {
    Alert.alert(
      'Delete budget?',
      `Remove the ${budget.category} budget? Your transactions will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            setBudgets((current) =>
              current.filter((item) => item.id !== budget.id),
            ),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>YOUR MONEY PLAN</Text>
            <Text style={styles.title}>Budgets</Text>
            <Text style={styles.subtitle}>{monthLabel}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add budget"
            style={styles.addButton}
            onPress={openAdd}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.cardEyebrow}>TOTAL MONTHLY BUDGET</Text>
          <Text style={styles.totalAmount}>{money(totalLimit)}</Text>

          <View style={styles.overviewDivider} />

          <View style={styles.overviewStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>SPENT</Text>
              <Text style={styles.spentValue}>{money(totalSpent)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>
                {totalRemaining >= 0 ? 'REMAINING' : 'OVER BUDGET'}
              </Text>
              <Text
                style={[
                  styles.remainingValue,
                  totalRemaining < 0 && styles.dangerText,
                ]}
              >
                {money(Math.abs(totalRemaining))}
              </Text>
            </View>
          </View>

          {totalLimit > 0 && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min((totalSpent / totalLimit) * 100, 100)}%`,
                    backgroundColor:
                      totalSpent > totalLimit ? colors.danger : colors.primary,
                  },
                ]}
              />
            </View>
          )}
          <Text style={styles.overviewFootnote}>
            Based on recorded expenses this month
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Category limits</Text>
            <Text style={styles.sectionSubtitle}>
              Track spending against each limit
            </Text>
          </View>
          <Text style={styles.countLabel}>{budgets.length} budgets</Text>
        </View>

        {!loaded ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Loading budgets…</Text>
          </View>
        ) : budgetRows.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>◷</Text>
            <Text style={styles.emptyTitle}>Give your money a plan</Text>
            <Text style={styles.emptyText}>
              Create a monthly limit for categories like food, shopping, or
              transport. Spending is calculated from your recorded expenses.
            </Text>
            <Pressable style={styles.primaryButton} onPress={openAdd}>
              <Text style={styles.primaryButtonText}>Create first budget</Text>
            </Pressable>
          </View>
        ) : (
          budgetRows.map((budget) => {
            const percent = (budget.spent / budget.limit) * 100;
            const overBudget = budget.spent > budget.limit;
            const nearlyFull = percent >= 80;

            return (
              <View key={budget.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={styles.categoryIcon}>
                    <Text style={styles.categoryIconText}>
                      {budget.category.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.budgetTitleGroup}>
                    <Text style={styles.categoryName}>{budget.category}</Text>
                    <Text style={styles.budgetLimit}>
                      Limit {money(budget.limit)}
                    </Text>
                  </View>

                  <View style={styles.budgetActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${budget.category} budget`}
                      onPress={() => openEdit(budget)}
                      hitSlop={8}
                      style={styles.smallAction}
                    >
                      <Text style={styles.editText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${budget.category} budget`}
                      onPress={() => confirmDelete(budget)}
                      hitSlop={8}
                      style={styles.smallAction}
                    >
                      <Text style={styles.deleteText}>×</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.spendingLine}>
                  <Text style={styles.spendingAmount}>{money(budget.spent)}</Text>
                  <Text
                    style={[
                      styles.spendingPercent,
                      overBudget && styles.dangerText,
                    ]}
                  >
                    {Math.round(percent)}% used
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(percent, 100)}%`,
                        backgroundColor: overBudget
                          ? colors.danger
                          : nearlyFull
                            ? '#F4B860'
                            : colors.success,
                      },
                    ]}
                  />
                </View>

                <Text
                  style={[
                    styles.budgetFootnote,
                    (overBudget || nearlyFull) && styles.dangerText,
                  ]}
                >
                  {overBudget
                    ? `${money(budget.spent - budget.limit)} over your limit`
                    : nearlyFull
                      ? `${money(budget.limit - budget.spent)} left to spend`
                      : `${money(budget.limit - budget.spent)} left this month`}
                </Text>
              </View>
            );
          })
        )}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>How these numbers work</Text>
          <Text style={styles.noteText}>
            Only recorded expense transactions dated in the current month are
            counted. Categories must match the transaction category exactly.
            Budgets are saved on this device; no payment is made from this
            screen.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.backdropDismiss}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit budget' : 'Create a budget'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Set a monthly spending limit for one category.
            </Text>

            <Text style={styles.inputLabel}>CATEGORY</Text>
            <ScrollView
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryChoices}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {categories.map((item) => {
                const usedByAnotherBudget = budgets.some(
                  (budget) =>
                    budget.category === item && budget.id !== editingId,
                );
                const selected = category === item;

                return (
                  <Pressable
                    key={item}
                    disabled={usedByAnotherBudget}
                    onPress={() => setCategory(item)}
                    style={[
                      styles.categoryChoice,
                      selected && styles.categoryChoiceSelected,
                      usedByAnotherBudget && styles.categoryChoiceDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChoiceText,
                        selected && styles.categoryChoiceTextSelected,
                        usedByAnotherBudget && styles.disabledText,
                      ]}
                    >
                      {item}
                      {usedByAnotherBudget ? ' · Added' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.inputLabel}>MONTHLY LIMIT (₹)</Text>
            <TextInput
              value={limitText}
              onChangeText={setLimitText}
              placeholder="e.g. 5000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              maxLength={12}
              accessibilityLabel="Monthly budget limit in rupees"
            />

            <Pressable style={styles.primaryButton} onPress={saveBudget}>
              <Text style={styles.primaryButtonText}>
                {editingId ? 'Save changes' : 'Create budget'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginLeft: spacing.md,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  overviewCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  cardEyebrow: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  totalAmount: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  overviewDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  overviewStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  spentValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  remainingValue: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  dangerText: {
    color: colors.danger,
  },
  progressTrack: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  overviewFootnote: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  countLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  emptyIcon: {
    color: colors.primary,
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  budgetCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  budgetTitleGroup: {
    flex: 1,
    marginLeft: spacing.md,
  },
  categoryName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  budgetLimit: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  budgetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  smallAction: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  editText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteText: {
    color: colors.danger,
    fontSize: 22,
    fontWeight: '600',
  },
  spendingLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  spendingAmount: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  spendingPercent: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  budgetFootnote: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  noteTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  noteText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  backdropDismiss: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  categoryScroll: {
    maxHeight: 145,
  },
  categoryChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  categoryChoice: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryChoiceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  categoryChoiceDisabled: {
    opacity: 0.4,
  },
  categoryChoiceText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  categoryChoiceTextSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  disabledText: {
    color: colors.textSecondary,
  },
  amountInput: {
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
});
