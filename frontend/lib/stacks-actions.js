import { openContractCall } from '@stacks/connect';
import { Cl } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';

export const handleSwap = async (amountSTX, userAddress) => {
  const network = new StacksMainnet();

  const options = {
    // ALEX DEX Contract Example
    contractAddress: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA2TRRA',
    contractName: 'fixed-weight-pool-v1-01',
    functionName: 'swap-x-for-y',
    functionArgs: [
      Cl.address('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA2TRRA.token-wstx'), // Token X (STX)
      Cl.address('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA2TRRA.age000-dot-alex'), // Token Y (ALEX)
      Cl.uint(0.5 * 100000000), // Weight X
      Cl.uint(amountSTX * 1000000), // Amount of micro-STX to swap
      Cl.none(), // Minimum received (Optional)
    ],
    network,
    appDetails: {
      name: 'Stacks DeFi Tracker Pro',
      icon: window.location.origin + '/logo.png',
    },
    onFinish: (data) => {
      console.log('Transaction Sent:', data.txId);
      alert('Swap Broadcasted! Your dashboard will update once confirmed.');
    },
  };

  await openContractCall(options);
};
