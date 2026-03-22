export interface BroadcastPort {
  sendRawTransaction(signedTx: string, chainId: number): Promise<string>;
}
