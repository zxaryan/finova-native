import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
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

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const STORAGE_KEY = 'finova-savings-goals-v1';

type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string;
};

function money(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function daysUntil(value: string) {
  if (!validDate(value)) return null;

  const [year, month, day] = value.split('-').map(Number);
  const deadline = new Date(year, month - 1, day);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [targetText, setTargetText] = useState('');
  const [savedText, setSavedText] = useState('0');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!active || !value) return;

        try {
          const parsed: unknown = JSON.parse(value);

          if (Array.isArray(parsed)) {
            setGoals(
              parsed.filter(
                (item): item is Goal =>
                  item !== null &&
                  typeof item === 'object' &&
                  typeof item.id === 'string' &&
                  typeof item.name === 'string' &&
                  typeof item.target === 'number' &&
                  Number.isFinite(item.target) &&
                  item.target > 0 &&
                  typeof item.saved === 'number' &&
                  Number.isFinite(item.saved) &&
                  item.saved >= 0 &&
                  typeof item.deadline === 'string',
              ),
            );
          }
        } catch {
          Alert.alert('Could not load goals', 'Saved goal data is invalid.');
        }
      })
      .catch(() => {
        Alert.alert('Storage unavailable', 'Goals could not be loaded.');
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

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals)).catch(() => {
      Alert.alert('Save failed', 'Your goals could not be saved on this device.');
    });
  }, [goals, loaded]);

  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);
  const completed = goals.filter((goal) => goal.saved >= goal.target).length;

  function openCreate() {
    setEditingId(null);
    setName('');
    setTargetText('');
    setSavedText('0');
    setDeadline('');
    setModalVisible(true);
  }

  function openEdit(goal: Goal) {
    setEditingId(goal.id);
    setName(goal.name);
    setTargetText(String(goal.target));
    setSavedText(String(goal.saved));
    setDeadline(goal.deadline);
    setModalVisible(true);
  }

  function saveGoal() {
    const cleanName = name.trim();
    const target = Number(targetText);
    const saved = Number(savedText);

    if (!cleanName) {
      Alert.alert('Name required', 'Enter a name for your savings goal.');
      return;
    }

    if (!targetText.trim() || !Number.isFinite(target) || target <= 0) {
      Alert.alert('Invalid target', 'Enter a target amount greater than ₹0.');
      return;
    }

    if (
      !savedText.trim() ||
      !Number.isFinite(saved) ||
      saved < 0 ||
      saved > target
    ) {
      Alert.alert(
        'Invalid savings',
        'Saved amount must be between ₹0 and the target amount.',
      );
      return;
    }

    if (!validDate(deadline)) {
      Alert.alert('Invalid deadline', 'Enter a real date in YYYY-MM-DD format.');
      return;
    }

    setGoals((current) => {
      if (editingId) {
        return current.map((goal) =>
          goal.id === editingId
            ? { ...goal, name: cleanName, target, saved, deadline }
            : goal,
        );
      }

      return [
        ...current,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: cleanName,
          target,
          saved,
          deadline,
        },
      ];
    });

    setModalVisible(false);
  }

  function addSavings(goal: Goal) {
    if (goal.saved >= goal.target) {
      Alert.alert('Goal completed', 'This goal has already reached its target.');
      return;
    }

    Alert.prompt?.(
      'Add savings',
      `How much would you like to add to ${goal.name}?`,
    );
    // A cross-platform amount-entry dialog is implemented below instead.
    setEditingId(goal.id);
    setName(goal.name);
    setTargetText(String(goal.target));
    setSavedText('');
    setDeadline(goal.deadline);
    setModalVisible(true);
  }

  function deleteGoal(goal: Goal) {
    Alert.alert(
      'Delete goal?',
      `Delete "${goal.name}" and its saved progress?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            setGoals((current) =>
              current.filter((item) => item.id !== goal.id),
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
            <Text style={styles.eyebrow}>BUILD YOUR FUTURE</Text>
            <Text style={styles.title}>Savings goals</Text>
            <Text style={styles.subtitle}>Small steps. Bigger milestones.</Text>
          </View>

          <Pressable style={styles.addButton} onPress={openCreate}>
            <Text style={styles.addButtonText}>+ New</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>TOTAL SAVED TOWARD GOALS</Text>
          <Text style={styles.heroAmount}>{money(totalSaved)}</Text>

          <View style={styles.heroDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>TOTAL TARGET</Text>
              <Text style={styles.summaryValue}>{money(totalTarget)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>GOALS REACHED</Text>
              <Text style={styles.summaryValue}>
                {completed} / {goals.length}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.heroFootnote}>
            {totalTarget > 0
              ? `${Math.round((totalSaved / totalTarget) * 100)}% of your combined target`
              : 'Create your first goal to get started'}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your goals</Text>
            <Text style={styles.sectionSubtitle}>
              Track progress at your own pace
            </Text>
          </View>
          <Text style={styles.count}>{goals.length} total</Text>
        </View>

        {!loaded ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Loading goals…</Text>
          </View>
        ) : goals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>◎</Text>
            <Text style={styles.emptyTitle}>What are you saving for?</Text>
            <Text style={styles.emptyText}>
              A new laptop, a trip, an emergency fund — define your target and
              keep track of your progress here.
            </Text>
            <Pressable style={styles.primaryButton} onPress={openCreate}>
              <Text style={styles.primaryButtonText}>Create a savings goal</Text>
            </Pressable>
          </View>
        ) : (
          goals.map((goal) => {
            const percentage = Math.min((goal.saved / goal.target) * 100, 100);
            const remaining = Math.max(goal.target - goal.saved, 0);
            const days = daysUntil(goal.deadline);
            const isComplete = goal.saved >= goal.target;

            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalIcon}>
                    <Text style={styles.goalIconText}>
                      {isComplete ? '✓' : goal.name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalDeadline}>
                      {isComplete
                        ? 'Target reached'
                        : days === null
                          ? `Deadline: ${goal.deadline}`
                          : days < 0
                            ? `${Math.abs(days)} days past deadline`
                            : days === 0
                              ? 'Deadline is today'
                              : `${days} days remaining · ${goal.deadline}`}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${goal.name}`}
                    onPress={() => openEdit(goal)}
                    hitSlop={8}
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </Pressable>
                </View>

                <View style={styles.amountRow}>
                  <Text style={styles.savedAmount}>{money(goal.saved)}</Text>
                  <Text style={styles.targetAmount}>
                    of {money(goal.target)}
                  </Text>
                  <Text style={styles.percentage}>
                    {Math.round(percentage)}%
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: isComplete
                          ? colors.success
                          : colors.primary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.goalFooter}>
                  <Text style={styles.remainingText}>
                    {isComplete ? 'Well done!' : `${money(remaining)} to go`}
                  </Text>
                  <View style={styles.footerActions}>
                    {!isComplete && (
                      <Pressable
                        style={styles.contributeButton}
                        onPress={() => addSavings(goal)}
                      >
                        <Text style={styles.contributeText}>+ Add savings</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => deleteGoal(goal)}
                      hitSlop={8}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Keep in mind</Text>
          <Text style={styles.noteText}>
            Goal progress is a manual tracker, not a bank balance or a transfer.
            Updating a goal does not move money or modify transactions.
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
              {editingId ? 'Update savings goal' : 'Create a goal'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Define a target, current savings, and deadline.
            </Text>

            <Text style={styles.inputLabel}>GOAL NAME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. New laptop"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              maxLength={50}
            />

            <Text style={styles.inputLabel}>TARGET AMOUNT (₹)</Text>
            <TextInput
              value={targetText}
              onChangeText={setTargetText}
              placeholder="e.g. 80000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              style={styles.input}
              maxLength={12}
            />

            <Text style={styles.inputLabel}>ALREADY SAVED (₹)</Text>
            <TextInput
              value={savedText}
              onChangeText={setSavedText}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              style={styles.input}
              maxLength={12}
            />

            <Text style={styles.inputLabel}>DEADLINE (YYYY-MM-DD)</Text>
            <TextInput
              value={deadline}
              onChangeText={setDeadline}
              placeholder="2027-06-30"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              maxLength={10}
              autoCapitalize="none"
            />

            <Pressable style={styles.primaryButton} onPress={saveGoal}>
              <Text style={styles.primaryButtonText}>
                {editingId ? 'Save changes' : 'Create goal'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: { color: colors.text, fontSize: 27, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginLeft: spacing.md,
  },
  addButtonText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heroAmount: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  summaryRow: { flexDirection: 'row', gap: spacing.lg },
  summaryItem: { flex: 1 },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: spacing.xs,
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
    backgroundColor: colors.primary,
  },
  heroFootnote: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  count: { color: colors.textSecondary, fontSize: 11 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  emptyIcon: { color: colors.primary, fontSize: 38, marginBottom: spacing.sm },
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
    marginBottom: spacing.md,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  goalIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconText: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  goalInfo: { flex: 1 },
  goalName: { color: colors.text, fontSize: 14, fontWeight: '800' },
  goalDeadline: { color: colors.textSecondary, fontSize: 10, marginTop: 4 },
  editText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  savedAmount: { color: colors.text, fontSize: 19, fontWeight: '800' },
  targetAmount: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  percentage: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  goalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  remainingText: { color: colors.textSecondary, fontSize: 11 },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  contributeButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  contributeText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  deleteButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xs },
  deleteText: { color: colors.danger, fontSize: 11, fontWeight: '700' },
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
  noteText: { color: colors.textSecondary, fontSize: 11, lineHeight: 17 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  backdropDismiss: { flex: 1 },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '92%',
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  input: {
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
  },
  cancelButton: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
  cancelText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
});
