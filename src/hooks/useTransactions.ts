import { useContext } from 'react';
import { TransactionContext } from '../contexts/TransactionContext';
import type { TransactionContextType } from '../types/transaction';

export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export default useTransactions;
