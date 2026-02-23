import { useState, useCallback, useEffect } from 'react';
import { useSogniAuth } from '@/services/sogniAuth';
import type { TokenType, Balances } from '@/types/wallet';
import { getPaymentMethod, setPaymentMethod as savePaymentMethod } from '@/services/walletService';
import useEntity from '@/hooks/useEntity';

// Stable getter - defined outside component to prevent re-creation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBalanceFromAccount(currentAccount: any): Balances | null {
  if (!currentAccount?.balance) {
    return null;
  }
  return currentAccount.balance as Balances;
}

const PAYMENT_METHOD_CHANGE_EVENT = 'payment-method-change';

export function useWallet() {
  const { isAuthenticated, authMode, getSogniClient } = useSogniAuth();
  const [tokenType, setTokenType] = useState<TokenType>(getPaymentMethod());

  useEffect(() => {
    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent<TokenType>;
      setTokenType(customEvent.detail);
    };
    window.addEventListener(PAYMENT_METHOD_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(PAYMENT_METHOD_CHANGE_EVENT, handleChange);
  }, []);

  const switchPaymentMethod = useCallback((newType: TokenType) => {
    setTokenType(newType);
    savePaymentMethod(newType);
    window.dispatchEvent(new CustomEvent(PAYMENT_METHOD_CHANGE_EVENT, { detail: newType }));
  }, []);

  const sogniClient = getSogniClient();

  const balances = useEntity(
    sogniClient?.account?.currentAccount || null,
    getBalanceFromAccount,
  );

  const finalBalances = (isAuthenticated && authMode !== 'demo') ? balances : null;

  return {
    balances: finalBalances,
    tokenType,
    switchPaymentMethod,
  };
}
