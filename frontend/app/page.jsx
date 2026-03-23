"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Users, TrendingUp, RefreshCw, Download, Zap, CheckCircle2 } from "lucide-react";
import useWebSocket from "react-use-websocket";
import confetti from 'canvas-confetti';
import { fetchStats, fetchTvlHistory } from "../lib/api";
import { getPersonalActivity } from "./actions";
import { userSession } from "../lib/stacksSession";
import WalletConnect from "../components/WalletConnect";
import StatCard from "../components/StatCard";
import EventsTable from "../components/EventsTable";
import TvlChart from "../components/TvlChart";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [tvl, setTvl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState(null);
  const [view, setView] = useState("global");
  const [mounted, setMounted] = useState(false);

  // --- SYNC WALLET STATE ---
  useEffect(() => {
    setMounted(true);
    const syncAddress = () => {
      if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        setUserAddress(userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet);
      } else {
        setUserAddress(null);
      }
    };

    syncAddress();
    window.addEventListener('stacks-auth-change', syncAddress);
    return () => window.removeEventListener('stacks-auth-change', syncAddress);
  }, []);

  // --- WEBSOCKET & DATA FETCHING ---
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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-space font-bold text-white flex items-center gap-3">
            {view === "global" ? "DeFi Overview" : "My Activity"} 
            <Zap className="w-8 h-8 text-orange-500 fill-orange-500" />
          </h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2">
             <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             Live Ecosystem Metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* INSTANT SYNC TOGGLES */}
          {userAddress && (
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
              <button onClick={() => setView("global")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${view === 'global' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>Global</button>
              <button onClick={() => setView("personal")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${view === 'personal' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>My Tx</button>
            </div>
          )}
          
          <WalletConnect />
          
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700 border border-white/5 rounded-xl text-sm font-medium transition text-white">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Value Locked" value={stats?.tvl || 0} icon={TrendingUp} isCurrency />
        <StatCard title="24h Active Users" value={stats?.users || 0} icon={Users} />
        <StatCard title="Total Transactions" value={stats?.events?.length || 0} icon={Activity} />
      </div>

      <section className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
        <div className="h-[350px] w-full"><TvlChart data={tvl} /></div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-space font-bold text-white flex items-center gap-2">
            {view === "global" ? "Network Activity" : "Your Activity"}
            {loading && <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />}
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {userAddress ? "Connected to Mainnet" : "Scanning Network..."}
          </span>
        </div>
        <div className="bg-slate-900/20 border border-white/5 rounded-3xl overflow-hidden min-h-[400px]">
          <EventsTable events={view === "personal" ? personalEvents : (stats?.events || [])} />
        </div>
      </section>
    </motion.div>
  );
}
