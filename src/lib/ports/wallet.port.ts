// ============================================================
// lib/ports/wallet.port.ts
// WalletProvider port — the primary port for all wallet operations.
// Every wallet adapter (Privy, Alchemy, injected) implements this.
// Application code ONLY imports this interface, never an adapter directly.
// ============================================================

import type {
  Address, ChainId, Hex, WalletState,
  TransactionRequest, TransactionResult,
  SmartAccountConfig,
} from "../core/types";

export interface WalletPort {
  // ── Connection ───────────────────────────────────────────
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getState(): WalletState;

  // ── Identity ─────────────────────────────────────────────
  getAddress(): Promise<Address>;
  getChainId(): Promise<ChainId>;

  // ── Signing ──────────────────────────────────────────────
  signMessage(message: string): Promise<Hex>;
  signTypedData(domain: unknown, types: unknown, value: unknown): Promise<Hex>;

  // ── Transactions ─────────────────────────────────────────
  // sendTransaction is the main write primitive.
  // Privy adapter: produces a regular EOA transaction.
  // Alchemy adapter: produces a UserOperation (ERC-4337).
  // The caller never knows the difference.
  sendTransaction(request: TransactionRequest): Promise<Hex>;

  // ── Chain ────────────────────────────────────────────────
  switchChain(chainId: ChainId): Promise<void>;

  // ── Smart account (optional capability) ──────────────────
  // Returns null if the adapter does not support smart accounts.
  // Alchemy adapter implements this. Privy (EOA) adapter returns null.
  getSmartAccountConfig(): SmartAccountConfig | null;

  // ── Lifecycle ────────────────────────────────────────────
  isReady(): boolean;
  onStateChange(callback: (state: WalletState) => void): () => void; // returns unsubscribe
}
