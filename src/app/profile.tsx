import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/auth';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  function confirmLogout() {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out of Finova?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth/login');
            } catch {
              Alert.alert('Error', 'Could not log out. Please try again.');
            }
          },
        },
      ],
    );
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
          <Text style={styles.title}>My profile</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AP</Text>
          </View>
          <Text style={styles.name}>{user?.name ?? 'Finova User'}</Text>
          <Text style={styles.subtitle}>{user?.email ?? 'Finova account'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Personal information</Text>
        <View style={styles.card}>
          <InfoRow label="Full name" value="Aryan Patel" />
          <InfoRow label="Account type" value="Personal" />
          <InfoRow label="Preferred currency" value="Indian Rupee (INR)" last />
        </View>

        <Text style={styles.sectionTitle}>Manage account</Text>
        <View style={styles.card}>
          <MenuRow
            title="My cards"
            subtitle="View and manage your virtual card"
            onPress={() => router.push('/cards')}
          />
          <MenuRow
            title="Transaction activity"
            subtitle="Review income and spending"
            onPress={() => router.push('/explore')}
            last
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out of Finova"
          onPress={confirmLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutPressed,
          ]}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

        <Text style={styles.footer}>
          Personal details shown here are profile information for this app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.divider]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function MenuRow({
  title,
  subtitle,
  onPress,
  last = false,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.menuRow, !last && styles.divider]}
    >
      <View style={styles.menuCopy}>
        <Text style={styles.value}>{title}</Text>
        <Text style={styles.label}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
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
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  name: { color: colors.text, fontSize: 21, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.xs },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoRow: { paddingVertical: spacing.lg, gap: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { color: colors.textSecondary, fontSize: 12 },
  value: { color: colors.text, fontSize: 14, fontWeight: '600' },
  menuRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  menuCopy: { flex: 1, gap: spacing.xs },
  chevron: { color: colors.textSecondary, fontSize: 26 },
  logoutButton: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  logoutPressed: { opacity: 0.7 },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '800' },
  footer: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
