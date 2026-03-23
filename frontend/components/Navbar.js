'use client';
import { useState, useEffect } from 'react';
import { connect, isConnected, disconnect, getLocalStorage } from '@stacks/connect';

export default function Navbar() {
  const [stxAddress, setStxAddress] = useState(null);
  const [balance, setBalance] = useState('0');

  // 1. Check for existing session on load
  useEffect(() => {
    if (isConnected()) {
      const userData = getLocalStorage();
      if (userData?.addresses?.stx) {
        const addr = userData.addresses.stx[0].address;
        setStxAddress(addr);
        fetchBalance(addr);
      }
    }
  }, []);

  // 2. Fetch Real-time Balance from Stacks API
  const fetchBalance = async (address) => {
    try {
      const response = await fetch(`https://api.mainnet.hiro.so/address/${address}/balances`);
      const data = await response.json();
      // STX has 6 decimals, so we divide by 1,000,000
      const stxBalance = parseInt(data.stx.balance) / 1000000;
      setBalance(stxBalance.toLocaleString());
    } catch (err) {
      console.error("Balance fetch failed", err);
    }
  };

  // 3. Trigger Wallet Connection
  const handleConnect = async () => {
    try {
      const authResponse = await connect({
        appDetails: {
          name: 'Stacks DeFi Tracker Pro',
          icon: window.location.origin + '/logo.png',
        },
      });
      
      const addr = authResponse.addresses.find(a => a.symbol === 'STX')?.address;
      if (addr) {
        setStxAddress(addr);
        fetchBalance(addr);
      }
    } catch (err) {
      console.error("Connection cancelled or failed", err);
    }
  };

  const handleLogout = () => {
    disconnect();
    setStxAddress(null);
    setBalance('0');
  };

  return (
    <nav className="flex justify-between items-center p-6 bg-slate-900 border-b border-slate-800">
      <div className="text-xl font-bold text-orange-500">Stacks Tracker Pro</div>
      
      <div className="flex items-center gap-6">
        {stxAddress ? (
          <div className="flex items-center gap-4 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400 font-medium">Balance</span>
              <span className="text-sm font-bold text-white">{balance} STX</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700 mx-1"></div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium italic">Connected</span>
              <span className="text-sm text-orange-400">
                {stxAddress.substring(0, 5)}...{stxAddress.substring(stxAddress.length - 4)}
              </span>
            </div>
            <button onClick={handleLogout} className="ml-2 text-slate-500 hover:text-white transition">
              ✕
            </button>
          </div>
        ) : (
          <button 
            onClick={handleConnect}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg transition-all transform hover:scale-105"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
