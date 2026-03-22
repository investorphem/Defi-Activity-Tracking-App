"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend = 0, 
  isCurrency = false 
}) {
  // Format numbers to look professional (e.g., 1,234.56)
  const formattedValue = typeof value === "number" 
    ? value.toLocaleString(undefined, { 
        minimumFractionDigits: isCurrency ? 2 : 0,
        maximumFractionDigits: 2 
      }) 
    : value;

  return (
    <motion.div 
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="relative group p-6 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden"
    >
      {/* Subtle Background Glow on Hover */}
      <div className="absolute -inset-px bg-gradient-to-r from-orange-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              {Icon ? <Icon className="w-5 h-5 text-orange-500" /> : <Info className="w-5 h-5 text-slate-400" />}
            </div>
            <span className="text-sm font-medium text-slate-400 tracking-wide uppercase">
              {title}
            </span>
          </div>
          
          {/* Trend Indicator */}
          {trend !== 0 && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
              trend > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'
            }`}>
              {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          {isCurrency && (
            <span className="text-xl font-space font-medium text-slate-500">$</span>
          )}
          <h2 className="text-4xl font-space font-bold tracking-tighter text-white">
            {formattedValue || "—"}
          </h2>
        </div>

        {/* Decorative Progress Bar (Visual Flair) */}
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-orange-500 to-orange-300" 
          />
        </div>
      </div>
    </motion.div>
  );
}
