import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/features/auth/auth';
import { colors } from '@/theme/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnReconnect: true },
  },
});

function Navigation() {
  const { user, ready } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const authRoute = segments[0] === 'auth';
    if (!user && !authRoute) router.replace('/auth/login');
    if (user && authRoute) router.replace('/');
  }, [ready, user, segments, router]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'slide_from_right',
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="budgets" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="scheduled-payments" />
      <Stack.Screen name="cards" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="transfer" />
      <Stack.Screen name="transfer/review" />
      <Stack.Screen name="transaction/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </QueryClientProvider>
  );
}
