import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  calculateBalance,
  useTransactionStore,
} from '@/features/transactions/store/transaction-store';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function TransferReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    recipient?: string;
    accountNumber?: string;
    amount?: string;
    note?: string;
  }>();

  const read = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] ?? '' : value ?? '';

  const recipient = read(params.recipient);
  const accountNumber = read(params.accountNumber);
  const note = read(params.note);
  const amount = Number(read(params.amount));
  const validAmount = Number.isFinite(amount) && amount > 0;
  const confirmingRef = useRef(false);
  const [confirming, setConfirming] = useState(false);

  function confirmTransfer() {
    if (confirmingRef.current) return;

    if (!recipient.trim() || !/^\d{8,18}$/.test(accountNumber) || !validAmount) {
      Alert.alert('Invalid transfer', 'Return to the form and check the details.');
      return;
    }

    const store = useTransactionStore.getState();
    const currentBalance = calculateBalance(store.transactions);

    if (amount > currentBalance) {
      Alert.alert(
        'Insufficient balance',
        `Available balance: ₹${currentBalance.toLocaleString('en-IN')}. Return to the form and reduce the amount.`,
      );
      return;
    }

    confirmingRef.current = true;
    setConfirming(true);

    const addTransaction = store.addTransaction;

    addTransaction({
      id: `transfer-${Date.now()}`,
      merchant: `Transfer to ${recipient.trim()}`,
      category: 'Transfer',
      amount,
      date: new Date().toISOString(),
      type: 'expense',
      icon: '↗',
    });

    Alert.alert(
      'Transfer recorded',
      `Recipient: ${recipient.trim()}\nAmount: ₹${amount.toLocaleString('en-IN')}\n\nThis transfer was recorded in Finova.`,
      [{ text: 'Done', onPress: () => router.dismissAll() }],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹  Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>FINAL STEP</Text>
        <Text style={styles.title}>Review transfer</Text>
        <Text style={styles.subtitle}>
          Check the details before confirming your transfer.
        </Text>

        <View style={styles.amountCard}>
          <Text style={styles.muted}>You're sending</Text>
          <Text style={styles.amount}>
            ₹{validAmount ? amount.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) : '0.00'}
          </Text>
        </View>

        <View style={styles.card}>
          <Detail label="Recipient" value={recipient || 'Not provided'} />
          <Detail label="Account number" value={accountNumber ? `••••${accountNumber.slice(-4)}` : 'Not provided'} />
          <Detail label="Transfer amount" value={`₹${validAmount ? amount.toLocaleString('en-IN') : '0'}`} />
          <Detail label="Transfer fee" value="₹0.00" />
          <Detail label="Note" value={note || 'No note'} last />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: confirming }}
          disabled={confirming}
          onPress={confirmTransfer}
          style={({ pressed }) => [
            styles.primaryButton,
            (pressed || confirming) && styles.pressed,
          ]}
        >
          <Text style={styles.primaryText}>
            {confirming ? 'Transfer recorded' : 'Confirm transfer'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryText}>Edit details</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ label, value, last = false }: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detail, !last && styles.separator]}>
      <Text style={styles.muted}>{label}</Text>
      <Text selectable style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  back: { marginBottom: spacing.xl, alignSelf: 'flex-start' },
  backText: { color: colors.textSecondary, fontSize: 16 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 29, fontWeight: '800', marginTop: spacing.sm },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: spacing.sm, marginBottom: spacing.xl },
  amountCard: { alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  muted: { color: colors.textSecondary, fontSize: 12 },
  amount: { color: colors.text, fontSize: 32, fontWeight: '800', marginVertical: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border },
  detail: { paddingVertical: spacing.lg, gap: spacing.sm },
  separator: { borderBottomWidth: 1, borderBottomColor: colors.border },
  value: { color: colors.text, fontSize: 14, fontWeight: '600' },
  notice: { backgroundColor: colors.primarySoft, padding: spacing.lg, borderRadius: radius.md, marginTop: spacing.xl, gap: spacing.sm },
  noticeTitle: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  noticeBody: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  primaryButton: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.xl },
  pressed: { opacity: 0.8 },
  primaryText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', padding: spacing.lg },
  secondaryText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
