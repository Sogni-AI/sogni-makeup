import type { TokenType } from '@/types/wallet';

const PAYMENT_METHOD_KEY = 'sogni_payment_method';

export function getPaymentMethod(): TokenType {
  try {
    const stored = localStorage.getItem(PAYMENT_METHOD_KEY);
    if (stored === 'spark' || stored === 'sogni') {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read payment method from localStorage:', error);
  }
  return 'spark';
}

export function setPaymentMethod(tokenType: TokenType): void {
  try {
    localStorage.setItem(PAYMENT_METHOD_KEY, tokenType);
  } catch (error) {
    console.warn('Failed to save payment method to localStorage:', error);
  }
}

export function formatTokenAmount(amount: string | number, decimals: number = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  if (num > 0 && num < 0.01) {
    return num.toFixed(4);
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function getTokenLabel(tokenType: TokenType): string {
  return tokenType === 'sogni' ? 'SOGNI' : 'Spark';
}
