"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Users, TrendingUp, RefreshCw, Download, Zap, 
  LogOut, Wallet, Search, Clock, Volume2, VolumeX 
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
  // 1. STACKS CONFIG & AUDIO REF
  const appConfig = useMemo(() => new AppConfig(['store_write', 'publish_data']), []);
  const userSession = useMemo(() => new UserSession({ appConfig }), [appConfig]);
  const chimeRef = useRef(null);

  // 2. DASHBOARD STATE
  const [stats, setStats] = useState(null);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [tvl, setTvl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState(null);
  const [view, setView] = useState("global");
  const [mounted, setMounted] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  
  // Interaction States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [toast, setToast] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  // 3. INITIALIZATION & SESSION HEALER
  useEffect(() => {
    setMounted(true);
    // Initialize Chime
    chimeRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    chimeRef.current.volume = 0.3;

    try {
      if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        const address = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
        setUserAddress(address);
      }
    } catch (error) {
      console.warn("Auth sync error. Resetting local session...");
      localStorage.removeItem('blockstack-session');
      setUserAddress(null);
    }
  }, [userSession]);

  // 4. DATA ENGINE
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, t] = await Promise.all([fetchStats(), fetchTvlHistory()]);
      setStats(s);
      setTvl(t);
      setLastSynced(new Date().toLocaleTimeString());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) loadData(); }, [mounted, loadData]);

  useEffect(() => {
    if (view === "personal" && userAddress) {
      getPersonalActivity(userAddress).then(res => {
        if (res.success) setPersonalEvents(res.data);
      });
    }
  }, [view, userAddress]);

  // 5. LIVE WEBSOCKET & ALERTS
  const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://your-backend.railway.app";
  const { lastJsonMessage } = useWebSocket(socketUrl, { shouldReconnect: () => true });

  useEffect(() => {
    if (lastJsonMessage?.type === "LIVE_EVENT") {
      const newEvent = lastJsonMessage;
      const isPersonal = userAddress && (newEvent.sender === userAddress || newEvent.recipient === userAddress);
      
      // Global Notification
      const label = newEvent.event_type === 'stx_transfer' ? 'Transfer' : 'Contract Call';
      setToast(`${label}: ${newEvent.amount ? newEvent.amount + ' STX' : 'New Interaction'}`);
      setTimeout(() => setToast(null), 4000);

      // Personal Alerts (Confetti + Chime)
      if (isPersonal) {
        if (!isMuted && chimeRef.current) chimeRef.current.play().catch(() => {});
        setPersonalEvents((prev) => [newEvent, ...prev]);
        confetti({ particleCount: 150, spread: 80, colors: ['#f97316', '#ffffff'] });
      }
    }
  }, [lastJsonMessage, userAddress, isMuted]);

  // 6. FILTERING LOGIC
  const filteredEvents = useMemo(() => {
    const baseData = view === "personal" ? personalEvents : (stats?.events || []);
    return baseData.filter(tx => {
      const matchesSearch = tx.sender?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           tx.tx_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || tx.event_type === filterType || tx.tx_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [view, personalEvents, stats, searchTerm, filterType]);

  // 7. ACTION HANDLERS
  const handleConnect = () => {
    showConnect({
      appDetails: { name: "Stacks DeFi Pro", icon: window.location.origin + '/favicon.ico' },
      userSession,
      onFinish: () => { window.location.reload(); }
    });
  };

  const handleLogout = () => {
    userSession.signUserOut();
    window.location.reload();
  };

  const exportCSV = () => {
    if (filteredEvents.length === 0) return;
    const content = "data:text/csv;charset=utf-8," + ["ID,Sender,Amount,Date", ...filteredEvents.map(t => `${t.tx_id},${t.sender},${t.amount},${t.created_at}`)].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(content);
    link.download = `stacks_${view}_export.csv`;
    link.click();
    confetti({ particleCount: 30 });
  };

  if (!mounted) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 p-4 md:p-8 max-w-7xl mx-auto">
      
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-space font-bold text-white flex items-center gap-3">
            {view === "global" ? "DeFi Hub" : "My Dashboard"} <Zap className="text-orange-500 fill-orange-500" />
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-slate-400 text-sm flex items-center gap-2">
               <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Mainnet
            </p>
            {lastSynced && <p className="text-slate-500 text-xs border-l border-white/10 pl-3">Synced: {lastSynced}</p>}
            <button onClick={() => setIsMuted(!isMuted)} className="p-1 hover:bg-white/5 rounded text-slate-500">
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {userAddress ? (
            <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/5">
              <div className="flex bg-slate-800 rounded-xl p-1 items-center">
                <span className="text-xs text-orange-400 font-mono px-3">{userAddress.slice(0, 5)}...{userAddress.slice(-4)}</span>
                <button onClick={() => setView("global")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${view === 'global' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>Global</button>
                <button onClick={() => setView("personal")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${view === 'personal' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>My Tx</button>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400"><LogOut size={18} /></button>
            </div>
          ) : (
            <button onClick={handleConnect} className="px-8 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-xl shadow-orange-900/40 hover:scale-105 transition">Connect Wallet</button>
          )}
          <button onClick={exportCSV} className="px-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl text-white text-sm flex items-center gap-2"><Download size={16} /> Export</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Value Locked" value={stats?.tvl || 0} icon={TrendingUp} isCurrency />
        <StatCard title="Active Wallets" value={stats?.users || 0} icon={Users} />
        <StatCard title="Live Events" value={stats?.events?.length || 0} icon={Activity} />
      </div>

      <section className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md h-[400px]">
        <TvlChart data={tvl} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white">Activity Feed</h2>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-xl py-2 pl-10 text-white text-sm" />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-slate-900 border border-white/5 rounded-xl py-2 px-3 text-sm text-slate-300">
              <option value="all">All</option>
              <option value="stx_transfer">Transfers</option>
              <option value="smart_contract">Contracts</option>
            </select>
          </div>
        </div>
        <div className="bg-slate-900/20 border border-white/5 rounded-3xl overflow-hidden min-h-[400px]">
          <EventsTable events={filteredEvents} />
        </div>
      </section>
    </motion.div>
  );
}
