"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect"; // Use the standard session classes
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
  // --- 1. SESSION CONFIG ---
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

  // --- 2. INSTANT SESSION CHECK ---
  useEffect(() => {
    setMounted(true);
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const address = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
      setUserAddress(address);
    }
  }, [userSession]);

  // --- 3. LIVE WEBSOCKET UPDATES ---
  const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://your-backend.railway.app";
  const { lastJsonMessage } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
    reconnectInterval: 3000,
  });

  useEffect(() => {
    if (lastJsonMessage?.type === "LIVE_EVENT") {
      const newEvent = lastJsonMessage;
      setStats((prev) => prev ? {
        ...prev,
        tvl: prev.tvl + (newEvent.amount || 0),
        events: [newEvent, ...prev.events].slice(0, 20),
      } : prev);

      if (userAddress && (newEvent.sender === userAddress || newEvent.recipient === userAddress)) {
        setPersonalEvents((prev) => [newEvent, ...prev]);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    }
  }, [lastJsonMessage, userAddress]);

  // --- 4. INSTANT AUTHENTICATION (NO REFRESH) ---
  const handleConnect = useCallback(() => {
    showConnect({
      appDetails: {
        name: "Stacks DeFi Tracker Pro",
        icon: typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : "",
      },
      userSession, // Pass the session object here
      onFinish: () => {
        // 🚀 THIS IS THE FIX: Manually pull data and set state immediately
        const userData = userSession.loadUserData();
        const address = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
        
        if (address) {
          setUserAddress(address);
          setView("personal"); 
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          confetti({ particleCount: 150, spread: 60 });
        }
      },
      onCancel: () => console.log("User closed connection modal")
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
    async function loadInitialData() {
      try {
        setLoading(true);
        const [statsData, tvlData] = await Promise.all([fetchStats(), fetchTvlHistory()]);
        setStats(statsData);
        setTvl(tvlData);
      } finally { setLoading(false); }
    }
    loadInitialData();
  }, [mounted]);

  useEffect(() => {
    async function loadPersonal() {
      if (view === "personal" && userAddress) {
        setLoading(true);
        const result = await getPersonalActivity(userAddress);
        if (result.success) setPersonalEvents(result.data);
        setLoading(false);
      }
    }
    loadPersonal();
  }, [view, userAddress]);

  if (!mounted) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 relative">
      
      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[100] bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400/50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">Wallet Sync Active</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-space font-bold text-white flex items-center gap-3">
            {view === "global" ? "DeFi Overview" : "My Activity"}
            {view === "global" && <Zap className="w-8 h-8 text-orange-500 fill-orange-500" />}
          </h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live ecosystem metrics via Hiro Chainhooks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {userAddress ? (
            <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
              <div className="flex bg-slate-800 rounded-lg p-1 items-center">
                <span className="text-xs text-orange-400 font-mono px-3">
                  {userAddress.slice(0, 5)}...{userAddress.slice(-4)}
                </span>
                <button onClick={() => setView("global")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${view === 'global' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  Global
                </button>
                <button onClick={() => setView("personal")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${view === 'personal' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  My Tx
                </button>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 transition" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              type="button" onClick={handleConnect}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-all shadow-lg active:scale-95 cursor-pointer z-50"
            >
              <Wallet className="w-4 h-4" /> Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* ... Rest of your UI (StatCards, Chart, EventsTable) ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Value Locked" value={stats?.tvl || 0} icon={TrendingUp} isCurrency trend={+5.2} />
        <StatCard title="24h Active Users" value={stats?.users || 0} icon={Users} trend={-1.4} />
        <StatCard title="Network Transactions" value={stats?.events?.length || 0} icon={Activity} />
      </div>

      <section className="bg-slate-900/50 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
        <div className="h-[350px] w-full">
          <TvlChart data={tvl} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-space font-bold text-white px-1">
            {view === "global" ? "Live Transaction Feed" : "Personal Transaction History"}
        </h2>
        <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm min-h-[300px]">
          <AnimatePresence mode="popLayout">
            <EventsTable events={view === "personal" ? personalEvents : (stats?.events || [])} />
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
}
