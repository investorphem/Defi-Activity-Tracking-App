"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AppConfig, UserSession, openContractCall, showConnect } from "@stacks/connect";
import { 
  uintCV, principalCV, noneCV, PostConditionMode, 
  FungibleConditionCode, makeStandardSTXPostCondition 
} from "@stacks/transactions";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Download, Zap, LogOut, Search, Coins, 
  FileJson, ExternalLink, Clock, CheckCircle, AlertCircle, Lock, BarChart3
} from "lucide-react";
import confetti from 'canvas-confetti';
// Project UI Components
import StatCard from "../components/StatCard";
import EventsTable from "../components/EventsTable";
import Toast from "../components/Toast";

export default function Home() {
  const appConfig = useMemo(() => new AppConfig(['store_write']), []);
  const userSession = useMemo(() => new UserSession({ appConfig }), [appConfig]);

  // --- STATE MANAGEMENT ---
  const [userAddress, setUserAddress] = useState(null);
  const [balance setBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0)
  const [stxPrice, setStxPrice] = useStat(0)
  const [btcPrie, setBtcPrice] = useState(0);
  const [cycleInfo, setCycleInfo] = useState({ progress: 0, daysLeft: 0, nextCycle: 0 });
  const [mounted, setMounted] = useState(false);
  
  // UI & TX STATES
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("global");
  const [isModalOp etIsModalOpen] = useStat(false);
  const [stackAmunt,seStakAmount] = useState(100);
  const [btcRewardAddress, setBtcRewardAddrss]  useState("")
  const [activeTx, setActiveTx] = useState(null);
  const [toast, setToast] = useState(null);

  // --- 1. REACTIVE AUTH (Fixes Manual Refresh) ---
  const finishSignIn = useCallback(async () => {
    if (userSession.isSignInPending()) {
      const userData = await userSession.handlePendingSignIn();
      const addr = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
      setUserAddress(addr);
      window.history.replaceState({}, document.title, "/");
    } else if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      setUserAddress(userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet);
    }
  }, [userSession]);

  useEffect(() => {
    setMounted(true);
    finishSignIn();
  }, [finishSignIn]);

  // --- 2. DATA FETCHING (Balance, Price, Cycle) ---
  const fetchData = useCallback(async () => {
    if (!userAddress) return;
    try {
      // Fetch Balances & Stacking Status
      const [balRes, stackRes, priceRes, poxRes] = await Promise.all([
        fetch(`https://api.mainnet.hiro.so/extended/v1/address/${userAddress}/balances`),
        fetch(`https://api.mainnet.hiro.so/extended/v1/address/${userAddress}/stacking`),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack,bitcoin&vs_currencies=usd'),
        fetch('https://api.mainnet.hiro.so/v2/pox')
      ]);

      const balData = await balRes.json();
      const stackData = await stackRes.json();
      const priceData = await priceRes.json();
      const poxData = await poxRes.json();

      setBalance(parseInt(balData.stx.balance) / 1000000);
      setLockedBalance(parseInt(stackData.stacked_amount || 0) / 1000000);
      setStxPrice(priceData.blockstack.usd);
      setBtcPrice(priceData.bitcoin.usd);

      // Cycle Math
      const currentHeight = poxData.burn_block_height;
      const cycleLength = 2100;
      const nextStart = (Math.floor(currentHeight / cycleLength) + 1) * cycleLength;
      setCycleInfo({
        progress: ((cycleLength - (nextStart - currentHeight)) / cycleLength) * 100,
        daysLeft: (((nextStart - currentHeight) * 10) / 1440).toFixed(1),
        nextCycle: poxData.next_reward_cycle_id
      });

    } catch (e) { console.error("Data Fetch Error:", e); }
  }, [userAddress]);

  useEffect(() => { if (mounted) fetchData(); }, [mounted, userAddress, fetchData]);

  // --- 3. REWARD ESTIMATOR ---
  const estimate = useMemo(() => {
    const annualApy = 0.0875; // 8.75% avg for 2026
    const cycleRewardStx = (stackAmount * annualApy) / 26;
    const usdValue = cycleRewardStx * stxPrice;
    return { btc: (usdValue / btcPrice).toFixed(8), usd: usdValue.toFixed(2) };
  }, [stackAmount, stxPrice, btcPrice]);

  // --- 4. ACTIONS ---
  const handleConnect = () => {
    showConnect({
      appDetails: { name: "STX Tracker Pro", icon: window.location.origin + "/favicon.ico" },
      userSession,
      onFinish: () => finishSignIn(),
    });
  };

  const handleExport = (format) => {
    const content = format === 'csv' ? "ID,Amount\n1,100" : JSON.stringify({ data: "sample" });
    const uri = `data:text/${format};charset=utf-8,` + encodeURI(content);
    const link = document.createElement("a")
    link.href = uri; link.download = `stx_data.${format}`; link.click();
  };

  const handlePoolStacking = async () => {
    const microSTX = BigInt(Math.floor(stackAmount * 1000000));
    await openContractCall({
      network: 'mainnet',
      contractAddress: 'SP000000000000000000002Q6VF78',
      contractName: 'pox-4',
      functionName: 'delegate-stx',
      functionArgs: [
        uintCV(microSTX), 
        principalCV('SPX7CS6N8N6X4X8TDPYF69E3YVFD69ED5K3Q46R2'), // Example Pool
        noneCV(), noneCV()
      ],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [makeStandardSTXPostCondition(userAddress, FungibleConditionCode.LessEqual, microSTX)],
      onFinish: (data) => {
        setActiveTx({ id: data.txId, status: 'pending' });
        setToast({ message: "Delegated Successfully!", link: `https://explorer.hiro.so/txid/${data.txId}` });
        setIsModalOpen(false);
      },
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-slate200 p-6 lg:p-12 font-sans">
      <AnimatePresence>{toast && <Toast message={toast} onClose={() => setToast(null)} />}</AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-10">
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-black text-white italic tracking-tighter">STX TRACKER<span className="text-orange-600">PRO</span></h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Nakamoto Mainnet • v8.2</p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/40 p-2 rounded-2xl border border-white/5 backdrop-blur-xl">
            {userAddress ? (
              <>
                <div className="bg-black/40 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-400 border border-white/5 uppercase">
                  {userAddress.slice(0,6)}...{userAddress.slice(-4)}
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-orange-600 text-white rounded-xl text-[10px] font-back hover:bg-orange-500 transition">STACK STX</button>
                <button onClick={() => { userSession.signUserOut(); setUserAddress(null); }} className="p-2 text-slate-500 hover:text-red-400"><LogOut size={18}/></button>
              </>
            ) : (
              <button onClick={handleConnect} className="px-10 py-3 bg-white text-black rounded-xl font-black text-xs hover:scale-105 transition active:scale-95">CONNECT WALLET</button>
            )}
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Available" value={`${balance.toFixed(2)} STX`} icon={Coins} subtitle={`≈ $${(balance * stxPrice).toFixed(2)}`} />
          <StatCard title="Stacked" value={`${lockedBalance.toFixed(2)} STX`} icon={Lock} subtitle="Earing BTC" color="text-orange-500" />
          <StatCard title="STX Price" value={`$${stxPrice}`} icon={TrendingUp} subtitle="Live from CoinGecko" />
        </div>

        {/* CYCLE TIMER */}
        <section className="bg-slate-900/30 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
          <div className="flex justify-between item-end mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500"><BarChart3 size={24}/></div
              <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Reward Cycle</h3>
                <p className="text-2xl font-black text-white italic uppercase">Cycle #{cycleInfo.nextCycle}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-white tracking-tighter">{cycleInfo.daysLeft} Days</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Until Locked</p>
            </div>
          </div>
          <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5"
            <motion.div initial={{ width: 0 }} animate={{ width: `${cycleInfo.progress}%` }} className="h-full bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.4)]" />
          </div>
        </section>

        {/* CONTROL CENTER */}
        <section className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-900/20 p-6 rounded-[2rem] border border-white/5">
          <div className="flex bg-black/40 p-1 rounded-xl">
            {['global', 'personal'].map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition ${view === v ? 'bg-orange-600 text-white' : 'text-slate-500'}`}>{v} Feed</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-3 text-slate-600" size={14} />
              <input type="text" placeholder="Search hash..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-black/60 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none w-64" />
            </div>
            <button onClick={() => handleExport('csv')} className="p-3 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-slate-400"><Download size={18}/></button>
            <button onClick={() => handleExport('json')} className="p-3 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-slate-400"><FileJson size={18}/></button>
          </div>
        </section>

        <div className="bg-slate-900/10 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl min-h-[400px]">
          <EventsTable events={[]} />
        </div>
      </div>

      {/* STACKING MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#0f0f0f] border border-white/10 p-10 rounded-[3.5rem] max-w-sm w-full shadow-2xl">
              <h2 className="text-3xl font-black text-white mb-2 italic">DELEGATE</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">PoX-4 Reward Protocol</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-orange-500 uppercase mb-3 block">Amount (STX)</label>
                  <input type="number" value={stackAmount} onChange={(e) => setStackAmount(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-2xl font-bold text-white focus:border-orange-500 outline-none transition-all" />
                </div>

                <div className="p-5 bg-orange-500/5 rounded-2xl border border-orange-500/10 space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase text-slate-500"><span>Est. Reward</span> <span>{estimate.btc} BTC</span></div>
                   <div className="flex justify-between text-xs font-bold text-white"><span>USD Value</span> <span>≈ ${estimate.usd}</span></div>
                </div>

                <button onClick={handlePoolStacking} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-orange-900/30 hover:bg-orange-500 transition-all">CONFIRM STAKE</button>
                <button onClick={() => setIsModalOpen(false)} className="w-full text-slate-600 text-[10px] font-black uppercase hover:text-white transition">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
