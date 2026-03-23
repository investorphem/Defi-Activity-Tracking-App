"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Users, TrendingUp, RefreshCw, 
  Download, Zap, LogOut, Wallet, Search, Filter, Clock, Copy 
} from "lucide-react";
import useWebSocket from "react-use-websocket";
import confetti from 'canvas-confetti';

// Project Components & Logic
import { fetchStats, fetchTvlHistory } from "../lib/api";
import { getPersonalActivity } from "./actions";
import StatCard from "../components/StatCard";
import EventsTable from "../components/EventsTable";
import TvlChart from "../components/TvlChart";

export default function Home() {
  // 1. STABLE SESSION CONFIG (v7.5)
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
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

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
      console.warn("Auth version mismatch. Resetting session...");
      localStorage.removeItem('blockstack-session');
      setUserAddress(null);
    }
  }, [userSession]);

  // 4. DATA FETCHING ENGINE
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, t] = await Promise.all([fetchStats(), fetchTvlHistory()]);
      setStats(s);
      setTvl(t);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("API Error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (mounted) loadData(); }, [mounted, loadData]);

  useEffect(() => {
    if (view === "personal" && userAddress) {
      getPersonalActivity(userAddress).then(res => {
        if (res.success) setPersonalEvents(res.data);
      });
    }
  }, [view, userAddress]);

  // 5. SEARCH & FILTER LOGIC (Instant Search)
  const filteredEvents = useMemo(() => {
    const baseData = view === "personal" ? personalEvents : (stats?.events || []);
    return baseData.filter(tx => {
      const matchesSearch = 
        tx.sender?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        tx.tx_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || tx.event_type === filterType || tx.tx_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [view, personalEvents, stats, searchTerm, filterType]);

  // 6. ACTION HANDLERS
  const handleConnect = useCallback(() => {
    showConnect({
      appDetails: { name: "Stacks DeFi Tracker Pro", icon: window.location.origin + '/favicon.ico' },
      userSession,
      onFinish: () => { window.location.reload(); }
    });
  }, [userSession]);

  const handleLogout = useCallback(() => {
    userSession.signUserOut();
    window.location.reload();
  }, [userSession]);

  const exportToCSV = () => {
    const data = filteredEvents;
    if (data.length === 0) return alert("Nothing to export!");
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["ID,Type,Sender,Amount,Asset,Date", 
      ...data.map(tx => `${tx.tx_id},${tx.event_type},${tx.sender},${tx.amount},${tx.asset},${tx.created_at}`)].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `stacks_export_${Date.now()}.csv`);
    link.click();
    confetti({ particleCount: 40, colors: ['#f97316'] });
  };

  if (!mounted) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 relative max-w-7xl mx-auto px-4 py-8">
      
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
               Stacks Mainnet Live
            </p>
            {lastSynced && (
              <p className="text-slate-500 text-xs flex items-center gap-1 border-l border-white/10 pl-4">
                <Clock className="w-3 h-3" /> Sync: {lastSynced}
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
              <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400"><LogOut size={18} /></button>
            </div>
          ) : (
            <button onClick={handleConnect} className="flex items-center gap-2 px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all shadow-xl shadow-orange-900/40">
              <Wallet size={20} /> Connect Wallet
            </button>
          )}
          
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 hover:bg-slate-700 border border-white/5 rounded-xl text-sm font-medium transition text-white">
            <Download size={18} /> Export
          </button>
        </div>
      </header>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Value Locked" value={stats?.tvl || 0} icon={TrendingUp} isCurrency />
        <StatCard title="Active Users" value={stats?.users || 0} icon={Users} />
        <StatCard title="Total Events" value={stats?.events?.length || 0} icon={Activity} />
      </div>

      {/* --- CHART SECTION --- */}
      <section className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md relative">
        <div className="absolute top-6 right-6">
          <button onClick={loadData} className="p-2 hover:bg-white/5 rounded-lg transition">
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="h-[350px] w-full"><TvlChart data={tvl} /></div>
      </section>

      {/* --- SEARCH & TABLE SECTION --- */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <h2 className="text-xl font-space font-bold text-white flex items-center gap-2">
            Activity Feed
            {loading && <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />}
          </h2>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search Tx or Address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-900 border border-white/5 rounded-xl py-2 px-3 text-sm text-slate-300 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="stx_transfer">STX Transfer</option>
              <option value="smart_contract">Contract Call</option>
              <option value="token_transfer">Token Tx</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-900/20 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
          <EventsTable events={filteredEvents} />
        </div>
      </section>
    </motion.div>
  );
}
