"use client";

import { useEffect, useState } from "react";
import { fetchStats, fetchTvlHistory } from "../lib/api";
import StatCard from "../components/StatCard";
import EventsTable from "../components/EventsTable";
import TvlChart from "../components/TvlChart";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [tvl, setTvl] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const statsData = await fetchStats();
        const tvlData = await fetchTvlHistory();
        setStats(statsData);
        setTvl(tvlData);
      } catch (err) {
        console.error("API error:", err);
      }
    }

    load();
  }, []);

  if (!stats) {
    return (
      <main className="space-y-6">
        <h1 className="text-3xl font-bold">Stacks DeFi Activity Tracker</h1>
        <p>Loading analytics...</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Stacks DeFi Activity Tracker</h1>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="TVL" value={stats.tvl} />
        <StatCard title="Active Users" value={stats.users} />
      </div>

      <TvlChart data={tvl} />
      <EventsTable events={stats.events} />
    </main>
  );
}