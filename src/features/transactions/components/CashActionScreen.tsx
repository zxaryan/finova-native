import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  calculateBalance,
  useTransactionStore,
} from '@/features/transactions/store/transaction-store';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type CashAction = 'deposit' | 'withdraw';

export default function CashActionScreen({
  action,
}: {
  action: CashAction;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const transactions = useTransactionStore((state) => state.transactions);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const balance = calculateBalance(transactions);

  const isDeposit = action === 'deposit';
  const title = isDeposit ? 'Deposit money' : 'Withdraw money';

  function submit() {
    const value = Number(amount);

    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than ₹0.');
      return;
    }

    if (!Number.isSafeInteger(Math.round(value * 100)) || value > 1000000) {
      setError('Enter an amount up to ₹10,00,000.');
      return;
    }

    if (!isDeposit && value > balance) {
      setError('Insufficient balance.');
      return;
    }

    const roundedAmount = Math.round(value * 100) / 100;

    addTransaction({
      id: `${action}-${Date.now()}`,
      merchant: isDeposit ? 'Cash deposit' : 'Cash withdrawal',
      category: isDeposit ? 'Deposit' : 'Withdrawal',
      amount: roundedAmount,
      date: new Date().toISOString(),
      type: isDeposit ? 'income' : 'expense',
      icon: isDeposit ? '↓' : '↑',
    });

    setError('');

    Alert.alert(
      `${title} successful`,
      `${isDeposit ? 'Deposited' : 'Withdrawn'} ₹${roundedAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}${note.trim() ? `\nNote: ${note.trim()}` : ''}`,
      [{ text: 'Done', onPress: () => router.replace('/') }],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.container}
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
            <Text style={styles.title}>{title}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.muted}>Available balance</Text>
            <Text style={styles.balance}>
              ₹{balance.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <Text style={styles.muted}>
              {isDeposit
                ? 'Record money added to your account'
                : 'Record money taken out of your account'}
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Amount (INR)</Text>
            <View style={styles.amountWrap}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                value={amount}
                onChangeText={(value) => {
                  setAmount(
                    value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'),
                  );
                  setError('');
                }}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                style={styles.amountInput}
                accessibilityLabel="Amount in rupees"
              />
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={isDeposit ? 'Source of money' : 'Reason for withdrawal'}
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              maxLength={100}
              accessibilityLabel="Optional note"
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={submit}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.submitText}>
              Confirm {isDeposit ? 'deposit' : 'withdrawal'}
            </Text>
          </Pressable>

          <Text style={styles.disclaimer}>
            This records a local transaction in Finova. It does not move real money.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.text, fontSize: 34, lineHeight: 38 },
  title: { color: colors.text, fontSize: 19, fontWeight: '700' },
  headerSpacer: { width: 44 },
  balanceCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  muted: { color: colors.textSecondary, fontSize: 13 },
  balance: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginVertical: spacing.md,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  currency: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 20,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 14,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  disclaimer: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.lg,
  },
});
