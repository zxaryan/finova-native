export type Transaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  icon: string;
};
