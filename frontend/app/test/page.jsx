"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FlaskConical, Gauge, Terminal } from "lucide-react";

export default function TestPage() {
  const systemChecks = [
    { name: "Tailwind CSS 4.0", status: "Active", color: "text-sky-400" },
    { name: "Framer Motion", status: "Ready", color: "text-purple-400" },
    { name: "Lucide Icons", status: "Loaded", color: "text-orange-400" },
    { name: "Next.js App Router", status: "Online", color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-8">
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          repeat: Infinity,
          repeatType: "reverse",
          duration: 2 
        }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl shadow-orange-500/10"
      >
        <FlaskConical className="w-10 h-10 text-orange-500" />
      </motion.div>

      {/* Hero Text */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-space font-bold tracking-tighter text-white">
          System <span className="text-orange-500">Diagnostics</span>
        </h1>
        <p className="text-slate-500 font-mono text-sm">
          Route: <span className="text-slate-300">/test</span> • Status: <span className="text-emerald-500">200 OK</span>
        </p>
      </div>

      {/* Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        {systemChecks.map((check, index) => (
          <motion.div
            key={check.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white/5 ${check.color}`}>
                <CheckCircle2 size={18} />
              </div>
              <span className="font-medium text-slate-300">{check.name}</span>
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
              {check.status}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Terminal Mockup */}
      <div className="w-full max-w-2xl rounded-lg overflow-hidden border border-white/10 bg-[#010409] shadow-2xl">
        <div className="flex items-center gap-1.5 px-4 py-3 bg-white/5 border-b border-white/5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          <span className="ml-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Debug Console</span>
        </div>
        <div className="p-4 font-mono text-xs sm:text-sm space-y-2">
          <p className="text-emerald-500 flex gap-2">
            <span className="text-slate-600">➜</span> 
            <span>npm run dev</span>
          </p>
          <p className="text-slate-400">ready - started server on 0.0.0.0:3000, url: http://localhost:3000</p>
          <p className="text-orange-400">event - compiled successfully</p>
          <p className="text-slate-500 animate-pulse">_</p>
        </div>
      </div>

      <button 
        onClick={() => window.history.back()}
        className="text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-2 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> 
        Return to Dashboard
      </button>
    </div>
  );
}
