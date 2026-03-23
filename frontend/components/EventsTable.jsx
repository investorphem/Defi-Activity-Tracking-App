import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Code, Layers, ExternalLink } from 'lucide-react';

const getTxStyle = (type) => {
  const types = {
    'smart_contract': {
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      icon: <Code size={14} />,
      label: 'Contract Call'
    },
    'stx_transfer': {
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: <ArrowUpRight size={14} />,
      label: 'STX Transfer'
    },
    'token_transfer': {
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      icon: <Layers size={14} />,
      label: 'Token Tx'
    },
    'default': {
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      icon: <Activity size={14} />,
      label: 'Transaction'
    }
  };
  return types[type] || types['default'];
};

export default function EventsTable({ events }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-white/[0.02]">
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sender</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {events.map((tx, i) => {
            const style = getTxStyle(tx.event_type || tx.tx_type);
            return (
              <tr key={tx.tx_id || i} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${style.color} text-xs font-medium`}>
                    {style.icon}
                    {style.label}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                  {tx.sender?.slice(0, 6)}...{tx.sender?.slice(-4)}
                </td>
                <td className="px-6 py-4">
                  <span className="text-white font-bold text-sm">
                    {tx.amount ? `${Number(tx.amount).toLocaleString()} STX` : '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Confirmed
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {new Date(tx.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {events.length === 0 && (
        <div className="py-20 text-center text-slate-500 text-sm">
          No transactions found in this view.
        </div>
      )}
    </div>
  );
}
