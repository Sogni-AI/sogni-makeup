export type TokenType = 'spark' | 'sogni';

export interface TokenBalance {
  net: string;
  settled: string;
  credit: string;
  debit: string;
  premiumCredit?: string;
}

export interface Balances {
  spark: TokenBalance;
  sogni: TokenBalance;
}
