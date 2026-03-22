export interface TransactionIntent {
  intentId: string;
  calldata: string;
  target: string;
  caller: string;
  chainId: number;
  expiresAt: number;
}

export interface IntentPort {
  store(intent: TransactionIntent): Promise<void>;
  get(intentId: string): Promise<TransactionIntent | null>;
  consume(intentId: string): Promise<TransactionIntent | null>;
}
