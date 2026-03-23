'use client';

import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { useState, useEffect, useMemo } from 'react';

export default function WalletConnect() {
  // 1. Stable config to prevent re-initialization issues
  const appConfig = useMemo(() => new AppConfig(['store_write', 'publish_data']), []);
  const userSession = useMemo(() => new UserSession({ appConfig }), [appConfig]);
  
  const [userData, setUserData] = useState(null);

  // Check session on mount
  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, [userSession]);

  const connectWallet = () => {
    showConnect({
      appDetails: {
        name: 'Stacks DeFi Tracker Pro',
        icon: typeof window !== 'undefined' ? window.location.origin + '/favicon.ico' : '',
      },
      userSession,
      onFinish: () => {
        // 🚀 THE FIX: Pull data and update state immediately
        const freshUserData = userSession.loadUserData();
        setUserData(freshUserData);
        
        // Optional: Dispatch a custom event if your main page needs to know
        window.dispatchEvent(new Event('stacks-login'));
      },
    });
  };

  const disconnect = () => {
    userSession.signUserOut();
    setUserData(null);
    // Refresh only on logout to clear all internal provider states
    window.location.reload(); 
  };

  const stxAddress = userData?.profile?.stxAddress?.mainnet || userData?.profile?.stxAddress?.testnet;

  return (
    <div className="flex items-center gap-4">
      {!userData ? (
        <button 
          onClick={connectWallet}
          className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-orange-900/20"
        >
          Connect Stacks Wallet
        </button>
      ) : (
        <div className="flex items-center gap-3 bg-slate-900/50 border border-white/10 p-1.5 rounded-xl">
          <div className="px-3 py-1">
             <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Connected</p>
             <span className="text-sm text-orange-400 font-mono font-medium">
               {stxAddress ? `${stxAddress.substring(0, 5)}...${stxAddress.substring(stxAddress.length - 4)}` : "Wallet Connected"}
             </span>
          </div>
          <button 
            onClick={disconnect}
            className="bg-slate-800 hover:bg-red-900/40 hover:text-red-400 text-slate-400 p-2 rounded-lg transition-colors"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
