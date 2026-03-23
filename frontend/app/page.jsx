"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Users, TrendingUp, RefreshCw, Download, Zap, LogOut, Wallet, CheckCircle2 } from "lucide-react";
import useWebSocket from "react-use-websocket";
import confetti from 'canvas-confetti';

// Project UI Components
import { fetchStats, fetchTvlHistory } from "../lib/api";
import { getPersonalActivity } from "./actions";
import StatCard from "../components/StatCard";
import EventsTable from "../components/EventsTable";
import TvlChart from "../components/TvlChart";

export default function Home() {
  // 1. Stable Session Config for v7.5
  const appConfig = useMemo(() => new AppConfig(['store_write', 'publish_data']), []);
  const userSession = useMemo(() => new UserSession({ appConfig }), [appConfig]);

  const [stats, setStats] = useState(null);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [tvl, setTvl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState(null);
  const [view, setView] = useState("global");
  const [mounted, setMounted] = useState(false);

  // 2. SELF-HEALING SESSION RECOVERY
  useEffect(() => {
    setMounted(true);
    try {
      if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        const address = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
        setUserAddress(address);
      }
    } catch (error) {
      // 🚀 FIX: This catches the "JSON data version undefined" error 
      // and clears the corrupted local storage so the app doesn't crash.
      console.warn("Corrupted session detected. Resetting auth state...");
      localStorage.removeItem('blockstack-session');
      setUserAddress(null);
    }
  }, [userSession]);

  // 3. WALLET POPUP TRIGGER
  const handleConnect = useCallback(() => {
    console.log("Button clicked: Launching Connect...");
    showConnect({
      appDetails: {
        name: "Stacks DeFi Tracker Pro",
        icon: window.location.origin + '/favicon.ico',
      },
      userSession,
      onFinish: () => {
        // v7.5 requires a quick reload to properly finalize the browser state
        window.location.reload();
      },
      onCancel: () => console.log("Connection closed by user")
    });
  }, [userSession]);

  const handleLogout = useCallback(() => {
    userSession.signUserOut();
    window.location.reload();
  }, [userSession]);

  // --- 4. WEBSOCKET & DATA FETCHING ---
  const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://your-backend.railway.app";
  const { lastJsonMessage } = useWebSocket(socketUrl, { shouldReconnect: () => true });

  useEffect(() => {
    if (lastJsonMessage?.type === "LIVE_EVENT") {
      const newEvent = lastJsonMessage;
      if (userAddress && (newEvent.sender === userAddress || newEvent.recipient === userAddress)) {
        setPersonalEvents((prev) => [newEvent, ...prev]);
        confetti({ particleCount: 50, spread: 60 });
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
      } catch (e) {
        console.error("Fetch error:", e);
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
             Live Network Feed
          </p>
        </div>

        <div className="flex items-center gap-3">
          {userAddress ? (
            <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 shadow-2xl">
              <div className="flex bg-slate-800 rounded-xl p-1 items-center">
                <span className="text-xs text-orange-400 font-mono px-3">
                  {userAddress.slice(0, 5)}...{userAddress.slice(-4)}
                </span>
                <button onClick={() => setView("global")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${view === 'global' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400'}`}>Global</button>
                <button onClick={() => setView("personal")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${view === 'personal' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>My Tx</button>
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
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Value Locked" value={stats?.tvl || 0} icon={TrendingUp} isCurrency />
        <StatCard title="24h Active Users" value={stats?.users || 0} icon={Users} />
        <StatCard title="Network Events" value={stats?.events?.length || 0} icon={Activity} />
      </div>

      <section className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
        <div className="h-[350px] w-full"><TvlChart data={tvl} /></div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-space font-bold text-white px-2">
            {view === "global" ? "Transaction Feed" : "Personal History"}
        </h2>
        <div className="bg-slate-900/20 border border-white/5 rounded-3xl overflow-hidden min-h-[400px]">
          <EventsTable events={view === "personal" ? personalEvents : (stats?.events || [])} />
        </div>
      </section>
    </motion.div>
  );
}
