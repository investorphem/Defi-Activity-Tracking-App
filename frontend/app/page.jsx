"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Users, TrendingUp, AlertCircle, RefreshCw, Download, Zap } from "lucide-react";
import useWebSocket from "react-use-websocket";
import { fetchStats, fetchTvlHistory } from "../lib/api";
import { getPersonalActivity } from "../actions";
import { isConnected, getLocalStorage } from "@stacks/connect";
import StatCard from "../components/StatCard";
import EventsTable from "../components/EventsTable";
import TvlChart from "../components/TvlChart";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [tvl, setTvl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState("global"); 
  const [userAddress, setUserAddress] = useState(null);

  // --- 1. WEBSOCKET SETUP ---
  // Connect to your Railway Backend (Replace with your actual Railway URL)
  const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://your-backend.railway.app";
  
  const { lastJsonMessage } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
    reconnectInterval: 3000,
  });

  // Handle incoming live messages
  useEffect(() => {
    if (lastJsonMessage && lastJsonMessage.type === "LIVE_EVENT") {
      const newEvent = lastJsonMessage;

      // Update global list
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tvl: prev.tvl + (newEvent.amount || 0),
          events: [newEvent, ...prev.events].slice(0, 20), // Keep the latest 20
        };
      });

      // Update personal list if the transaction belongs to the user
      if (userAddress && newEvent.sender === userAddress) {
        setPersonalEvents((prev) => [newEvent, ...prev]);
      }
    }
  }, [lastJsonMessage, userAddress]);

  // --- 2. INITIAL LOAD ---
  useEffect(() => {
    if (isConnected()) {
      const userData = getLocalStorage();
      setUserAddress(userData?.addresses?.stx?.[0]?.address);
    }

    async function loadInitialData() {
      try {
        setLoading(true);
        const [statsData, tvlData] = await Promise.all([
          fetchStats(),
          fetchTvlHistory(),
        ]);
        setStats(statsData);
        setTvl(tvlData);
      } catch (err) {
        console.error("API error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // --- 3. VIEW SWITCHER ---
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

  const exportToCSV = () => {
    const dataToExport = view === "personal" ? personalEvents : stats?.events || [];
    const headers = ["ID", "Type", "Sender", "Amount", "Asset", "Date"];
    const rows = dataToExport.map(tx => [tx.tx_id, tx.event_type, tx.sender, tx.amount, tx.asset, tx.created_at]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `stacks_activity_${view}.csv`);
    link.click();
  };

  if (loading && !stats) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      <p className="text-slate-400 font-medium animate-pulse">Connecting to Stacks Live Node...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      {/* HEADER SECTION */}
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
          {userAddress && (
            <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700">
              <button onClick={() => setView("global")} className={`px-4 py-2 rounded-md text-xs font-bold transition ${view === 'global' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                Global
              </button>
              <button onClick={() => setView("personal")} className={`px-4 py-2 rounded-md text-xs font-bold transition ${view === 'personal' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                My Tx
              </button>
            </div>
          )}
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition text-white">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Value Locked" value={stats?.tvl || 0} icon={TrendingUp} isCurrency trend={+5.2} />
        <StatCard title="24h Active Users" value={stats?.users || 0} icon={Users} trend={-1.4} />
        <StatCard title="Network Transactions" value={stats?.events?.length || 0} icon={Activity} />
      </div>

      {/* CHART SECTION */}
      <section className="relative bg-slate-900/50 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
        <div className="h-[350px] w-full">
          <TvlChart data={tvl} />
        </div>
      </section>

      {/* EVENTS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-space font-bold text-white flex items-center gap-2">
            {view === "global" ? "Live Transaction Feed" : "Personal Transaction History"}
            {loading && <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />}
          </h2>
          <span className="text-xs text-slate-500 font-mono">Real-time Sync Active</span>
        </div>
        <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm min-h-[300px]">
          <AnimatePresence mode="popLayout">
            <EventsTable 
              events={view === "personal" ? personalEvents : (stats?.events || [])} 
            />
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
}
