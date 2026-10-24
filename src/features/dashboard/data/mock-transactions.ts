import type { Transaction } from '@/features/transactions/types';

export const transactions: Transaction[] = [
  {
    id: 'txn-1001',
    merchant: 'Salary Deposit',
    category: 'Income',
    amount: 65000,
    date: 'Today, 09:15 AM',
    type: 'income',
    icon: '↙',
  },
  {
    id: 'txn-1002',
    merchant: 'Amazon',
    category: 'Shopping',
    amount: 2499,
    date: 'Today, 11:42 AM',
    type: 'expense',
    icon: 'A',
  },
  {
    id: 'txn-1003',
    merchant: 'Starbucks',
    category: 'Food & Drink',
    amount: 380,
    date: 'Yesterday, 05:30 PM',
    type: 'expense',
    icon: 'S',
  },
  {
    id: 'txn-1004',
    merchant: 'Uber',
    category: 'Transport',
    amount: 245,
    date: 'Yesterday, 08:10 AM',
    type: 'expense',
    icon: 'U',
  },
];
