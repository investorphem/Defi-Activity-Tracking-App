"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
// 🚀 New: Added 'connect' and 'isConnected' for more stable 2026 auth
import { AppConfig, UserSession, openContractCall, showConnect } from "@stacks/connect";
import { 
  uintCV, principalCV, noneCV, PostConditionMode, 
  FungibleConditionCode, makeStandardSTXPostCondition 
} from "@stacks/transactions";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, RefreshCw, Download, Zap, LogOut, Search, Coins, FileJson, ExternalLink, Clock, CheckCircle, AlertCircle } from "lucide-react";
import confetti from 'canvas-confetti';

import StatCard from "../components/StatCard";
import EventsTable from "../components/EventsTable";
import Toast from "../components/Toast";

export default function Home() {
  const appConfig = useMemo(() => new AppConfig(['store_write']), []);
  const userSession = useMemo(() => new UserSession({ appConfig }), [appConfig]);
  
  const [userAddress, setUserAddress] = useState(null);
  const [balance, setBalance] = useState(0); 
  const [stxPrice, setStxPrice] = useState(0);
  const [stats, setStats] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stackAmount, setStackAmount] = useState(100);
  const [activeTx, setActiveTx] = useState(null);
  const [toast, setToast] = useState(null);

  // --- 1. THE "REFRESH FIX" AUTH HOOK ---
  useEffect(() => {
    setMounted(true);

    const checkAuth = async () => {
      // 🛑 CRITICAL: Check if the wallet just redirected back with a token
      if (userSession.isSignInPending()) {
        try {
          const userData = await userSession.handlePendingSignIn();
          const addr = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
          setUserAddress(addr);
          // Clean the URL (remove the auth token) without refreshing
          window.history.replaceState({}, document.title, "/");
        } catch (error) {
          console.error("Auth failed:", error);
        }
      } else if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        setUserAddress(userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet);
      }
    };

    checkAuth();
  }, [userSession]);

  // --- 2. FETCH BALANCE ---
  const fetchBalance = useCallback(async (address) => {
    if (!address) return;
    try {
      const res = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/balances`);
      const data = await res.json();
      setBalance(parseInt(data.stx.balance) / 1000000); 
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { if (userAddress) fetchBalance(userAddress); }, [userAddress, fetchBalance]);

  // --- 3. THE UPDATED CONNECT FUNCTION ---
  const handleConnect = (e) => {
    if (e) e.preventDefault(); // Stop any accidental form refreshes

    showConnect({
      appDetails: {
        name: "STX Tracker Pro",
        icon: window.location.origin + "/favicon.ico",
      },
      redirectTo: "/",
      userSession,
      onFinish: () => {
        // Instead of reload, we let the useEffect catch the pending sign-in
        console.log("Connect finished, waiting for redirect...");
      },
      onCancel: () => console.log("User cancelled"),
    });
  };

  // --- 4. STACKING LOGIC ---
  const handlePoolStacking = async (amount) => {
    const microSTX = BigInt(Math.floor(amount * 1000000));
    await openContractCall({
      network: 'mainnet',
      contractAddress: 'SP000000000000000000002Q6VF78',
      contractName: 'pox-4',
      functionName: 'delegate-stx',
      functionArgs: [uintCV(microSTX), principalCV('SPX7CS6N8N6X4X8TDPYF69E3YVFD69ED5K3Q46R2'), noneCV(), noneCV()],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [makeStandardSTXPostCondition(userAddress, FungibleConditionCode.LessEqual, microSTX)],
      onFinish: (data) => {
        setActiveTx({ id: data.txId, status: 'pending' });
        setToast({ message: "Transaction Broadcasted!", link: `https://explorer.hiro.so/txid/${data.txId}` });
        setIsModalOpen(false);
      },
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <AnimatePresence>{toast && <Toast message={toast} onClose={() => setToast(null)} />}</AnimatePresence>

      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <h1 className="text-3xl font-black italic tracking-tighter">STX TRACKER <span className="text-orange-600">PRO</span></h1>
        
        <div className="flex items-center gap-4">
          {activeTx && (
            <div className="text-[10px] font-bold uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20 px-4 py-2 rounded-full flex items-center gap-2">
              <Clock size={12} className="animate-spin" /> {activeTx.status}
            </div>
          )}

          {userAddress ? (
            <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-white/5">
              <span className="text-[10px] font-mono opacity-50">{userAddress.slice(0,6)}...</span>
              <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black">STAKE STX</button>
              <button onClick={() => { userSession.signUserOut(); window.location.reload(); }} className="p-2 text-red-500"><LogOut size={16}/></button>
            </div>
          ) : (
            <button 
              onClick={handleConnect} 
              className="bg-white text-black px-8 py-3 rounded-2xl font-black hover:scale-105 transition active:scale-95"
            >
              CONNECT WALLET
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Wallet Balance" value={userAddress ? `${balance.toFixed(2)} STX` : "---"} icon={Coins} subtitle="Available to stake" />
          <StatCard title="Ecosystem TVL" value={stats?.tvl || "0"} icon={TrendingUp} subtitle="Total Value Locked" />
          <StatCard title="Active TX" value={activeTx ? "1 Pending" : "None"} icon={Zap} subtitle="Mempool status" />
        </div>

        <div className="bg-slate-900/20 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl min-h-[400px]">
          <EventsTable events={[]} />
        </div>
      </main>

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0f0f0f] border border-white/10 p-10 rounded-[3rem] max-w-sm w-full">
              <h2 className="text-2xl font-black mb-6">DELEGATE STX</h2>
              <input type="number" value={stackAmount} onChange={(e) => setStackAmount(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xl font-bold mb-6 outline-none focus:border-orange-500" />
              <button onClick={() => handlePoolStacking(stackAmount)} className="w-full py-4 bg-orange-600 rounded-2xl font-black hover:bg-orange-500 transition">CONFIRM STAKE</button>
              <button onClick={() => setIsModalOpen(false)} className="w-full mt-4 text-slate-500 text-xs font-bold uppercase tracking-widest">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
