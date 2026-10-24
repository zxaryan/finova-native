import { apiGet } from '@/services/api/client';
import type { Transaction } from '@/features/transactions/types';

type ApiPost = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

export async function getTransactions(): Promise<Transaction[]> {
  const posts = await apiGet<ApiPost[]>('/posts?_limit=10');

  return posts.map((post) => ({
    id: `api-${post.id}`,
    merchant: post.title
      .split(' ')
      .slice(0, 3)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    category: `Demo · User ${post.userId}`,
    amount: post.id * 125,
    date: `Demo transaction #${post.id}`,
    type: 'expense',
    icon: 'D',
  }));
}
