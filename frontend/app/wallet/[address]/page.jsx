import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy, 
  ExternalLink, 
  Clock 
} from "lucide-react";

// Server Component
export default async function Wallet({ params }) {
  const { address } = params;

  // Helper to shorten address: ST123...4567
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/wallet/${address}`,
    { 
      headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY },
      next: { revalidate: 60 } / Cach for 60 seconds
    }
  );
  
  const events = await res.json();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* WALLET HEADER CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-90040 p-8 backdrop-blur-md">
        <div className="absolute op0 right-0 p-8 opacity-10">
          <WalletIcon size={120} className="text-orange-500" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-purple-600 flexitems-center justify-center shadow-2xl shadow-orange-500/20">
            <WalletIcon className="text-white w-8 h-8" />
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-1">
              <span>Stacks Account</span>
              <div className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-orange-500/80 uppercase tracking-widest text-[10px]">Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-space font-bold tracking-tight flex items-center gap-3">
              {shortAddress}
              <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                <Copy size={18} className="text-slate-500 hover:text-white" />
              </button>
            </h1>
          </div>
        </div>
      </div>

      {/* ACTIVITY FEED */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-space font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Wallet Activity
          </h2>
          <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-1 rounded">
            {events?.length || 0} Transactions
          </span>
        </div>

        <div className="grid gap-3">
          {events && events.length > 0 ? (
            events.map((event, idx) => (
              <div 
                key={idx}
                className="group flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    event.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {event.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200 capitalize">{event.type || 'Transaction'}</p>
                    <p className="text-xs text-slate-500 font-mono">Tx: {event.tx_id?.slice(0, 12)}...</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono font-bold text-white">
                    {event.amount} <span className="text-xs text-slate-500">STX</span>
                  </p>
                  <a 
                    href={`https://explorer.hiro.so/txid/${event.tx_id}?chain=mainnet`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[10px] text-orange-500/70 hover:text-orange-500 transition-colors uppercase font-bold tracking-tighter"
                  >
                    View on Hiro <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-slate-500">No recent activity found for this address.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
