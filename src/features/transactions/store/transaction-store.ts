import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { transactions as initialTransactions } from '@/features/dashboard/data/mock-transactions';
import type { Transaction } from '@/features/transactions/types';

type TransactionState = {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
};

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: initialTransactions,

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions],
        })),
    }),
    {
      name: 'finova-transactions-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Opening balance is chosen so the original demo balance remains ₹124,850.
export const DEMO_OPENING_BALANCE = 62974;

export function calculateBalance(transactions: Transaction[]) {
  return transactions.reduce(
    (balance, transaction) =>
      balance +
      (transaction.type === 'income'
        ? transaction.amount
        : -transaction.amount),
    DEMO_OPENING_BALANCE,
  );
}

function parseTransactionDate(value: string): Date | null {
  const directDate = new Date(value);

  if (Number.isFinite(directDate.getTime())) {
    return directDate;
  }

  const relativeMatch = /^(Today|Yesterday),\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value);

  if (relativeMatch) {
    const [, relativeDay, hourText, minuteText, period] = relativeMatch;
    const date = new Date();

    if (relativeDay.toLowerCase() === 'yesterday') {
      date.setDate(date.getDate() - 1);
    }

    let hour = Number(hourText) % 12;
    if (period.toUpperCase() === 'PM') hour += 12;

    date.setHours(hour, Number(minuteText), 0, 0);
    return date;
  }

  // Support previously saved dates formatted with the en-IN locale.
  const legacyMatch =
    /^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4}),?\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(value);

  if (legacyMatch) {
    const [, day, monthName, year, hourText, minuteText, period] = legacyMatch;
    const monthIndex = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    ].indexOf(monthName.slice(0, 3).toLowerCase());

    if (monthIndex >= 0) {
      let hour = Number(hourText) % 12;
      if (period.toLowerCase() === 'pm') hour += 12;

      const date = new Date(
        Number(year),
        monthIndex,
        Number(day),
        hour,
        Number(minuteText),
      );

      if (Number.isFinite(date.getTime())) return date;
    }
  }

  return null;
}

export function calculateTotals(transactions: Transaction[]) {
  const now = new Date();

  return transactions.reduce(
    (totals, transaction) => {
      const date = parseTransactionDate(transaction.date);

      // Exclude dates that cannot be reliably interpreted.
      if (
        !date ||
        date.getFullYear() !== now.getFullYear() ||
        date.getMonth() !== now.getMonth()
      ) {
        return totals;
      }

      if (transaction.type === 'income') {
        totals.income += transaction.amount;
      } else {
        totals.expenses += transaction.amount;
      }

      return totals;
    },
    { income: 0, expenses: 0 },
  );
}
