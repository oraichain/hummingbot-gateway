import { DecodedTxRaw } from '@cosmjs/proto-signing';
export interface AuraBalanceRequest {
  address: string; // the user's Aura address as Bech32
  tokenSymbols: string[]; // a list of token symbol
}

export interface AuraBalanceResponse {
  network: string;
  timestamp: number;
  latency: number;
  balances: Record<string, string>;
}

export interface AuraTokenRequest {
  address: string;
  token: string;
}

export interface AuraPollRequest {
  txHash: string;
}

export enum TransactionResponseStatusCode {
  FAILED = -1,
  CONFIRMED = 1,
}

export interface AuraPollResponse {
  network: string;
  timestamp: number;
  txHash: string;
  currentBlock: number;
  txBlock: number;
  gasUsed: number;
  gasWanted: number;
  txData: DecodedTxRaw | null;
}
