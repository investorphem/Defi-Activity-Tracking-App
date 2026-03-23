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
  LogOut, Wallet, Search, Clock, Volume2, VolumeX, ShieldCheck, Coins
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

  // --- INITIALIZATION ---
  useEffect(() => {
    setMounted(true);
    chimeRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    chimeRef.current.volume = 0.3;

    try {
      if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        const address = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
        setUserAddress(address);
      }
    } catch (e) {
      localStorage.removeItem('blockstack-session');
      setUserAddress(null);
    }
  }, [userSession]);

  // --- DATA FETCHING (Now with Price) ---
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

  // --- FILTERING ENGINE ---
  const filteredEvents = useMemo(() => {
    const baseData = view === "personal" ? personalEvents : (stats?.events || []);
    return baseData.filter(tx => {
      const matchesSearch = tx.sender?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           tx.tx_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 🚀 Special Stacking Filter Logic
      if (filterType === "stacking") {
        return matchesSearch && (tx.function_name === "delegate-stx" || tx.function_name === "stack-stx");
      }

      const matchesType = filterType === "all" || tx.event_type === filterType || tx.tx_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [view, personalEvents, stats, searchTerm, filterType]);

  // --- STACKING ACTION ---
  const handlePoolStacking = async (amount) => {
    const microSTX = amount * 1000000;
    const POOL_OPERATOR = 'SPX7CS6N8N6X4X8TDPYF69E3YVFD69ED5K3Q46R2'; 

    await showConnect({
      contractAddress: 'SP000000000000000000002Q6VF78',
      contractName: 'pox-4',
      functionName: 'delegate-stx',
      functionArgs: [uintCV(microSTX), principalCV(POOL_OPERATOR), noneCV(), noneCV()],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [makeStandardSTXPostCondition(userAddress, FungibleConditionCode.LessEqual, microSTX)],
      onFinish: () => {
        setToast("Delegation Request Sent!");
        setIsModalOpen(false);
        if (!isMuted) chimeRef.current.play();
        confetti({ particleCount: 150, spread: 70 });
      },
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-orange-500/30">
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        
        {/* --- HERO HEADER --- */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-white tracking-tighter flex items-center gap-3">
              TRACKER <span className="text-orange-600 italic">PRO</span>
            </h1>
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
              <span className="text-slate-500">STX Price: <span className="text-white">${stxPrice}</span></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {userAddress ? (
              <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md">
                <button onClick={() => setView(view === "global" ? "personal" : "global")} className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-700 transition">
                   {view === "global" ? <Users size={14}/> : <ShieldCheck size={14}/>} 
                   {view === "global" ? "Switch to Me" : "Switch to Global"}
                </button>
                <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-orange-600 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-900/40 hover:scale-105 active:scale-95 transition">STACK STX</button>
                <button onClick={() => userSession.signUserOut() || window.location.reload()} className="p-2 text-slate-500 hover:text-red-400"><LogOut size={18}/></button>
              </div>
            ) : (
              <button onClick={() => showConnect({ userSession, appDetails: { name: "STX Pro" }, onFinish: () => window.location.reload() })} className="px-10 py-4 bg-white text-black rounded-2xl font-black hover:bg-slate-200 transition shadow-2xl">CONNECT WALLET</button>
            )}
          </div>
        </header>

        {/* --- STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Value Locked" value={stats?.tvl || 0} icon={TrendingUp} subtitle={`≈ $${((stats?.tvl || 0) * stxPrice).toLocaleString()}`} />
          <StatCard title="Wallet Balance" value={userAddress ? "8.56 STX" : "0 STX"} icon={Coins} subtitle={`Value: $${(8.56 * stxPrice).toFixed(2)}`} />
          <StatCard title="Active Stakers" value={stats?.users || 0} icon={Users} subtitle="Network wide" />
        </div>

        {/* --- CHART --- */}
        <section className="bg-slate-900/20 border border-white/5 rounded-[2.5rem] p-8 h-[450px] backdrop-blur-3xl relative overflow-hidden">
          <div className="absolute top-8 left-8 z-10">
            <h3 className="text-lg font-bold text-white">Ecosystem Growth</h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">24H Volume History</p>
          </div>
          <TvlChart data={tvl} />
        </section>

        {/* --- TABLE & FILTER --- */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <h2 className="text-2xl font-bold text-white">Activity</h2>
               <div className="flex bg-slate-900 rounded-xl p-1">
                  <button onClick={() => setFilterType("all")} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>All</button>
                  <button onClick={() => setFilterType("stacking")} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${filterType === 'stacking' ? 'bg-orange-600/20 text-orange-500' : 'text-slate-500'}`}>Stacking</button>
               </div>
            </div>
            
            <div className="relative md:w-80">
              <Search className="absolute left-4 top-3 text-slate-600" size={16} />
              <input type="text" placeholder="Search Address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-12 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all" />
            </div>
          </div>
          
          <div className="bg-slate-900/10 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-md">
            <EventsTable events={filteredEvents} />
          </div>
        </section>

      </main>

      {/* --- STACKING MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-slate-900 border border-white/10 p-10 rounded-[3rem] max-w-sm w-full shadow-[0_0_100px_rgba(249,115,22,0.1)]">
              <h2 className="text-3xl font-black text-white mb-2 italic">POOL STACKING</h2>
              <p className="text-slate-400 text-sm mb-8">Lock your STX via the Nakamoto PoX-4 contract to earn BTC rewards.</p>
              
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-3 block">Amount to Lock</label>
                  <input type="number" value={stackAmount} onChange={(e) => setStackAmount(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-5 text-2xl font-black text-white focus:outline-none focus:border-orange-500/50" />
                  <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-600">
                    <span>EST. APY: 7.4%</span>
                    <span>PERIOD: 2 WEEKS</span>
                  </div>
                </div>

                <button onClick={() => handlePoolStacking(stackAmount)} className="w-full py-5 bg-orange-600 text-white rounded-[1.5rem] font-black text-xl shadow-2xl shadow-orange-900/40 hover:bg-orange-500 transition-all active:scale-95">DELEGATE NOW</button>
                <button onClick={() => setIsModalOpen(false)} className="w-full text-slate-500 font-bold hover:text-white transition">CLOSE</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
