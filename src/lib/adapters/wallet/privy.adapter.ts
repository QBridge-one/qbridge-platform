// ============================================================
// lib/adapters/wallet/privy.adapter.ts
//
// Privy adapter — implements WalletPort. Both injected by PrivyWalletStateSync:
//
//   - sendTransaction → Privy's native `useSendTransaction` (`privySend`),
//     which supports gas sponsorship (`sponsor`) and a pre-sign confirmation
//     modal (`uiOptions`). Falls back to the raw provider if not yet injected.
//   - signMessage / signTypedData → the embedded wallet's own EIP-1193
//     provider (`wallet.getEthereumProvider()`).
//
// Both reach the embedded wallet's MPC signer. We deliberately do NOT use
// @wagmi/core's imperative sendTransaction — for embedded wallets it routes to
// a read-only RPC transport instead of the signer (viem 2.52 then probes
// `wallet_sendTransaction`, which the RPC rejects). Wagmi is used for READS
// only (useAccount / useReadContract) via the Privy WagmiProvider.
// ============================================================

import type { WalletPort } from "../../ports/wallet.port";
import type {
  Address, ChainId, Hex, WalletState,
  TransactionRequest, SmartAccountConfig,
} from "../../core/types";
import {
  normalizeToDomainError,
  providerNotInitialized,
  adapterNotImplemented,
} from "../../core/errors";
import { privySponsorGas } from "@/config/privy";

/** Minimal EIP-1193 shape — the embedded wallet's provider. */
type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

/** Privy's `useSendTransaction().sendTransaction`, injected from React.
 *  Preferred over the raw provider for sends because it supports native
 *  gas sponsorship (`sponsor`) and a pre-sign confirmation UI (`uiOptions`). */
type PrivySendTransaction = (
  input: {
    from?: string;
    to?: string;
    data?: string;
    value?: string;
    chainId?: number;
  },
  options?: {
    sponsor?: boolean;
    uiOptions?: { showWalletUIs?: boolean; description?: string };
  },
) => Promise<{ hash: `0x${string}` }>;

export class PrivyWalletAdapter implements WalletPort {
  private stateListeners: Set<(state: WalletState) => void> = new Set();

  /** The embedded wallet's EIP-1193 provider. Set by PrivyWalletStateSync. */
  private provider: Eip1193Provider | null = null;

  /** Privy's native send fn (gas sponsorship + confirm UI). Set by
   *  PrivyWalletStateSync. Falls back to the raw provider if unset. */
  private privySend: PrivySendTransaction | null = null;

  /** Called by PrivyWalletStateSync with the embedded wallet's provider
   *  (or null when no embedded wallet is connected). */
  setProvider(provider: Eip1193Provider | null): void {
    this.provider = provider;
  }

  /** Called by PrivyWalletStateSync with Privy's useSendTransaction fn. */
  setPrivySendTransaction(fn: PrivySendTransaction | null): void {
    this.privySend = fn;
  }

  private requireProvider(): Eip1193Provider {
    if (!this.provider) {
      throw providerNotInitialized("Privy: embedded wallet provider not ready");
    }
    return this.provider;
  }

  private requireAddress(): Address {
    if (!this.currentState.address) {
      throw providerNotInitialized("Privy: wallet not connected");
    }
    return this.currentState.address;
  }

  private currentState: WalletState = {
    isConnected: false,
    address: null,
    chainId: null,
    walletType: "embedded",
    isSmartAccount: false,
    isSafe: false,
  };

  // ── Connection ─────────────────────────────────────────────
  // Connect/disconnect are UI-driven via the useWallet hook. The embedded
  // wallet is provisioned on Clerk login and surfaced through wagmi by
  // PrivyWalletStateSync — there is no modal.
  async connect(): Promise<void> {
    throw adapterNotImplemented("PrivyWalletAdapter.connect — use useWallet().connect() in UI");
  }

  async disconnect(): Promise<void> {
    throw adapterNotImplemented("PrivyWalletAdapter.disconnect — use useWallet().disconnect() in UI");
  }

  getState(): WalletState {
    return this.currentState;
  }

  // Called by PrivyWalletStateSync on every wagmi state change
  updateState(state: Partial<WalletState>): void {
    this.currentState = { ...this.currentState, ...state };
    this.stateListeners.forEach((cb) => cb(this.currentState));
  }

  // ── Identity ───────────────────────────────────────────────
  async getAddress(): Promise<Address> {
    return this.requireAddress();
  }

  async getChainId(): Promise<ChainId> {
    if (!this.currentState.chainId) {
      throw providerNotInitialized("Privy: wallet not connected");
    }
    return this.currentState.chainId;
  }

  // ── Signing ────────────────────────────────────────────────
  async signMessage(message: string): Promise<Hex> {
    try {
      const from = this.requireAddress();
      const result = await this.requireProvider().request({
        method: "personal_sign",
        params: [message, from],
      });
      return result as Hex;
    } catch (err) {
      throw normalizeToDomainError(err);
    }
  }

  async signTypedData(
    domain: unknown,
    types: unknown,
    value: unknown,
  ): Promise<Hex> {
    try {
      const from = this.requireAddress();
      // Derive primaryType — first key that isn't EIP712Domain
      const primaryType =
        Object.keys(types as object).find((k) => k !== "EIP712Domain") ?? "";
      const typedData = { domain, types, primaryType, message: value };
      const result = await this.requireProvider().request({
        method: "eth_signTypedData_v4",
        params: [from, JSON.stringify(typedData)],
      });
      return result as Hex;
    } catch (err) {
      throw normalizeToDomainError(err);
    }
  }

  // ── Transactions ───────────────────────────────────────────
  async sendTransaction(request: TransactionRequest): Promise<Hex> {
    try {
      const from = this.requireAddress();
      const value =
        request.value !== undefined && request.value !== BigInt(0)
          ? `0x${request.value.toString(16)}`
          : undefined;

      // Preferred: Privy's native send — applies gas sponsorship (per the
      // dashboard policy) and shows a pre-sign confirmation for on-chain
      // writes. chainId is passed so Privy targets the right network.
      if (this.privySend) {
        const { hash } = await this.privySend(
          {
            from,
            to: request.to,
            ...(request.data ? { data: request.data } : {}),
            ...(value ? { value } : {}),
            ...(request.chainId ? { chainId: request.chainId } : {}),
          },
          {
            sponsor: privySponsorGas,
            uiOptions: {
              showWalletUIs: true,
              ...(request.confirmation?.description
                ? { description: request.confirmation.description }
                : {}),
            },
          },
        );
        return hash as Hex;
      }

      // Fallback: raw EIP-1193 provider (no sponsorship / no confirm UI).
      const tx: Record<string, string> = { from, to: request.to };
      if (request.data) tx.data = request.data;
      if (value) tx.value = value;
      const hash = await this.requireProvider().request({
        method: "eth_sendTransaction",
        params: [tx],
      });
      return hash as Hex;
    } catch (err) {
      throw normalizeToDomainError(err);
    }
  }

  // ── Chain ──────────────────────────────────────────────────
  async switchChain(chainId: ChainId): Promise<void> {
    try {
      await this.requireProvider().request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      this.updateState({ chainId });
    } catch (err) {
      throw normalizeToDomainError(err);
    }
  }

  // ── Smart account ──────────────────────────────────────────
  getSmartAccountConfig(): SmartAccountConfig | null {
    return null; // Privy embedded wallet = EOA only
  }

  // ── Lifecycle ──────────────────────────────────────────────
  isReady(): boolean {
    return (
      this.currentState.isConnected &&
      !!this.currentState.address &&
      (!!this.privySend || !!this.provider)
    );
  }

  onStateChange(callback: (state: WalletState) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }
}

export const privyAdapter = new PrivyWalletAdapter();
