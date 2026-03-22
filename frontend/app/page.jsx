"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Users, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { fetchStats, fetchTvlHistory } from "../lib/api";
import StatCard from "../components/StatCard";
import EventsTable from "../components/EventsTable";
import TvlChart from "../components/TvlChart";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [tvl, setTvl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
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

  // --- LOADING STATE (SKELETON STYLE) ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Syncing Stacks Ledger...</p>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 bg-red-500/5 rounded-2xl border border-red-500/20">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white">Data Sync Failed</h2>
        <p className="text-slate-400 mt-2 text-center max-w-sm">
          We couldn't fetch the latest DeFi activity. Check your connection or the Hiro Chainhook status.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-sm font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-10"
    >
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-space font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
            DeFi Overview
          </h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            Live ecosystem metrics via Hiro Chainhooks
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Global Status</span>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Operational
          </div>
        </div>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Value Locked" 
          value={stats.tvl} 
          icon={TrendingUp}
          isCurrency 
          trend={+5.2} // Example trend data
        />
        <StatCard 
          title="24h Active Users" 
          value={stats.users} 
          icon={Users}
          trend={-1.4}
        />
        {/* Added a third card for visual balance */}
        <StatCard 
          title="Total Transactions" 
          value={stats.events?.length || 0} 
          icon={Activity}
        />
      </div>

      {/* CHART SECTION */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-purple-600/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-slate-900/50 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-space font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              TVL Growth Curve
            </h2>
            <div className="flex gap-2">
              {['7D', '1M', 'ALL'].map((t) => (
                <button key={t} className="px-3 py-1 text-xs rounded-md bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-slate-400">
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[350px] w-full">
            <TvlChart data={tvl} />
          </div>
        </div>
      </section>

      {/* EVENTS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-space font-bold">Recent Protocol Activity</h2>
          <button className="text-sm text-orange-500 hover:underline">View Explorer</button>
        </div>
        <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <EventsTable events={stats.events} />
        </div>
      </section>
    </motion.div>
  );
}
