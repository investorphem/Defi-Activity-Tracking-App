"use client";

import { useEffect, useState } from "react";
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

  if (loading) return <div className="p-8">Syncing with Stacks ledger...</div>;
  if (error) return <div className="p-8 text-red-500">Failed to load DeFi stats.</div>;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Stacks DeFi Activity</h1>
        <p className="text-muted-foreground text-sm">Real-time ecosystem analytics</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Total Value Locked" value={stats.tvl} isCurrency />
        <StatCard title="24h Active Users" value={stats.users} />
      </div>

      <section className="bg-white p-4 rounded-xl border">
        <h2 className="text-xl font-semibold mb-4">TVL Over Time</h2>
        <TvlChart data={tvl} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Protocol Events</h2>
        <EventsTable events={stats.events} />
      </section>
    </main>
  );
}
