# MetaMask Embedded Wallets


### Embedded Wallets Web SDK

Integrate MetaMask Embedded Wallets (Web3Auth) with just 4 lines of code. 

Designed to provide seamless and straightforward integration for web applications across all major browsers and javascript frameworks.



### React SDK


### Vue SDK


### Javascript SDK

Consider which sigining scheme your dapp requires before beginning your integration:

| SDK Family | Key Model | Available from |
| --- | --- | --- |
| Embedded Wallet SDKs | SSS (key reconstruction) | Base, Growth, and Scale plans |
| MPC Core Kit SDK | TSS/MPC  (no key reconstruction) | Enterprise plan |

# Embedded Wallets SDK for React


## Overview​

MetaMask Embedded Wallets SDK (formerly Web3Auth Plug and Play) provides a seamless authentication experience for React applications with social logins, external wallets, and more. Our React Hooks simplifies how you connect users to their preferred wallets and manage authentication state.


## Requirements​

- This is a frontend SDK and must be used in a browser environment.
- Basic knowledge of JavaScript and React.


## Prerequisites​

- Set up your project on the [Embedded Wallets dashboard](https://dashboard.web3auth.io/)

See the [dashboard setup](https://docs.metamask.io/embedded-wallets/dashboard/) guide to learn more.


## Installation​

Install the Web3Auth Modal SDK using npm or yarn:

```
yarn add @web3auth/modal

```


### 1. Configuration​

Create a configuration file for Web3Auth. This file will contain your Web3Auth Client ID and Network details from the [Embedded Wallets dashboard](https://dashboard.web3auth.io/).

```
import { type Web3AuthContextConfig } from '@web3auth/modal/react'
import { WEB3AUTH_NETWORK, type Web3AuthOptions } from '@web3auth/modal'

const web3AuthOptions: Web3AuthOptions = {
  clientId: 'YOUR_WEB3AUTH_CLIENT_ID', // Pass your Web3Auth Client ID, ideally using an environment variable // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET, // or WEB3AUTH_NETWORK.SAPPHIRE_DEVNET
}

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions,
}

export default web3AuthContextConfig

```


### 2. Setup Web3Auth provider​

In your main entry file (generally `index.tsx` or `main.tsx`), import the `Web3AuthProvider` component and wrap your application with it:

```
import './index.css'

import ReactDOM from 'react-dom/client'
import { Web3AuthProvider } from '@web3auth/modal/react'
import web3AuthContextConfig from './web3authContext'
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <Web3AuthProvider config={web3AuthContextConfig}>
    <App />
  </Web3AuthProvider>
)

```


## Advanced configuration​

The Web3Auth Modal SDK offers a rich set of advanced configuration options:

- **Smart accounts:** Configure account abstraction parameters.
- **Custom authentication:** Define authentication methods.
- **Whitelabeling and UI customization:** Personalize the modal's appearance.
- **Multi-Factor Authentication (MFA):** Set up and manage MFA.
- **Wallet Services:** Integrate additional Wallet Services.

See the [advanced configuration](https://docs.metamask.io/embedded-wallets/sdk/react/advanced/) section to learn more about each configuration option.

```
import { type Web3AuthContextConfig } from '@web3auth/modal/react'
import { WEB3AUTH_NETWORK, type Web3AuthOptions } from '@web3auth/modal'

const web3AuthOptions: Web3AuthOptions = {
  clientId: 'YOUR_WEB3AUTH_CLIENT_ID', // Pass your Web3Auth Client ID, ideally using an environment variable
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET, // or WEB3AUTH_NETWORK.SAPPHIRE_DEVNET
}

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions,
}

```


## Blockchain integration​

Web3Auth is blockchain agnostic, enabling integration with any blockchain network. Out of the box, Web3Auth offers robust support for both **Solana** and **Ethereum**, each with dedicated React hooks.


### Solana integration​

Solana hooks are included natively within the `@web3auth/modal` package. No additional setup is required—simply use the provided hooks to interact with Solana networks.

For detailed usage and examples, see the [Solana hooks](https://docs.metamask.io/embedded-wallets/sdk/react/solana-hooks/) section.


### Ethereum integration​

Ethereum hooks are provided through the popular `wagmi` library, which works seamlessly with Web3Auth. This allows you to leverage a wide range of Ethereum hooks for account management, transactions, and more.

For implementation details and examples, refer to the [Ethereum Hooks](https://docs.metamask.io/embedded-wallets/sdk/react/ethereum-hooks/) section.


## Troubleshooting​


### Bundler issues: missing dependencies​

You might encounter errors related to missing dependencies in the browser environment:

- `Buffer is not defined`
- `process is not defined`
- Other Node.js-specific modules missing errors

These Node.js dependencies need to be polyfilled in your application. See the detailed troubleshooting guides for popular bundlers:

- **Vite Troubleshooting Guide**
- **Svelte Troubleshooting Guide**
- **Nuxt Troubleshooting Guide**
- **Webpack 5 Troubleshooting Guide**


### JWT errors​

When using custom authentication, you may encounter JWT errors:

- [Invalid JWT verifiers ID field](https://docs.metamask.io/embedded-wallets/troubleshooting/jwt-errors/#invalid-jwt-verifiers-id-field)
- [Failed to verify JWS signature](https://docs.metamask.io/embedded-wallets/troubleshooting/jwt-errors/#failed-to-verify-jws-signature)
- [Duplicate token](https://docs.metamask.io/embedded-wallets/troubleshooting/jwt-errors/#duplicate-token)
- [Expired token](https://docs.metamask.io/embedded-wallets/troubleshooting/jwt-errors/#expired-token)
- [Mismatch JWT validation field](https://docs.metamask.io/embedded-wallets/troubleshooting/jwt-errors/#mismatch-jwt-validation-field)

