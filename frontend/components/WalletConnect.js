'use client';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { useState, useEffect } from 'react';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export default function WalletConnect() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, []);

  const connectWallet = () => {
    showConnect({
      appDetails: {
        name: 'Stacks DeFi Tracker Pro',
        icon: window.location.origin + '/favicon.ico',
      },
      onFinish: () => {
        window.location.reload(); // Refresh to show the address
      },
      userSession,
    });
  };

  const disconnect = () => {
    userSession.signUserOut();
    setUserData(null);
  };

  return (
    <div className="flex items-center gap-4">
      {!userData ? (
        <button 
          onClick={connectWallet}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold transition"
        >
          Connect Stacks Wallet
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {userData.profile.stxAddress.mainnet.substring(0, 5)}...
            {userData.profile.stxAddress.mainnet.substring(35)}
          </span>
          <button 
            onClick={disconnect}
            className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
