import { AuthError, useAuth } from '@/features/auth/auth';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const registering = mode === 'register';
  const router = useRouter();
  const { login, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (registering && name.trim().length < 2) {
      setError('Enter your name (at least 2 characters).'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.'); return;
    }
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.'); return;
    }
    if (registering && !(/[A-Za-z]/.test(password) && /[0-9]/.test(password))) {
      setError('Use at least one letter and one number.'); return;
    }
    if (registering && password !== confirm) {
      setError('Passwords do not match.'); return;
    }

    setBusy(true);
    try {
      if (registering) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      router.replace('/');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Unable to complete the request. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.logo}><Text style={s.logoText}>F</Text></View>
          <Text style={s.brand}>F I N O V A</Text>
          <Text style={s.heading}>
            {registering ? 'Create your account' : 'Welcome back'}
          </Text>
          <Text style={s.subtitle}>
            {registering ? 'Create your Finova account.' : 'Sign in to access your account.'}
          </Text>

          {registering && <>
            <Text style={s.label}>Full name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Your name"
              placeholderTextColor={colors.textSecondary} autoCapitalize="words" style={s.input} />
          </>}

          <Text style={s.label}>Email address</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary} keyboardType="email-address"
            autoCapitalize="none" autoCorrect={false} style={s.input} />

          <Text style={s.label}>Password</Text>
          <View style={s.passwordRow}>
            <TextInput value={password} onChangeText={setPassword}
              placeholder="At least 8 characters" placeholderTextColor={colors.textSecondary}
              secureTextEntry={!visible} autoCapitalize="none" style={s.password} />
            <Pressable onPress={() => setVisible(v => !v)}>
              <Text style={s.toggle}>{visible ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>

          {registering && <>
            <Text style={s.label}>Confirm password</Text>
            <TextInput value={confirm} onChangeText={setConfirm}
              placeholder="Re-enter password" placeholderTextColor={colors.textSecondary}
              secureTextEntry={!visible} autoCapitalize="none" style={s.input} />
          </>}

          {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}

          <Pressable onPress={submit} disabled={busy} style={s.button}>
            {busy ? <ActivityIndicator color={colors.white} /> :
              <Text style={s.buttonText}>{registering ? 'Create account' : 'Sign in'}</Text>}
          </Pressable>

          <View style={s.footer}>
            <Text style={s.footerText}>
              {registering ? 'Already have a profile? ' : 'New to Finova? '}
            </Text>
            <Link href={registering ? '/auth/login' : '/auth/register'} style={s.link}>
              {registering ? 'Sign in' : 'Create account'}
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, paddingVertical: spacing.xxl },
  logo: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  logoText: { color: colors.white, fontSize: 32, fontWeight: '800' },
  brand: { color: colors.primary, textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.xl, fontWeight: '800', letterSpacing: 2 },
  heading: { color: colors.text, textAlign: 'center', fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  notice: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  noticeTitle: { color: colors.primary, fontWeight: '800', fontSize: 11, marginBottom: spacing.xs },
  noticeText: { color: colors.text, fontSize: 12, lineHeight: 18 },
  label: { color: colors.text, fontWeight: '700', fontSize: 13, marginTop: spacing.md, marginBottom: spacing.sm },
  input: { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.lg, fontSize: 15 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg },
  password: { flex: 1, color: colors.text, paddingVertical: 15, fontSize: 15 },
  toggle: { color: colors.primary, fontWeight: '700', paddingLeft: spacing.sm },
  error: { color: colors.danger, marginTop: spacing.md, fontSize: 13 },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', minHeight: 54, marginTop: spacing.xl },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  disclaimer: { color: colors.textSecondary, textAlign: 'center', fontSize: 11, marginTop: spacing.xl },
});
