"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Users, TrendingUp, AlertCircle, RefreshCw, Download, User } from "lucide-react";
import { fetchStats, fetchTvlHistory } from "../lib/api";
import { isConnected, getLocalStorage } from "@stacks/connect"; // Add this
import StatCard from "../components/StatCard";
import EventsTable from "../components/EventsTable";
import TvlChart from "../components/TvlChart";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [tvl, setTvl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // New States for Personalization
  const [view, setView] = useState("global"); 
  const [userAddress, setUserAddress] = useState(null);

  useEffect(() => {
    // Check if user is connected via wallet
    if (isConnected()) {
      const userData = getLocalStorage();
      setUserAddress(userData?.addresses?.stx?.[0]?.address);
    }

    async function load() {
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
    load();
  }, []);

  // --- CSV EXPORT FUNCTION ---
  const exportToCSV = () => {
    const dataToExport = view === "personal" 
      ? stats.events.filter(tx => tx.sender === userAddress) 
      : stats.events;

    const headers = ["ID", "Type", "Sender", "Amount", "Asset", "Date"];
    const rows = dataToExport.map(tx => [
      tx.tx_id, tx.event_type, tx.sender, tx.amount, tx.asset, tx.created_at
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `stacks_activity_${view}.csv`);
    link.click();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      <p className="text-slate-400 font-medium animate-pulse">Syncing Stacks Ledger...</p>
    </div>
  );

  if (error) return ( /* ... keep your existing error UI ... */ );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-space font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
            {view === "global" ? "DeFi Overview" : "My Activity"}
          </h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            {view === "global" ? "Global metrics via Hiro" : `Tracking: ${userAddress?.substring(0,8)}...`}
          </p>
        </div>
        
        {/* VIEW TOGGLE & EXPORT */}
        <div className="flex items-center gap-3">
          {userAddress && (
            <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700">
              <button 
                onClick={() => setView("global")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${view === 'global' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}
              >
                Global
              </button>
              <button 
                onClick={() => setView("personal")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${view === 'personal' ? 'bg-blue-500 text-white' : 'text-slate-400'}`}
              >
                My Tx
              </button>
            </div>
          )}
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Value Locked" value={stats.tvl} icon={TrendingUp} isCurrency trend={+5.2} />
        <StatCard title="24h Active Users" value={stats.users} icon={Users} trend={-1.4} />
        <StatCard title="Total Transactions" value={stats.events?.length || 0} icon={Activity} />
      </div>

      {/* CHART SECTION */}
      <section className="relative bg-slate-900/50 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
        <div className="h-[350px] w-full">
          <TvlChart data={tvl} />
        </div>
      </section>

      {/* EVENTS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-space font-bold">
            {view === "global" ? "Recent Protocol Activity" : "My Recent Activity"}
          </h2>
        </div>
        <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <EventsTable 
            events={view === "personal" 
              ? stats.events.filter(tx => tx.sender === userAddress) 
              : stats.events
            } 
          />
        </div>
      </section>
    </motion.div>
  );
}
