import { createPublicClient, http } from "viem";
import type { Chain } from "viem";
import { sepolia, mainnet, polygon } from "viem/chains";
import type { BroadcastPort } from "../../ports/broadcast.port";
import type { Hex } from "../../core/types";

const CHAIN_MAP: Record<number, Chain> = {
  11155111: sepolia,
  1: mainnet,
  137: polygon,
};

class ViemBroadcastAdapter implements BroadcastPort {
  async sendRawTransaction(signedTx: string, chainId: number): Promise<string> {
    const chain = CHAIN_MAP[chainId];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });
    return publicClient.sendRawTransaction({
      serializedTransaction: signedTx as Hex,
    });
  }
}

export const viemBroadcastAdapter = new ViemBroadcastAdapter();
