import React from 'react';
import { motion } from 'framer-motion';
import { Zap, X, ExternalLink } from 'lucide-react';

export default function Toast({ message, onClose }) {
  // message can now be an object: { message, link, label }
  const text = typeof message === 'string' ? message : message.message;
  const link = typeof message === 'object' ? message.link : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 bg-slate-900/95 border border-orange-500/30 backdrop-blur-2xl p-4 rounded-2xl shadow-2xl min-w-[320px]"
    >
      <div className="flex items-center gap-3">
        <div className="bg-orange-500/20 p-2 rounded-lg">
          <Zap className="w-4 h-4 text-orange-500" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-white font-bold">{text}</p>
        </div>

        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-md text-slate-500">
          <X size={14} />
        </button>
      </div>

      {/* 🚀 THE ACTION LINK */}
      {link && (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-2 py-2 px-4 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-orange-500 transition-all"
        >
          View on Explorer <ExternalLink size={10} />
        </a>
      )}

      <motion.div 
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 5 }}
        className="absolute bottom-0 left-0 h-0.5 bg-orange-500/40 rounded-full"
      />
    </motion.div>
  );
}
