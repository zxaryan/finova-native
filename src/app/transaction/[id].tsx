import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function TransactionDetailsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string;
    merchant?: string;
    category?: string;
    amount?: string;
    date?: string;
    type?: string;
    icon?: string;
  }>();

  const getParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const id = getParam(params.id) ?? 'unknown';
  const merchant = getParam(params.merchant) ?? 'Transaction';
  const category = getParam(params.category) ?? 'Uncategorized';
  const date = getParam(params.date) ?? 'Date unavailable';
  const type = getParam(params.type) === 'income' ? 'income' : 'expense';
  const icon = getParam(params.icon) ?? '₹';

  const parsedAmount = Number(getParam(params.amount) ?? 0);
  const amount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
  const isIncome = type === 'income';

  const formattedAmount = `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.amountCard}>
          <View style={styles.merchantIcon}>
            <Text style={styles.merchantIconText}>{icon}</Text>
          </View>

          <Text style={styles.merchantName}>{merchant}</Text>

          <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
            {isIncome ? '+' : '−'}{formattedAmount}
          </Text>

          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Demo transaction</Text>
          </View>

          <Text style={styles.dateText}>{date}</Text>
        </View>

        <Text style={styles.sectionTitle}>Transaction information</Text>

        <View style={styles.detailsCard}>
          <DetailRow label="Merchant" value={merchant} />
          <DetailRow label="Category" value={category} />
          <DetailRow label="Transaction type" value={isIncome ? 'Income' : 'Expense'} />
          <DetailRow label="Transaction ID" value={id} />
          <DetailRow label="Date" value={date} last />
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Finova Demo</Text>
          <Text style={styles.noticeText}>
            This screen displays demonstration data. No real bank account,
            payment, or transaction has been accessed or changed.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Back to activity</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
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
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  headerSpacer: { width: 44 },
  amountCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  merchantIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  merchantIconText: { color: colors.primary, fontSize: 25, fontWeight: '800' },
  merchantName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  amount: { fontSize: 30, fontWeight: '800', marginBottom: spacing.lg },
  income: { color: colors.success },
  expense: { color: colors.text },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  statusText: { color: colors.success, fontSize: 12, fontWeight: '600' },
  dateText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: { paddingVertical: spacing.lg, gap: spacing.sm },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { color: colors.textSecondary, fontSize: 12 },
  detailValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  notice: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  noticeTitle: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  noticeText: { color: colors.textSecondary, fontSize: 12, lineHeight: 19 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
