import { WEB3AUTH_NETWORK, type Web3AuthOptions } from "@web3auth/modal";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
const network =
  process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK === "mainnet"
    ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET
    : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;

const web3AuthOptions: Web3AuthOptions = {
  clientId: clientId ?? "",
  web3AuthNetwork: network,
};

export const web3AuthContextConfig = {
  web3AuthOptions,
} as const;

export const isWeb3AuthConfigured = Boolean(clientId);
