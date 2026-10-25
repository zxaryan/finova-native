import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  calculateBalance,
  useTransactionStore,
} from '@/features/transactions/store/transaction-store';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function TransferScreen() {
  const router = useRouter();
  const [recipient, setRecipient] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const transactions = useTransactionStore((state) => state.transactions);
  const balance = calculateBalance(transactions);

  function submitTransfer() {
    const nextErrors: Record<string, string> = {};
    const normalizedAccountNumber = accountNumber.replace(/\D/g, '');
    const numericAmount = Number(amount);

    if (recipient.trim().length < 2) {
      nextErrors.recipient = 'Enter a valid recipient name.';
    }

    if (normalizedAccountNumber.length < 8 || normalizedAccountNumber.length > 18) {
      nextErrors.accountNumber = 'Enter 8–18 digits.';
    }

    if (!amount.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      nextErrors.amount = 'Enter an amount greater than ₹0.';
    } else if (numericAmount > 1000000) {
      nextErrors.amount = 'Maximum transfer amount is ₹10,00,000.';
    } else if (numericAmount > balance) {
      nextErrors.amount = 'Insufficient balance.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    router.push({
      pathname: '/transfer/review',
      params: {
        recipient: recipient.trim(),
        accountNumber: normalizedAccountNumber,
        amount: String(numericAmount),
        note: note.trim(),
      },
    });
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
            <Text style={styles.title}>Transfer money</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.muted}>Available balance</Text>
            <Text style={styles.balance}>₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>

          <Text style={styles.sectionTitle}>Recipient details</Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Recipient name</Text>
            <TextInput
              value={recipient}
              onChangeText={setRecipient}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              style={styles.input}
              accessibilityLabel="Recipient name"
            />
            {errors.recipient ? <Text style={styles.error}>{errors.recipient}</Text> : null}

            <Text style={styles.label}>Account number</Text>
            <TextInput
              value={accountNumber}
              onChangeText={(value) =>
                setAccountNumber(value.replace(/[\s-]/g, '').replace(/\D/g, '').slice(0, 18))
              }
              placeholder="Enter account number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              style={styles.input}
              accessibilityLabel="Account number"
            />
            {errors.accountNumber ? <Text style={styles.error}>{errors.accountNumber}</Text> : null}

            <Text style={styles.label}>Amount (INR)</Text>
            <View style={styles.amountInputWrap}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                value={amount}
                onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                style={styles.amountInput}
                accessibilityLabel="Transfer amount in rupees"
              />
            </View>
            {errors.amount ? <Text style={styles.error}>{errors.amount}</Text> : null}

            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What's this transfer for?"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              maxLength={100}
              accessibilityLabel="Transfer note"
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={submitTransfer}
            style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}
          >
            <Text style={styles.submitText}>Review transfer</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
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
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  muted: { color: colors.textSecondary, fontSize: 13 },
  balance: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
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
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  currency: { color: colors.primary, fontSize: 19, fontWeight: '800' },
  amountInput: {
    flex: 1,
    padding: spacing.md,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  error: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
  notice: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  noticeTitle: { color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: spacing.sm },
  noticeText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  pressed: { opacity: 0.8 },
  submitText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  cancelButton: { alignItems: 'center', padding: spacing.lg },
  cancelText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
