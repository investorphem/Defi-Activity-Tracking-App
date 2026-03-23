"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AppConfig, UserSession, openContractCall } from "@stacks/connect";
import { 
  uintCV, principalCV, noneCV, PostConditionMode, 
  FungibleConditionCode, makeStandardSTXPostCondition 
} from "@stacks/transactions";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, RefreshCw, Download, Zap, LogOut, 
  Search, Coins, FileJson, ExternalLink, Clock, CheckCircle, AlertCircle
} from "lucide-react";
import confetti from 'canvas-confetti';

// Project UI Components (Assumed in your directory)
import StatCard from "../components/StatCard";
import EventsTable from "../components/EventsTable";
import TvlChart from "../components/TvlChart";
import Toast from "../components/Toast";

export default function Home() {
  const appConfig = useMemo(() => new AppConfig(['store_write', 'publish_data']), []);
  const userSession = useMemo(() => new UserSession({ appConfig }), [appConfig]);
  const chimeRef = useRef(null);

  // --- DASHBOARD STATE ---
  const [stats, setStats] = useState(null);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [tvl, setTvl] = useState([]);
  const [stxPrice, setStxPrice] = useState(0);
  const [balance, setBalance] = useState(0); 
  const [userAddress, setUserAddress] = useState(null);
  const [view, setView] = useState("global");
  const [mounted, setMounted] = useState(false);
  
  // UI & TX STATES
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stackAmount, setStackAmount] = useState(100);
  const [activeTx, setActiveTx] = useState(null); // { id: string, status: 'pending' | 'success' | 'failed' }

  // --- 1. DYNAMIC BALANCE FETCH ---
  const fetchBalance = useCallback(async (address) => {
    if (!address) return;
    try {
      const res = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/balances`);
      const data = await res.json();
      setBalance(parseInt(data.stx.balance) / 1000000); 
    } catch (e) { console.error("Balance Error:", e); }
  }, []);

  // --- 2. TRANSACTION POLLING ---
  useEffect(() => {
    let interval;
    if (activeTx && activeTx.status === 'pending') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`https://api.mainnet.hiro.so/extended/v1/tx/${activeTx.id}`);
          const data = await res.json();
          
          if (data.tx_status !== 'pending') {
            setActiveTx({ ...activeTx, status: data.tx_status });
            setToast({ 
              message: `Transaction ${data.tx_status.toUpperCase()}`, 
              link: `https://explorer.hiro.so/txid/${activeTx.id}` 
            });
            if (data.tx_status === 'success') {
                confetti({ particleCount: 150, spread: 70 });
                fetchBalance(userAddress); // Refresh balance on success
            }
            clearInterval(interval);
          }
        } catch (e) { console.error("Polling error", e); }
      }, 10000); // Poll every 10s
    }
    return () => clearInterval(interval);
  }, [activeTx, userAddress, fetchBalance]);

  // --- 3. INITIALIZATION ---
  useEffect(() => {
    setMounted(true);
    chimeRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    chimeRef.current.volume = 0.3;

    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const addr = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
      setUserAddress(addr);
      fetchBalance(addr);
    }
  }, [userSession, fetchBalance]);

  // --- 4. STACKING ACTION ---
  const handlePoolStacking = async (amount) => {
    if (!userAddress) return;
    const microSTX = BigInt(Math.floor(amount * 1000000));
    const POOL_OPERATOR = 'SPX7CS6N8N6X4X8TDPYF69E3YVFD69ED5K3Q46R2'; 

    await openContractCall({
      network: 'mainnet',
      contractAddress: 'SP000000000000000000002Q6VF78', // PoX-4
      contractName: 'pox-4',
      functionName: 'delegate-stx',
      functionArgs: [uintCV(microSTX), principalCV(POOL_OPERATOR), noneCV(), noneCV()],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [makeStandardSTXPostCondition(userAddress, FungibleConditionCode.LessEqual, microSTX)],
      onFinish: (data) => {
        setActiveTx({ id: data.txId, status: 'pending' });
        setToast({
          message: "Delegation Broadcasted!",
          link: `https://explorer.hiro.so/txid/${data.txId}?chain=mainnet`
        });
        setIsModalOpen(false);
      },
    });
  };

  // --- 5. EXPORT LOGIC ---
  const handleExport = (format) => {
    const dataToExport = view === "personal" ? personalEvents : (stats?.events || []);
    const content = format === 'csv' 
      ? ["ID,Sender,Amount", ...dataToExport.map(t => `${t.tx_id},${t.sender},${t.amount}`)].join("\n")
      : JSON.stringify(dataToExport, null, 2);
    
    const uri = `data:text/${format};charset=utf-8,` + encodeURI(content);
    const link = document.createElement("a");
    link.href = uri;
    link.download = `stx_data.${format}`;
    link.click();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans p-6 lg:p-12">
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER CONTROL */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-black text-white italic tracking-tighter">STX TRACKER <span className="text-orange-600 font-normal">PRO</span></h1>
            {activeTx && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                    activeTx.status === 'pending' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                    activeTx.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                    {activeTx.status === 'pending' ? <Clock size={12} className="animate-spin" /> : activeTx.status === 'success' ? <CheckCircle size={12}/> : <AlertCircle size={12}/>}
                    {activeTx.status === 'pending' ? 'TX Pending' : `TX ${activeTx.status}`}
                    <a href={`https://explorer.hiro.so/txid/${activeTx.id}`} target="_blank" className="ml-1 opacity-50 hover:opacity-100"><ExternalLink size={10}/></a>
                </div>
            )}
          </div>

          <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-white/5 backdrop-blur-xl">
            {userAddress ? (
              <>
                <div className="bg-black/40 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-400 border border-white/5">
                  {userAddress.slice(0,6)}...{userAddress.slice(-4)}
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-white text-black rounded-xl text-[10px] font-black hover:scale-105 transition">STAKE STX</button>
                <button onClick={() => { userSession.signUserOut(); window.location.reload(); }} className="p-2 text-slate-500 hover:text-red-400"><LogOut size={18}/></button>
              </>
            ) : (
              <button onClick={() => window.location.reload()} className="px-8 py-2 bg-white text-black rounded-xl font-black text-xs">CONNECT WALLET</button>
            )}
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Ecosystem TVL" value={stats?.tvl || 0} icon={TrendingUp} subtitle={`≈ $${((stats?.tvl || 0) * stxPrice).toLocaleString()}`} />
          <StatCard title="Your Wallet" value={userAddress ? `${balance.toFixed(2)} STX` : "---"} icon={Coins} subtitle={`Value: $${(balance * stxPrice).toFixed(2)}`} />
          <StatCard title="Stacks Price" value={`$${stxPrice}`} icon={Zap} subtitle="Real-time (CoinGecko)" />
        </div>

        {/* EXPORT & CONTROL BAR */}
        <section className="bg-slate-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            {['global', 'personal'].map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${view === v ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500'}`}>{v} Feed</button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-3 text-slate-600" size={14} />
              <input type="text" placeholder="Search hash..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-black/60 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-orange-500/30 w-48 lg:w-64" />
            </div>
            <div className="h-8 w-[1px] bg-white/5 mx-1" />
            <button onClick={() => handleExport('csv')} className="p-2.5 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-slate-400 transition" title="Export CSV"><Download size={18}/></button>
            <button onClick={() => handleExport('json')} className="p-2.5 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-slate-400 transition" title="Export JSON"><FileJson size={18}/></button>
          </div>
        </section>

        {/* TABLE VIEW */}
        <div className="bg-slate-900/10 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl min-h-[400px]">
          <EventsTable events={view === "personal" ? personalEvents : (stats?.events || [])} />
        </div>
      </div>

      {/* STACKING MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0f0f0f] border border-white/10 p-10 rounded-[3rem] max-w-sm w-full shadow-2xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 blur-[80px]" />
              <h2 className="text-3xl font-black text-white mb-2 italic">DELEGATE</h2>
              <p className="text-slate-500 text-xs mb-8">Earn BTC rewards by pooling your STX.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-3 block">Amount to Pool (STX)</label>
                  <input type="number" value={stackAmount} onChange={(e) => setStackAmount(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-2xl font-bold text-white focus:border-orange-500 outline-none transition-all" />
                </div>
                <button onClick={() => handlePoolStacking(stackAmount)} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-900/30 hover:bg-orange-500 transition-all active:scale-95">CONFIRM & STAKE</button>
                <button onClick={() => setIsModalOpen(false)} className="w-full text-slate-600 text-xs font-bold hover:text-white transition uppercase tracking-widest">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
