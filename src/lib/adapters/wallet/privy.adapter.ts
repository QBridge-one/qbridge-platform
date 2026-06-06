// ============================================================
// lib/adapters/wallet/privy.adapter.ts
//
// Privy adapter — implements WalletPort.
// Direct analogue of web3auth.adapter.ts: Privy embedded wallets surface
// as wagmi connectors (via @privy-io/wagmi), so signing / sending go
// through the same wagmi core (imperative) actions — NOT hooks.
//
// The wagmi config MUST be the one from Privy's WagmiProvider (with the
// embedded-wallet connector). PrivyWalletStateSync injects it via
// setWagmiConfig. Fallback to lib/privy-wagmi-config.ts only before sync.
// ============================================================

import {
  sendTransaction as wagmiSendTransaction,
  signMessage as wagmiSignMessage,
  signTypedData as wagmiSignTypedData,
  switchChain as wagmiSwitchChain,
} from "@wagmi/core";
import type { Config } from "wagmi";
import { privyWagmiConfig } from "@/lib/privy-wagmi-config";

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

export class PrivyWalletAdapter implements WalletPort {
  private stateListeners: Set<(state: WalletState) => void> = new Set();
  /** Config from Privy WagmiProvider — has the embedded-wallet connector. Set by PrivyWalletStateSync. */
  private wagmiConfigRef: Config | null = null;

  /** Called by PrivyWalletStateSync — use the config from WagmiProvider (has Privy connector). */
  setWagmiConfig(config: Config): void {
    this.wagmiConfigRef = config;
  }

  private getConfig(): Config {
    return this.wagmiConfigRef ?? privyWagmiConfig;
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
  // Connect/disconnect are UI-driven via useWallet hook. The Privy
  // embedded wallet is provisioned on Clerk login (createOnLogin) and
  // surfaced through wagmi by PrivyWalletStateSync — there is no modal.
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
    if (!this.currentState.address) {
      throw providerNotInitialized("Privy: wallet not connected");
    }
    return this.currentState.address;
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
      const result = await wagmiSignMessage(this.getConfig(), { message });
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
      // Derive primaryType — first key that isn't EIP712Domain
      const primaryType = Object.keys(types as object).find(
        (k) => k !== "EIP712Domain",
      ) ?? "";
      const result = await wagmiSignTypedData(this.getConfig(), {
        domain: domain as any,
        types: types as any,
        primaryType,
        message: value as any,
      });
      return result as Hex;
    } catch (err) {
      throw normalizeToDomainError(err);
    }
  }

  // ── Transactions ───────────────────────────────────────────
  async sendTransaction(request: TransactionRequest): Promise<Hex> {
    try {
      const result = await wagmiSendTransaction(this.getConfig(), {
        to: request.to,
        data: request.data,
        value: request.value,
        chainId: request.chainId as 1 | 11155111 | 137 | undefined,
      });
      // wagmi sendTransaction returns { hash }
      return (result as unknown as { hash: Hex }).hash ?? (result as unknown as Hex);
    } catch (err) {
      throw normalizeToDomainError(err);
    }
  }

  // ── Chain ──────────────────────────────────────────────────
  async switchChain(chainId: ChainId): Promise<void> {
    try {
      await wagmiSwitchChain(this.getConfig(), { chainId: chainId as 1 | 11155111 | 137 });
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
    return this.currentState.isConnected && !!this.currentState.address;
  }

  onStateChange(callback: (state: WalletState) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }
}

export const privyAdapter = new PrivyWalletAdapter();
