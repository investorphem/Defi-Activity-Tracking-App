"use client";

import { ExternalLink, ArrowDownLeft, ArrowUpRight, Zap, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";

export default function EventsTable({ events }) {
  // Helper to shorten Stacks addresses: ST123...4567
  const truncate = (str) => (str ? `${str.slice(0, 6)}...${str.slice(-4)}` : "Unknown");

  if (!events || events.length === 0) {
    return (
      <div className="p-12 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
        <p className="text-slate-500 font-medium">No recent protocol events detected.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-2">
        <thead>
          <tr className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">
            <th className="px-6 py-3">Origin / Sender</th>
            <th className="px-6 py-3">Action Type</th>
            <th className="px-6 py-3 text-right">Value (STX)</th>
            <th className="px-6 py-3 text-right">Explorer</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {events.map((e, index) => (
            <motion.tr
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={e.tx_id || index}
              className="group bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-200"
            >
              {/* SENDER COLUMN */}
              <td className="px-6 py-4 rounded-l-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                    <Fingerprint size={14} className="text-slate-400" />
                  </div>
                  <span className="font-mono text-slate-300 group-hover:text-white transition-colors">
                    {truncate(e.sender)}
                  </span>
                </div>
              </td>

              {/* EVENT TYPE COLUMN */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    e.event_type?.toLowerCase().includes('deposit') 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {e.event_type?.toLowerCase().includes('deposit') ? (
                      <ArrowDownLeft size={12} />
                    ) : (
                      <Zap size={12} />
                    )}
                    {e.event_type || "Transfer"}
                  </span>
                </div>
              </td>

              {/* AMOUNT COLUMN */}
              <td className="px-6 py-4 text-right">
                <span className="font-mono font-bold text-white tracking-tight">
                  {e.amount ? parseFloat(e.amount).toLocaleString() : "0.00"}
                </span>
                <span className="ml-1.5 text-[10px] text-slate-500 font-bold uppercase">STX</span>
              </td>

              {/* ACTION COLUMN */}
              <td className="px-6 py-4 text-right rounded-r-xl">
                <a
                  href={`https://explorer.hiro.so/txid/${e.tx_id}?chain=mainnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-orange-500 hover:text-white transition-all text-slate-400 text-xs"
                >
                  <span className="hidden sm:inline">Details</span>
                  <ExternalLink size={12} />
                </a>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
