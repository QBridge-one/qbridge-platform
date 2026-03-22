// ============================================================
// lib/adapters/wallet/alchemy.adapter.ts
//
// Alchemy smart account adapter — implements WalletPort.
// ERC-4337 UserOperations, gas sponsorship, Safe multisig support.
//
// STATUS: STUB — not yet implemented.
// All methods throw adapterNotImplemented().
// This file exists so:
//   1. TypeScript is satisfied — interface is complete
//   2. Your team has a clear contract to implement against
//   3. The container can reference it today
//
// TO IMPLEMENT:
//   npm install @alchemy/aa-core @alchemy/aa-alchemy @alchemy/aa-accounts
//   Follow: https://accountkit.alchemy.com/react/quickstart
// ============================================================

import type { WalletPort } from "../../ports/wallet.port";
import type {
  Address, ChainId, Hex, WalletState,
  TransactionRequest, SmartAccountConfig,
} from "../../core/types";
import { adapterNotImplemented } from "../../core/errors";

export class AlchemyAdapter implements WalletPort {
  // TODO: inject AlchemyProvider, Gas Manager policy ID, Safe config
  constructor(
    private readonly config: {
      apiKey: string;
      gasPolicyId?: string;
      chainId: ChainId;
    }
  ) {}

  async connect(): Promise<void> {
    // TODO: initialize Alchemy Account Kit
    // const provider = await createSmartAccountClient(...)
    throw adapterNotImplemented("AlchemyAdapter.connect");
  }

  async disconnect(): Promise<void> {
    // TODO: clear Alchemy session
    throw adapterNotImplemented("AlchemyAdapter.disconnect");
  }

  getState(): WalletState {
    // TODO: return real state from Alchemy account
    return {
      isConnected: false,
      address: null,
      chainId: this.config.chainId,
      walletType: "smart_account",
      isSmartAccount: true,
      isSafe: false,
    };
  }

  async getAddress(): Promise<Address> {
    // TODO: return smart account address (counterfactual if not deployed)
    throw adapterNotImplemented("AlchemyAdapter.getAddress");
  }

  async getChainId(): Promise<ChainId> {
    return this.config.chainId;
  }

  async signMessage(_message: string): Promise<Hex> {
    // TODO: sign via Alchemy smart account
    throw adapterNotImplemented("AlchemyAdapter.signMessage");
  }

  async signTypedData(_domain: unknown, _types: unknown, _value: unknown): Promise<Hex> {
    // TODO: signTypedData via Alchemy smart account
    throw adapterNotImplemented("AlchemyAdapter.signTypedData");
  }

  async sendTransaction(request: TransactionRequest): Promise<Hex> {
    // TODO: build UserOperation and send via Alchemy bundler
    // const uo = await provider.sendUserOperation({
    //   target: request.to,
    //   data: request.data ?? "0x",
    //   value: request.value ?? 0n,
    // })
    // const hash = await provider.waitForUserOperationTransaction(uo.hash)
    // return hash
    //
    // Gas sponsorship is applied automatically if:
    //   - gasPolicyId is set in config
    //   - the function selector is covered by the policy
    throw adapterNotImplemented("AlchemyAdapter.sendTransaction");
  }

  async switchChain(_chainId: ChainId): Promise<void> {
    // TODO: Alchemy Account Kit handles chain switching
    throw adapterNotImplemented("AlchemyAdapter.switchChain");
  }

  getSmartAccountConfig(): SmartAccountConfig {
    // TODO: return real smart account config once implemented
    return {
      enabled: true,
      accountAddress: undefined,
      factoryAddress: undefined,
      entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" as Address,
      safeConfig: undefined,
    };
  }

  isReady(): boolean {
    // TODO: return true once Alchemy account is initialized
    return false;
  }

  onStateChange(callback: (state: WalletState) => void): () => void {
    // TODO: subscribe to Alchemy account state changes
    return () => {};
  }
}
