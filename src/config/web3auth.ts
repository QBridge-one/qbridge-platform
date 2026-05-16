import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK, type Web3AuthOptions } from "@web3auth/modal";
import type { CustomChainConfig } from "@web3auth/no-modal";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
const isMainnet = process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK === "mainnet";

// Public RPCs as a fallback. Override per-chain in .env for reliability.
const SEPOLIA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
const MAINNET_RPC = process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
const POLYGON_RPC = process.env.NEXT_PUBLIC_POLYGON_RPC_URL ?? "https://polygon-bor-rpc.publicnode.com";

const SEPOLIA: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7", // 11155111
  rpcTarget: SEPOLIA_RPC,
  displayName: "Sepolia",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "",
  decimals: 18,
  isTestnet: true,
};

const MAINNET: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x1", // 1
  rpcTarget: MAINNET_RPC,
  displayName: "Ethereum",
  blockExplorerUrl: "https://etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "",
  decimals: 18,
};

const POLYGON: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x89", // 137
  rpcTarget: POLYGON_RPC,
  displayName: "Polygon",
  blockExplorerUrl: "https://polygonscan.com",
  ticker: "POL",
  tickerName: "Polygon",
  logo: "",
  decimals: 18,
};

const chains: CustomChainConfig[] = isMainnet ? [MAINNET, POLYGON] : [SEPOLIA];
const defaultChainId = isMainnet ? "0x1" : "0xaa36a7";

const web3AuthOptions: Web3AuthOptions = {
  clientId: clientId ?? "",
  web3AuthNetwork: isMainnet
    ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET
    : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  chains,
  defaultChainId,
};

export const web3AuthContextConfig = {
  web3AuthOptions,
} as const;

export const isWeb3AuthConfigured = Boolean(clientId);
