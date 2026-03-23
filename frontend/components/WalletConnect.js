'use client';

import { showConnect } from '@stacks/connect';
import { useState, useEffect } from 'react';
import { userSession } from '../lib/stacksSession'; // Import from our new file
import { Wallet, LogOut } from 'lucide-react';

export default function WalletConnect() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, []);

  const handleConnect = () => {
    showConnect({
      appDetails: {
        name: 'Stacks DeFi Tracker Pro',
        icon: window.location.origin + '/favicon.ico',
      },
      userSession,
      onFinish: () => {
        // 🚀 THE FIX: Update state instead of reloading
        const data = userSession.loadUserData();
        setUserData(data);
        
        // Tells the rest of the app the user logged in
        window.dispatchEvent(new Event('storage')); 
      },
    });
  };

  const handleLogout = () => {
    userSession.signUserOut();
    setUserData(null);
    window.location.reload();
  };

  if (userData) {
    const addr = userData.profile.stxAddress.mainnet;
    return (
      <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-white/5">
        <span className="text-xs text-orange-400 font-mono px-3">
          {addr.slice(0, 5)}...{addr.slice(-4)}
        </span>
        <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 transition">
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleConnect}
      className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition shadow-lg shadow-orange-900/20"
    >
      <Wallet size={16} /> Connect Wallet
    </button>
  );
}
