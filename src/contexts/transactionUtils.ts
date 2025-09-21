import { Transaction, Campaign, Contribution } from '../types/transaction';

// Utility function to validate country
export const isValidCountry = (country: string): country is 'mozambique' | 'rwanda' => {
  return country === 'mozambique' || country === 'rwanda';
};

// Helper function to format currency
export const formatCurrency = (amount: number, currency: 'MZN' | 'RWF'): string => {
  return new Intl.NumberFormat(currency === 'MZN' ? 'pt-MZ' : 'en-RW', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to calculate fees
export const calculateTransactionFee = (amount: number, rate: number = 0.05): number => {
  return Math.round(amount * rate * 100) / 100; // Rounds to 2 decimal places
};

// Helper function to convert between MZN and RWF
export const convertAmount = (
  amount: number, 
  from: 'MZN' | 'RWF', 
  to: 'MZN' | 'RWF',
  exchangeRates: { MZN_to_RWF: number, RWF_to_MZN: number }
): number => {
  if (from === to) return amount;
  return from === 'MZN' 
    ? amount * exchangeRates.MZN_to_RWF 
    : amount * exchangeRates.RWF_to_MZN;
};

// Generate a unique transaction reference
export const generateTransactionReference = (prefix: string = 'TXN'): string => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};
