"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Users, TrendingUp, RefreshCw, Download, Zap, LogOut, Wallet, CheckCircle2 } from "lucide-react";
import useWebSocket from "react-use-websocket";
import confetti from 'canvas-confetti';
import { fetchStats, fetchTvlHistory } from "../lib/api";
import { getPersonalActivity } from "./actions";
import StatCard from "../components/StatCard";
import EventsTable from "../components/EventsTable";
import TvlChart from "../components/TvlChart";

export default function Home() {
  // 1. STABLE SESSION CONFIG
  const appConfig = useMemo(() => new AppConfig(['store_write', 'publish_data']), []);
  const userSession = useMemo(() => new UserSession({ appConfig }), [appConfig]);

  const [stats, setStats] = useState(null);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [tvl, setTvl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState(null);
  const [view, setView] = useState("global");
  const [mounted, setMounted] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // --- 2. MOUNT & SESSION RECOVERY ---
  useEffect(() => {
    setMounted(true);
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const address = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
      setUserAddress(address);
    }
  }, [userSession]);

  // --- 3. WEBSOCKET SETUP ---
  const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://your-backend.railway.app";
  const { lastJsonMessage } = useWebSocket(socketUrl, { shouldReconnect: () => true });

  useEffect(() => {
    if (lastJsonMessage?.type === "LIVE_EVENT") {
      const newEvent = lastJsonMessage;
      if (userAddress && (newEvent.sender === userAddress || newEvent.recipient === userAddress)) {
        setPersonalEvents((prev) => [newEvent, ...prev]);
        confetti({ particleCount: 100, spread: 70 });
      }
    }
  }, [lastJsonMessage, userAddress]);

  // --- 4. THE CONNECTION FIX ---
  const handleConnect = useCallback(() => {
    console.log("Connect requested...");
    showConnect({
      appDetails: {
        name: "Stacks DeFi Tracker Pro",
        icon: typeof window !== 'undefined' ? window.location.origin + '/favicon.ico' : '',
      },
      userSession,
      onFinish: () => {
        const userData = userSession.loadUserData();
        const address = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
        if (address) {
          setUserAddress(address);
          setView("personal");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          confetti({ particleCount: 150 });
        }
      },
      onCancel: () => console.log("Connection cancelled")
    });
  }, [userSession]);

  const handleLogout = useCallback(() => {
    userSession.signUserOut();
    setUserAddress(null);
    setView("global");
    window.location.reload();
  }, [userSession]);

  // --- 5. DATA FETCHING ---
  useEffect(() => {
    if (!mounted) return;
    async function loadData() {
      try {
        setLoading(true);
        const [s, t] = await Promise.all([fetchStats(), fetchTvlHistory()]);
        setStats(s);
        setTvl(t);
      } finally { setLoading(false); }
    }
    loadData();
  }, [mounted]);

  useEffect(() => {
    if (view === "personal" && userAddress) {
      getPersonalActivity(userAddress).then(res => {
        if (res.success) setPersonalEvents(res.data);
      });
    }
  }, [view, userAddress]);

  const exportToCSV = () => {
    const data = view === "personal" ? personalEvents : stats?.events || [];
    const csvContent = "data:text/csv;charset=utf-8," + ["ID,Type,Sender,Amount,Asset,Date", ...data.map(tx => `${tx.tx_id},${tx.event_type},${tx.sender},${tx.amount},${tx.asset},${tx.created_at}`)].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `stacks_${view}.csv`);
    link.click();
  };

  if (!mounted) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 relative">
      
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-6 right-6 z-[100] bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" /> <span className="font-bold text-sm">Wallet Synced Instantly</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-space font-bold text-white flex items-center gap-3">
            {view === "global" ? "DeFi Overview" : "My Activity"} <Zap className="w-8 h-8 text-orange-500 fill-orange-500" />
          </h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live ecosystem metrics
          </p>
        </div>

        {/* --- ACTIONS BAR (Export and Wallet) --- */}
        <div className="flex items-center gap-3">
          {userAddress ? (
            <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
              <div className="flex bg-slate-800 rounded-lg p-1">
                <span className="text-xs text-orange-400 font-mono px-3 self-center">
                  {userAddress.slice(0, 5)}...{userAddress.slice(-4)}
                </span>
                <button onClick={() => setView("global")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${view === 'global' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400'}`}>Global</button>
                <button onClick={() => setView("personal")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${view === 'personal' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>My Tx</button>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={handleConnect} className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition active:scale-95">
              <Wallet className="w-4 h-4" /> Connect Wallet
            </button>
          )}
          
          {/* EXPORT BUTTON - RESTORED HERE */}
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition text-white">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Value Locked" value={stats?.tvl || 0} icon={TrendingUp} isCurrency />
        <StatCard title="24h Active Users" value={stats?.users || 0} icon={Users} />
        <StatCard title="Network Transactions" value={stats?.events?.length || 0} icon={Activity} />
      </div>

      <section className="bg-slate-900/50 border border-white/10 p-6 rounded-2xl">
        <div className="h-[350px] w-full"><TvlChart data={tvl} /></div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-space font-bold text-white flex items-center gap-2">
            {view === "global" ? "Live Feed" : "Personal History"}
            {loading && <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />}
          </h2>
          {/* MONITORING TEXT - RESTORED HERE */}
          <span className="text-xs text-slate-500 font-mono">
            {userAddress ? "Connected to Stacks Node" : "Monitoring Network..."}
          </span>
        </div>
        <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden min-h-[300px]">
          <EventsTable events={view === "personal" ? personalEvents : (stats?.events || [])} />
        </div>
      </section>
    </motion.div>
  );
}
