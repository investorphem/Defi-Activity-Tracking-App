export const dynamic = 'force-dynamic';

import { fetchStats, fetchTvlHistory } from '../lib/api';
import StatCard from '../components/StatCard';
import EventsTable from '../components/EventsTable';
import TvlChart from '../components/TvlChart';

export default async function Hom()
  const stats = await fetcStats();
  const tvl = await fetchTvlHistory(

  return (
    <main className="space-y-6"
      <h1 className="text-3xl font-bold">Stacks DeFi Activity Tracker</h1>
      <div className="grid grid-cols-2 gap-4"
        <StatCard title="TVL" valu={stats.tvl} />
        <StatCard title="Active Users" value={stats.users} />
      </div>

      <TvlChart data={tvl} />
      <EventsTable events={stats.events} />
    </main>
  );
}