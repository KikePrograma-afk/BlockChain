import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers'; // Sigue siendo necesario para la declaración global y potencialmente en hijos
import { Wallet, CircleDollarSign, CheckCircle, List } from 'lucide-react';
import CreateChallenge from './components/CreateChallenge';
import ChallengeList from './components/ChallengeList';
import VerifyMatch from './components/VerifyMatch';
import ConnectWallet from './components/ConnectWallet';

// Declaración global para window.ethereum (se mantiene)
declare global {
    interface Window {
        ethereum?: {
            request: (request: { method: string; params?: any[] | Record<string, any> }) => Promise<any>;
            on?: (event: string, listener: (...args: any[]) => void) => void; // Podrías añadir 'on' si lo usas para eventos
        }
    }
}

// --- CONSTANTES ACTUALIZADAS ---
// Dirección del NUEVO contrato DeadlockChallengeNative
const CONTRACT_ADDRESS = '0x9fef9cb6026067b533fea49249a7151dc6b7bf0b';
// Ya NO necesitamos la dirección del token ERC-20
// const SONIC_TOKEN_ADDRESS = '...'; // Eliminado o comentado

function App() {
  const [account, setAccount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'verify'>('create');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    } else {
        console.warn("MetaMask (window.ethereum) no detectado.");
    }
  };

  const renderContent = () => {
    if (!account) {
      // Lógica para conectar la billetera (se mantiene)
      return <ConnectWallet onConnect={async () => {
          if (window.ethereum) {
              try {
                  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                  if (accounts.length > 0) {
                      setAccount(accounts[0]);
                  }
              } catch (error) {
                  console.error("Error al conectar:", error);
              }
          } else {
              alert("Instala MetaMask para conectar tu billetera.");
          }
      }} />;
    }

    // --- Renderizado de Componentes HIJOS (Props Ajustadas) ---
    switch (activeTab) {
      case 'create':
        // Ya NO pasamos sonicTokenAddress
        return <CreateChallenge account={account} contractAddress={CONTRACT_ADDRESS} />;
      case 'list':
         // Ya NO pasamos sonicTokenAddress
        return <ChallengeList account={account} contractAddress={CONTRACT_ADDRESS} />;
      case 'verify':
        // VerifyMatch probablemente solo necesita la dirección del contrato
        return <VerifyMatch account={account} contractAddress={CONTRACT_ADDRESS} />;
      default:
        return null;
    }
  };

  // --- JSX (Interfaz de Usuario - Sin cambios estructurales) ---
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Deadlock Challenge</h1>
              </div>
            </div>
            {account && (
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-4">
                  {`${account.slice(0, 6)}...${account.slice(-4)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {account && (
        <div className="flex justify-center space-x-4 py-4 bg-white shadow-sm">
           <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'create' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <CircleDollarSign className="w-5 h-5 mr-2" />
            Create Challenge
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <List className="w-5 h-5 mr-2" />
            View Challenges
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'verify' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Verify Match
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;