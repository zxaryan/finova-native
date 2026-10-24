import { useQuery } from '@tanstack/react-query';

import { getTransactions } from '@/features/transactions/api';

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: getTransactions,
  });
}
