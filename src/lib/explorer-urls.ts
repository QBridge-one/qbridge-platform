// ============================================================
// lib/explorer-urls.ts
// Block explorer links for supported deployment chains.
// ============================================================

export function explorerTxUrl(chainId: number, hash: string): string | null {
  if (chainId === 11155111) return `https://sepolia.etherscan.io/tx/${hash}`;
  if (chainId === 1) return `https://etherscan.io/tx/${hash}`;
  if (chainId === 137) return `https://polygonscan.com/tx/${hash}`;
  return null;
}

export function explorerAddressUrl(chainId: number, address: string): string | null {
  if (chainId === 11155111) return `https://sepolia.etherscan.io/address/${address}`;
  if (chainId === 1) return `https://etherscan.io/address/${address}`;
  if (chainId === 137) return `https://polygonscan.com/address/${address}`;
  return null;
}
