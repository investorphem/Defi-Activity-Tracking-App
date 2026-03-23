import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, CheckCircle2 } from 'lucide-react';

export default function Toast({ message, type, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-slate-900/90 border border-orange-500/30 backdrop-blur-xl p-4 rounded-2xl shadow-2xl shadow-orange-900/20 min-w-[300px]"
    >
      <div className="bg-orange-500/20 p-2 rounded-lg">
        <Zap className="w-5 h-5 text-orange-500 animate-pulse" />
      </div>
      
      <div className="flex-1">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">New Network Event</p>
        <p className="text-sm text-white font-medium">{message}</p>
      </div>

      <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-md text-slate-500 transition-colors">
        <X size={16} />
      </button>
      
      {/* Progress Bar */}
      <motion.div 
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 4 }}
        className="absolute bottom-0 left-0 h-0.5 bg-orange-500/50"
      />
    </motion.div>
  );
}
