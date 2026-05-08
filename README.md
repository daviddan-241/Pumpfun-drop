# Pumpdrop — Wallet Demo (Phantom + WalletConnect)

Features:
- Connect Phantom or any WalletConnect-compatible Solana wallet
- Fetch SOL balance via RPC and (optional) Moralis
- Transfer SOL (native) after explicit wallet approval

Env vars (at build time, Vite):
- VITE_WC_PROJECT_ID: Your WalletConnect Cloud project ID
- VITE_MORALIS_KEY: Your Moralis API key (optional)

Local dev:
  npm install
  VITE_WC_PROJECT_ID=your_wc_id VITE_MORALIS_KEY=your_moralis_key npm run dev

Build:
  VITE_WC_PROJECT_ID=your_wc_id VITE_MORALIS_KEY=your_moralis_key npm run build
  (serves from dist/)

