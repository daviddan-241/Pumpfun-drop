(() => {
  const log = (s) => console.log('[pumpdrop]', s);
  const statusEl = document.getElementById('status');
  const addrEl = document.getElementById('addr');
  const solEl = document.getElementById('solBal');
  const eligEl = document.getElementById('elig');
  const activityEl = document.getElementById('activity');
  const connectBtn = document.getElementById('connectBtn');
  const eligCountEl = document.getElementById('eligCount');

  // Friendly demo numbers
  eligCountEl.textContent = (15200 + Math.floor(Math.random()*300)).toLocaleString();

  const { Connection, clusterApiUrl, PublicKey } = solanaWeb3;
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
      statusEl.textContent = Connected;
      addrEl.textContent = ${base58.slice(0,4)}…${base58.slice(-4)};

      await refresh();
    } catch (e) {
      log('Connect rejected');
    }
  }

  function demoEligibility(lamports) {
    // Demo rule: eligible if balance >= 0.25 SOL
    const sol = lamports / 1e9;
    return sol >= 0.25 ? 'Eligible' : 'Not eligible';
  }

  async function refresh() {
    if (!pubkey) return setDisconnected();
    try {
      const bal = await connection.getBalance(pubkey, 'confirmed');
      solEl.textContent = ${(bal/1e9).toFixed(4)} SOL;
      eligEl.textContent = demoEligibility(bal);
      // Show truncated account info
      const info = await connection.getAccountInfo(pubkey, 'confirmed');
      let out = Owner: ${info?.owner?.toBase58?.() || '—'}\n;
      out += Lamports: ${bal}\n;
      out += Data length: ${info?.data?.length || 0};
      activityEl.textContent = out;
    } catch (e) {
      activityEl.textContent = 'Failed to load account info.';
      log(e);
    }
  }

  connectBtn.addEventListener('click', connect);
  setDisconnected();
})();
