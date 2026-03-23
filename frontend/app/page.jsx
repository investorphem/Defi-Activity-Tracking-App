"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";
import { 
  uintCV, principalCV, noneCV, PostConditionMode, 
  FungibleConditionCode, makeStandardSTXPostCondition 
} from "@stacks/transactions";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Users, TrendingUp, RefreshCw, Download, Zap, 
  LogOut, Wallet, Search, Clock, Volume2, VolumeX, ShieldCheck, Coins, FileJson
} from "lucide-react";
import useWebSocket from "react-use-websocket";
import confetti from 'canvas-confetti';

// Project UI Components
import { fetchStats, fetchTvlHistory } from "../lib/api";
import { getPersonalActivity } from "./actions";
import StatCard from "../components/StatCard";
import EventsTable from "../components/EventsTable";
import TvlChart from "../components/TvlChart";
import Toast from "../components/Toast";

export default function Home() {
  const appConfig = useMemo(() => new AppConfig(['store_write', 'publish_data']), []);
  const userSession = useMemo(() => new UserSession({ appConfig }), [appConfig]);
  const chimeRef = useRef(null);

  // --- STATE ---
  const [stats, setStats] = useState(null);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [tvl, setTvl] = useState([]);
  const [stxPrice, setStxPrice] = useState(0);
  const [balance, setBalance] = useState(0); // 🚀 DYNAMIC BALANCE
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState(null);
  const [view, setView] = useState("global");
  const [mounted, setMounted] = useState(false);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [toast, setToast] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stackAmount, setStackAmount] = useState(500);

  // --- 1. DYNAMIC BALANCE FETCH ---
  const fetchBalance = useCallback(async (address) => {
    if (!address) return;
    try {
      const res = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/balances`);
      const data = await res.json();
      setBalance(parseInt(data.stx.balance) / 1000000); // Convert micro-STX
    } catch (e) { console.error("Balance Fetch Failed", e); }
  }, []);

  // --- 2. INITIALIZATION ---
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

  // --- 3. DATA ENGINE ---
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, t, p] = await Promise.all([
        fetchStats(), 
        fetchTvlHistory(),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd').then(r => r.json())
      ]);
      setStats(s);
      setTvl(t);
      setStxPrice(p.blockstack.usd);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) loadData(); }, [mounted, loadData]);

  // --- 4. EXPORT LOGIC ---
  const handleExport = (format) => {
    if (filteredEvents.length === 0) return;
    const content = format === 'csv' 
      ? ["ID,Sender,Amount,Date", ...filteredEvents.map(t => `${t.tx_id},${t.sender},${t.amount},${t.created_at}`)].join("\n")
      : JSON.stringify(filteredEvents, null, 2);
    
    const uri = `data:text/${format};charset=utf-8,` + encodeURI(content);
    const link = document.createElement("a");
    link.href = uri;
    link.download = `stacks_activity.${format}`;
    link.click();
    confetti({ particleCount: 50, colors: ['#f97316'] });
  };

  // --- 5. FILTERING ENGINE ---
  const filteredEvents = useMemo(() => {
    const baseData = view === "personal" ? personalEvents : (stats?.events || []);
    return baseData.filter(tx => {
      const matchesSearch = tx.sender?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           tx.tx_id?.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterType === "stacking") {
        return matchesSearch && (tx.function_name === "delegate-stx" || tx.function_name === "stack-stx");
      }
      return matchesSearch && (filterType === "all" || tx.event_type === filterType);
    });
  }, [view, personalEvents, stats, searchTerm, filterType]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-orange-500/30">
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-white tracking-tighter flex items-center gap-3">
              TRACKER <span className="text-orange-600 italic">PRO</span>
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500">STX Price: <span className="text-white font-bold">${stxPrice}</span></span>
              <button onClick={() => fetchBalance(userAddress)} className="text-orange-500 hover:rotate-180 transition-all duration-500"><RefreshCw size={14}/></button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-900/40 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
            {userAddress ? (
              <>
                <div className="flex bg-black/40 rounded-xl p-1">
                  <button onClick={() => setView("global")} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition ${view === 'global' ? 'bg-orange-600 text-white' : 'text-slate-500'}`}>Global</button>
                  <button onClick={() => setView("personal")} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition ${view === 'personal' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>My Activity</button>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-5 py-2 bg-white text-black rounded-xl text-[10px] font-black hover:scale-105 transition">STACK STX</button>
                <button onClick={() => { userSession.signUserOut(); window.location.reload(); }} className="p-2 text-slate-500 hover:text-red-400 transition"><LogOut size={18}/></button>
              </>
            ) : (
              <button onClick={() => showConnect({ userSession, appDetails: { name: "STX Pro" }, onFinish: () => window.location.reload() })} className="px-8 py-3 bg-white text-black rounded-xl font-black hover:bg-slate-200 transition">CONNECT WALLET</button>
            )}
          </div>
        </header>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Value Locked" value={stats?.tvl || 0} icon={TrendingUp} subtitle={`≈ $${((stats?.tvl || 0) * stxPrice).toLocaleString()}`} />
          <StatCard title="Your STX Balance" value={userAddress ? `${balance.toFixed(2)} STX` : "---"} icon={Coins} subtitle={`Value: $${(balance * stxPrice).toFixed(2)}`} />
          <StatCard title="Global Stakers" value={stats?.users || 0} icon={Users} subtitle="Active Wallets" />
        </div>

        {/* --- EXPORT & FILTER TAB --- */}
        <section className="bg-slate-900/20 border border-white/5 rounded-[2rem] p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
              {['all', 'stx_transfer', 'stacking'].map((type) => (
                <button 
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-3 text-slate-600" size={16} />
                <input type="text" placeholder="Filter address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-orange-500/30 w-48 lg:w-64" />
              </div>
              <div className="h-10 w-[1px] bg-white/10 mx-2" />
              <button onClick={() => handleExport('csv')} className="p-3 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-slate-300 transition" title="Export CSV"><Download size={18}/></button>
              <button onClick={() => handleExport('json')} className="p-3 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-slate-300 transition" title="Export JSON"><FileJson size={18}/></button>
            </div>
          </div>
        </section>

        {/* --- TABLE --- */}
        <div className="bg-slate-900/10 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
          <EventsTable events={filteredEvents} />
        </div>
      </main>

      {/* --- STACKING MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] max-w-sm w-full shadow-[0_0_80px_rgba(249,115,22,0.15)]">
              <h2 className="text-3xl font-black text-white mb-6 italic tracking-tighter">DELEGATE STX</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-3 block">Amount to Pool</label>
                  <input type="number" value={stackAmount} onChange={(e) => setStackAmount(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-5 text-2xl font-black text-white focus:border-orange-500 transition-all" />
                </div>
                <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">REWARD CURRENCY</span><span className="text-white">BITCOIN (BTC)</span></div>
                  <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">MINIMUM LOCK</span><span className="text-white">~2 WEEKS</span></div>
                </div>
                <button onClick={() => handlePoolStacking(stackAmount)} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-xl hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/40">CONFIRM & DELEGATE</button>
                <button onClick={() => setIsModalOpen(false)} className="w-full text-slate-600 font-bold hover:text-white transition">CANCEL</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
