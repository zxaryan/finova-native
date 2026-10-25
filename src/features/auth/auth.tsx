import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type User = { email: string; name: string };
type StoredAccount = { email: string; name: string; passwordHash: string };
type Auth = {
  user: User | null;
  ready: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const ACCOUNT_KEY = 'finova-demo-account-v1';
const SESSION_KEY = 'finova-demo-session-v1';
const Context = createContext<Auth | null>(null);

async function hashPassword(email: string, password: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${email.trim().toLowerCase()}:${password}`,
  );
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(SESSION_KEY)
      .then(value => {
        if (active && value) setUser(JSON.parse(value) as User);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => { active = false; };
  }, []);

  async function register(name: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await AsyncStorage.getItem(ACCOUNT_KEY);
    if (existing) throw new AuthError('An account is already registered on this device. Please sign in.');

    const account: StoredAccount = {
      email: normalizedEmail,
      name: name.trim(),
      passwordHash: await hashPassword(normalizedEmail, password),
    };

    await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    const nextUser = { email: account.email, name: account.name };

    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    } catch (error) {
      await AsyncStorage.removeItem(ACCOUNT_KEY);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const raw = await AsyncStorage.getItem(ACCOUNT_KEY);
    if (!raw) throw new AuthError('No account found. Please register first.');

    const account = JSON.parse(raw) as StoredAccount;
    const candidateHash = await hashPassword(normalizedEmail, password);

    if (
      account.email !== normalizedEmail ||
      account.passwordHash !== candidateHash
    ) {
      throw new AuthError('Incorrect email or password.');
    }

    const nextUser = { email: account.email, name: account.name };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }

  async function logout() {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <Context.Provider value={{ user, ready, register, login, logout }}>
      {children}
    </Context.Provider>
  );
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
