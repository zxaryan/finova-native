import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function CardsScreen() {
  const router = useRouter();
  const [frozen, setFrozen] = useState(false);
  const [showNumber, setShowNumber] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem('finova-card-frozen')
      .then((value) => {
        if (mounted) {
          setFrozen(value === 'true');
          setStorageReady(true);
        }
      })
      .catch(() => {
        if (mounted) setStorageReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function toggleFrozen() {
    if (!storageReady) return;

    const nextFrozen = !frozen;
    setFrozen(nextFrozen);

    try {
      await AsyncStorage.setItem('finova-card-frozen', String(nextFrozen));
    } catch {
      setFrozen(frozen);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>My cards</Text>
          <View style={styles.spacer} />
        </View>

        <Text style={styles.eyebrow}>YOUR FINOVA CARD</Text>
        <Text style={styles.heading}>One card. More control.</Text>
        <Text style={styles.subtitle}>
          Manage your virtual card.
        </Text>

        <View style={[styles.card, frozen && styles.frozenCard]}>
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.brand}>finova</Text>
              <Text style={styles.cardType}>DEBIT · VIRTUAL</Text>
            </View>
            <Text style={styles.chip}>▦</Text>
          </View>

          <Text style={styles.cardNumber}>
            {showNumber
              ? '4829 1056 7732 6041'
              : '•••• •••• •••• 6041'}
          </Text>

          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.cardLabel}>CARDHOLDER</Text>
              <Text style={styles.cardValue}>ARYAN PATEL</Text>
            </View>
            <View>
              <Text style={styles.cardLabel}>EXPIRES</Text>
              <Text style={styles.cardValue}>08/29</Text>
            </View>
            <Text style={styles.visa}>VISA</Text>
          </View>

          {frozen && (
            <View style={styles.frozenOverlay}>
              <Text style={styles.frozenText}>CARD FROZEN</Text>
            </View>
          )}
        </View>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              frozen && styles.inactiveDot,
            ]}
          />
          <Text style={styles.statusText}>
            {frozen ? 'Card is frozen' : 'Card is active'}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowNumber((value) => !value)}
            style={styles.action}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionSymbol}>
                {showNumber ? '◉' : '◎'}
              </Text>
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>
                {showNumber ? 'Hide card number' : 'Show card number'}
              </Text>
              <Text style={styles.actionDescription}>
                View your card number
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: false }}
            onPress={toggleFrozen}
            style={styles.action}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionSymbol}>
                {frozen ? '✓' : 'Ⅱ'}
              </Text>
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>
                {frozen ? 'Unfreeze card' : 'Freeze card'}
              </Text>
              <Text style={styles.actionDescription}>
                {frozen
                  ? 'Reactivate your card'
                  : 'Temporarily lock your card'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.text, fontSize: 34, lineHeight: 38 },
  title: { color: colors.text, fontSize: 19, fontWeight: '700' },
  spacer: { width: 44 },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  heading: { color: colors.text, fontSize: 25, fontWeight: '800' },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  card: {
    minHeight: 220,
    backgroundColor: '#25234A',
    borderRadius: radius.lg,
    padding: spacing.xl,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#454176',
  },
  frozenCard: { opacity: 0.75 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  cardType: {
    color: '#C8C5E8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  chip: { color: '#D6CBA5', fontSize: 32 },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    marginVertical: spacing.xl,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: '#C8C5E8',
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 5,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  visa: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  frozenOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12,12,25,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frozenText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  inactiveDot: { backgroundColor: colors.textSecondary },
  statusText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },

  actions: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  action: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSymbol: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  actionCopy: { flex: 1, gap: 4 },
  actionTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  actionDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  chevron: { color: colors.textSecondary, fontSize: 26 },
  divider: { height: 1, backgroundColor: colors.border },
  notice: {
    marginTop: spacing.xl,
    backgroundColor: colors.primarySoft,
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  noticeTitle: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  noticeText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
