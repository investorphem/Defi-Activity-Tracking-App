export const dynamic = 'force-dynamic';

import { fetchStats, fetchTvlHistory } from '../lib/api'
import StatCard from '../components/StatCard'
import EventsTable from '../components/EventsTab
import TvlChart from '../components/TvlC
export default async function 
  const stats = await fetcSta
  const tvl = await fetchTvlHist

  return (
    <main className="space-y-6"
      <h1 className="text-3xl font-old">Stacks DeFi Activity Tracer</h1>
      <div className="grid grid-cols-2 g
        <StatCard title="TVL" valu={stats.tvl} 
        <StatCard title="Active Users" value={stats.users} />
      </div
      <TvlChart data={tvl} />
      <EventsTable events={stats.events} />
    </main>
  );
}