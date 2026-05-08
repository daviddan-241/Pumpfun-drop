import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { PhantomWalletAdapter, WalletConnectWalletAdapter } from '@solana/wallet-adapter-wallets';

const q = (id) => document.getElementById(id);
const statusEl = q('status');
const addrEl = q('addr');
const solEl = q('solBal');
const solMorEl = q('solMor');
const phantomBtn = q('phantomBtn');
const wcBtn = q('wcBtn');
const sendBtn = q('sendBtn');
const toAddrEl = q('toAddr');
const amtEl = q('amt');
const txOutEl = q('txOut');
const mstatus = q('mstatus');
const wcstatus = q('wcstatus');

const RPC = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC, 'confirmed');

const VITE_WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID || '';
const VITE_MORALIS_KEY = import.meta.env.VITE_MORALIS_KEY || '';

mstatus.textContent = VITE_MORALIS_KEY ? 'set' : 'not set';
wcstatus.textContent = VITE_WC_PROJECT_ID ? 'set' : 'not set';

let adapter = null;

function setDisconnected() {
  statusEl.textContent = 'Disconnected';
  addrEl.textContent = '';
  solEl.textContent = '—';
  solMorEl.textContent = '—';
  sendBtn.disabled = true;
  txOutEl.textContent = '';
}

async function connectAdapter(a) {
  adapter = a;
  if (!adapter.connected) {
    await adapter.connect();
  }
  statusEl.textContent = `Connected`;
  addrEl.textContent = `${adapter.publicKey.toBase58().slice(0,4)}…${adapter.publicKey.toBase58().slice(-4)}`;
  sendBtn.disabled = false;
  await refreshBalances();
}

async function refreshBalances() {
  if (!adapter?.publicKey) return setDisconnected();
  const bal = await connection.getBalance(adapter.publicKey, 'confirmed');
  solEl.textContent = `${(bal/1e9).toFixed(6)} SOL`;
  if (VITE_MORALIS_KEY) {
    try {
      const r = await fetch(`https://solana-gateway.moralis.io/account/mainnet/${adapter.publicKey.toBase58()}/balance`, {
        headers: { 'X-API-Key': VITE_MORALIS_KEY }
      });
      if (r.ok) {
        const j = await r.json();
        const lamports = Number(j?.balance ?? 0);
        solMorEl.textContent = `${(lamports/1e9).toFixed(6)} SOL`;
      } else {
        solMorEl.textContent = 'error';
      }
    } catch(e) {
      solMorEl.textContent = 'error';
    }
  }
}

phantomBtn.addEventListener('click', async () => {
  const ph = new PhantomWalletAdapter();
  await connectAdapter(ph);
});

wcBtn.addEventListener('click', async () => {
  if (!VITE_WC_PROJECT_ID) {
    alert('Set VITE_WC_PROJECT_ID at build time to use WalletConnect.');
    return;
  }
  const wc = new WalletConnectWalletAdapter({
    network: 'mainnet-beta',
    options: {
      projectId: VITE_WC_PROJECT_ID,
      relayUrl: 'wss://relay.walletconnect.com',
      metadata: {
        name: 'Pumpdrop Demo',
        description: 'WalletConnect + Phantom demo',
        url: window.location.origin,
        icons: [window.location.origin + '/assets/logo.svg']
      }
    }
  });
  await connectAdapter(wc);
});

sendBtn.addEventListener('click', async () => {
  try {
    if (!adapter?.publicKey) throw new Error('Connect a wallet first');
    const to = toAddrEl.value.trim();
    const amt = parseFloat(amtEl.value);
    if (!to) throw new Error('Missing destination');
    if (!amt || amt <= 0) throw new Error('Invalid amount');
    const toKey = new PublicKey(to);

    const lamports = Math.round(amt * 1e9);
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: adapter.publicKey });
    tx.add(SystemProgram.transfer({ fromPubkey: adapter.publicKey, toPubkey: toKey, lamports }));

    const sig = await adapter.sendTransaction(tx, connection);
    txOutEl.textContent = `Submitted: ${sig}\nSolscan: https://solscan.io/tx/${sig}`;

    const conf = await connection.confirmTransaction(sig, 'confirmed');
    if (conf.value.err) {
      txOutEl.textContent += '\nStatus: error';
    } else {
      txOutEl.textContent += '\nStatus: confirmed';
    }

    await refreshBalances();
  } catch (e) {
    txOutEl.textContent = `Error: ${e?.message || e}`;
  }
});

setDisconnected();
