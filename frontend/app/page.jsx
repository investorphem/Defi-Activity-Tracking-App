"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Users, TrendingUp, RefreshCw, 
  Download, Zap, LogOut, Wallet, CheckCircle2, Clock 
} from "lucide-react";
import useWebSocket from "react-use-websocket";
import confetti from 'canvas-confetti';

// Project UI Components & API
import { fetchStats, fetchTvlHistory } from "../lib/api";
import { getPersonalActivity } from "./actions";
import StatCard from "../components/StatCard";
import EventsTable from "../components/EventsTable";
import TvlChart from "../components/TvlChart";

export default function Home() {
  // 1. STABLE SESSION CONFIG
  const appConfig = useMemo(() => new AppConfig(['store_write', 'publish_data']), []);
  const userSession = useMemo(() => new UserSession({ appConfig }), [appConfig]);

  // 2. STATE MANAGEMENT
  const [stats, setStats] = useState(null);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [tvl, setTvl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState(null);
  const [view, setView] = useState("global");
  const [mounted, setMounted] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  // 3. SELF-HEALING SESSION & HYDRATION
  useEffect(() => {
    setMounted(true);
    try {
      if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        const address = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
        setUserAddress(address);
      }
    } catch (error) {
      console.warn("Auth sync error. Cleaning storage...");
      localStorage.removeItem('blockstack-session');
      setUserAddress(null);
    }
  }, [userSession]);

  // 4. DATA FETCHING LOGIC
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, t] = await Promise.all([fetchStats(), fetchTvlHistory()]);
      setStats(s);
      setTvl(t);
      setLastSynced(new Date().toLocaleTimeString()); // 🕒 Update Sync Time
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) loadData();
  }, [mounted, loadData]);

  useEffect(() => {
    if (view === "personal" && userAddress) {
      getPersonalActivity(userAddress).then(res => {
        if (res.success) setPersonalEvents(res.data);
      });
    }
  }, [view, userAddress]);

  // 5. WEBSOCKET HANDLER
  const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://your-backend.railway.app";
  const { lastJsonMessage } = useWebSocket(socketUrl, { shouldReconnect: () => true });

  useEffect(() => {
    if (lastJsonMessage?.type === "LIVE_EVENT") {
      const newEvent = lastJsonMessage;
      if (userAddress && (newEvent.sender === userAddress || newEvent.recipient === userAddress)) {
        setPersonalEvents((prev) => [newEvent, ...prev]);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      }
    }
  }, [lastJsonMessage, userAddress]);

  // 6. ACTION HANDLERS
  const handleConnect = useCallback(() => {
    showConnect({
      appDetails: {
        name: "Stacks DeFi Tracker Pro",
        icon: window.location.origin + '/favicon.ico',
      },
      userSession,
      onFinish: () => { window.location.reload(); },
      onCancel: () => console.log("User closed login")
    });
  }, [userSession]);

  const handleLogout = useCallback(() => {
    userSession.signUserOut();
    window.location.reload();
  }, [userSession]);

  const exportToCSV = () => {
    const data = view === "personal" ? personalEvents : (stats?.events || []);
    if (data.length === 0) return alert("No data to export!");
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["ID,Type,Sender,Amount,Asset,Date", 
      ...data.map(tx => `${tx.tx_id},${tx.event_type},${tx.sender},${tx.amount},${tx.asset},${tx.created_at}`)].join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `stacks_${view}_${Date.now()}.csv`);
    link.click();
    confetti({ particleCount: 30, colors: ['#f97316'] });
  };

  if (!mounted) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 relative">
      
      {/* --- HEADER --- */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-space font-bold text-white flex items-center gap-3">
            {view === "global" ? "DeFi Overview" : "My Activity"} 
            <Zap className="w-8 h-8 text-orange-500 fill-orange-500" />
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-400 flex items-center gap-2 text-sm">
               <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               Mainnet Live
            </p>
            {lastSynced && (
              <p className="text-slate-500 text-xs flex items-center gap-1 border-l border-white/10 pl-4">
                <Clock className="w-3 h-3" /> Last Synced: {lastSynced}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {userAddress ? (
            <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 shadow-2xl">
              <div className="flex bg-slate-800 rounded-xl p-1 items-center">
                <span className="text-xs text-orange-400 font-mono px-3">
                  {userAddress.slice(0, 5)}...{userAddress.slice(-4)}
                </span>
                <button onClick={() => setView("global")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${view === 'global' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>Global</button>
                <button onClick={() => setView("personal")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${view === 'personal' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>My Tx</button>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <button 
              onClick={handleConnect} 
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-tr from-orange-600 to-orange-700 text-white rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-orange-900/40"
            >
              <Wallet className="w-5 h-5" /> Connect Wallet
            </button>
          )}
          
          <button 
            onClick={exportToCSV} 
            className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 hover:bg-slate-700 border border-white/5 rounded-xl text-sm font-medium transition text-white group"
          >
            <Download className="w-4 h-4 text-orange-500 group-hover:translate-y-0.5 transition-transform" /> 
            Export CSV
          </button>
        </div>
      </header>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Value Locked" value={stats?.tvl || 0} icon={TrendingUp} isCurrency />
        <StatCard title="24h Active Users" value={stats?.users || 0} icon={Users} />
        <StatCard title="Confirmed Transactions" value={stats?.events?.length || 0} icon={Activity} />
      </div>

      {/* --- CHART SECTION --- */}
      <section className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={loadData} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition">
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
        <div className="h-[350px] w-full"><TvlChart data={tvl} /></div>
      </section>

      {/* --- ACTIVITY SECTION --- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-space font-bold text-white flex items-center gap-2">
            {view === "global" ? "Transaction Feed" : "Personal History"}
            {loading && <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />}
          </h2>
          <span className="text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase">
             Live Sync Enabled
          </span>
        </div>
        <div className="bg-slate-900/20 border border-white/5 rounded-3xl overflow-hidden min-h-[400px]">
          <EventsTable events={view === "personal" ? personalEvents : (stats?.events || [])} />
        </div>
      </section>

    </motion.div>
  );
}
