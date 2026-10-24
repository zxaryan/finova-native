import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import type { Transaction } from '@/features/transactions/types';

type Props = {
  transaction: Transaction;
};

export function TransactionRow({ transaction }: Props) {
  const router = useRouter();
  const isIncome = transaction.type === 'income';

  function openDetails() {
    router.push({
      pathname: '/transaction/[id]',
      params: {
        id: transaction.id,
        merchant: transaction.merchant,
        category: transaction.category,
        amount: String(transaction.amount),
        date: transaction.date,
        type: transaction.type,
        icon: transaction.icon,
      },
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${transaction.merchant}, ${isIncome ? 'income' : 'expense'}, ${transaction.amount} rupees`}
      onPress={openDetails}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{transaction.icon}</Text>
      </View>

      <View style={styles.details}>
        <Text numberOfLines={1} style={styles.merchant}>
          {transaction.merchant}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {transaction.category} · {transaction.date}
        </Text>
      </View>

      <Text
        style={[
          styles.amount,
          isIncome ? styles.income : styles.expense,
        ]}
      >
        {isIncome ? '+' : '-'}₹
        {transaction.amount.toLocaleString('en-IN')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  details: {
    flex: 1,
    gap: 5,
  },
  merchant: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  amount: {
    fontSize: 13,
    fontWeight: '700',
  },
  income: {
    color: colors.success,
  },
  expense: {
    color: colors.text,
  },
});