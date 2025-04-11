// src/components/ChallengeList.tsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { List } from 'lucide-react';
import { CHALLENGE_ABI } from '../contracts/abi'; // ABI Nativo con 'as const'

interface ChallengeListProps {
  account: string; // Cuenta conectada actualmente
  contractAddress: string; // Dirección del contrato DeadlockChallengeNative
}

// Interface interna para datos del desafío que mostraremos
interface ChallengeDisplay {
  id: string;
  captain1: string;
  challengingTeam: string[];
  creationTime: number;
  stakeAmount: string;
}

const ChallengeList: React.FC<ChallengeListProps> = ({
  account,
  contractAddress,
}) => {
  const [challenges, setChallenges] = useState<ChallengeDisplay[]>([]); // Usamos ChallengeDisplay
  const [loading, setLoading] = useState(true);
  const [acceptingIds, setAcceptingIds] = useState<{ [key: string]: string[] }>({});
  const [statusMessage, setStatusMessage] = useState('');

  // --- Función para cargar desafíos ---
  const loadChallenges = async () => {
    // Reiniciar estado antes de cargar
    setLoading(true);
    setStatusMessage('Cargando desafíos...');
    setChallenges([]); // Limpiar lista previa

    if (!window.ethereum || !contractAddress) {
        setStatusMessage("Error: Conecta MetaMask y asegúrate que la dirección del contrato es correcta.");
        setLoading(false);
        return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractReader = new ethers.Contract(contractAddress, CHALLENGE_ABI, provider);

      let count = 0;
      try {
        const countBigInt = await contractReader.challengeCounter();
        // Asegurar conversión segura a número
        count = typeof countBigInt === 'bigint' ? Number(countBigInt) : 0;
        console.log("DEBUG: Contador leído:", count, "(desde", countBigInt, ")");
      } catch (counterError) {
        console.error("Error leyendo challengeCounter:", counterError);
        throw new Error("No se pudo obtener el contador de desafíos.");
      }

      if (count === 0) {
        setStatusMessage('No hay desafíos creados todavía.');
        setLoading(false);
        return;
      }
      setStatusMessage(`Total desafíos: ${count}. Buscando abiertos...`);

      const promises = [];
      for (let i = count; i >= 1; i--) {
        promises.push(
             contractReader.getChallenge(i)
             .then(challengeData => {
                 console.log(`DEBUG: Challenge ID ${i} Raw Data:`, challengeData);

                 // --- COMPARACIÓN DIRECTA CON BIGINT 0n ---
                 const statusValue = challengeData.status; // Debería ser BigInt
                 console.log(`DEBUG: Challenge ID ${i} Raw Status Value:`, statusValue, `(Type: ${typeof statusValue})`);

                 // Comparamos el valor leído (probablemente BigInt) con 0n
                 if (statusValue === 0n) {
                      console.log(`DEBUG: Challenge ID ${i} tiene estado 0 (Created). Añadiendo.`);
                      // Devolvemos el objeto solo si el estado es 0
                      return {
                          id: i.toString(),
                          captain1: challengeData.captain1,
                          challengingTeam: challengeData.challengingTeam.map((id: bigint) => id.toString()),
                          creationTime: Number(challengeData.creationTime),
                          stakeAmount: ethers.formatEther(challengeData.amountStaked)
                      };
                 } else {
                      console.log(`DEBUG: Challenge ID ${i} tiene estado ${statusValue}, descartando.`);
                      return null; // Descartar si no es estado 0
                 }
                 // --- FIN COMPARACIÓN ---
             })
             .catch(err => {
                 console.warn(`Error cargando desafío ID ${i}:`, err);
                 return null; // Devolver null si falla la lectura de este ID
             })
         );
      }

      // Esperar todas las lecturas
      const results = await Promise.all(promises);
      // Filtrar los nulos (errores o no abiertos) y asegurar el tipo
      const openChallenges = results.filter((c): c is ChallengeDisplay => c !== null);

      console.log("DEBUG: Desafíos filtrados finales (status 0):", openChallenges);

      setChallenges(openChallenges); // Actualizar el estado con los desafíos abiertos

      // Actualizar mensaje final
      if (openChallenges.length === 0) {
        setStatusMessage('No hay desafíos abiertos actualmente.');
      } else {
        setStatusMessage(''); // Limpiar mensaje si se encontraron
      }

    } catch (error: any) {
      console.error('Error general en loadChallenges:', error);
      setStatusMessage(`Error al cargar: ${error.message || 'Error desconocido'}`);
      setChallenges([]); // Asegurar lista vacía en caso de error general
    } finally {
      setLoading(false);
    }
  };

   // Cargar al montar y al cambiar props
   useEffect(() => {
    const timer = setTimeout(loadChallenges, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, contractAddress]);


  // --- Función para aceptar desafío (sin cambios lógicos internos) ---
  const handleAcceptChallenge = async (challengeId: string) => {
    const teamToAccept = acceptingIds[challengeId];
    setStatusMessage('');

    // Validaciones
    if (!window.ethereum) { setStatusMessage('Error: Instala MetaMask.'); return; }
    if (!teamToAccept || teamToAccept.some(id => !id || !/^\d+$/.test(id)) || teamToAccept.length !== 6) {
        setStatusMessage(`Error: Ingresa 6 IDs numéricos válidos para aceptar el desafío #${challengeId}.`);
        return;
    }
    // Evitar aceptar propio desafío (doble chequeo por si acaso)
    const challengeToAccept = challenges.find(c => c.id === challengeId);
    if(challengeToAccept && account.toLowerCase() === challengeToAccept.captain1.toLowerCase()) {
        setStatusMessage("Error: No puedes aceptar tu propio desafío.");
        return;
    }


    setLoading(true);
    setStatusMessage(`Aceptando desafío #${challengeId}...`);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const challengeContract = new ethers.Contract(contractAddress, CHALLENGE_ABI, signer);
      const stakeAmount = ethers.parseEther('5');
      const teamIdsBigInt = teamToAccept.map(id => BigInt(id));

      const tx = await challengeContract.acceptChallenge(
        challengeId,
        teamIdsBigInt,
        { value: stakeAmount }
      );

      setStatusMessage(`Esperando confirmación para aceptar #${challengeId}...`);
      await tx.wait(1);

      setStatusMessage(`¡Éxito! Desafío #${challengeId} aceptado.`);
      setAcceptingIds(prev => {
          const newState = { ...prev };
          delete newState[challengeId];
          return newState;
      });
      loadChallenges(); // Recargar

    } catch (error: any) {
       // ... (Manejo de errores como estaba) ...
      console.error('Error accepting challenge:', error);
      const reason = error?.reason || error?.data?.message || error?.message || 'Ocurrió un error desconocido.';
       if (error.code === 'ACTION_REJECTED') { setStatusMessage('Error: Transacción rechazada.'); }
       else if (reason.includes("Must send exact stake amount")) { setStatusMessage('Error: Debes enviar exactamente 5 S.'); }
       else if (reason.includes("Challenge not in Created state")) { setStatusMessage(`Error: El desafío #${challengeId} ya no está abierto.`); loadChallenges(); }
       else if (reason.includes("Creator cannot accept own challenge")) { setStatusMessage(`Error: No puedes aceptar tu propio desafío.`); }
       else { setStatusMessage(`Error al aceptar: ${reason}`); }
    } finally {
      setLoading(false);
    }
  };

  // --- Handler para inputs (sin cambios) ---
  const handlePlayerIdChange = (challengeId: string, index: number, value: string) => {
     if (/^\d*$/.test(value)) {
        setAcceptingIds(prev => ({
          ...prev,
          [challengeId]: Object.assign([], prev[challengeId] || Array(6).fill(''), { [index]: value })
        }));
     }
  };

  // --- Renderizado JSX (igual que la versión anterior, usa 'challenges') ---
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <List className="w-6 h-6 mr-2 text-blue-500" />
        <h2 className="text-2xl font-bold">Desafíos Abiertos</h2>
      </div>

       {statusMessage && (
         <div className={`mb-4 p-3 rounded-md text-sm ${ statusMessage.startsWith('Error:') ? 'bg-red-100 text-red-700 border border-red-300' : statusMessage.startsWith('¡Éxito!') ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-blue-100 text-blue-700 border border-blue-300' }`}>
           {statusMessage}
         </div>
       )}
      {loading && ( <div className="text-center py-8 text-gray-500">Cargando...</div> )}
      {!loading && challenges.length === 0 && ( <p className="text-gray-500 text-center py-4">No se encontraron desafíos abiertos.</p> )}

      {!loading && challenges.length > 0 && (
        <div className="space-y-6">
          {challenges.map(challenge => (
            <div key={challenge.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3 pb-2 border-b">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Desafío <span className="text-blue-600">#{challenge.id}</span></h3>
                  <p className="text-xs text-gray-500 mt-1"> Creador: <span className="font-mono">{challenge.captain1.slice(0, 6)}...{challenge.captain1.slice(-4)}</span> </p>
                  <p className="text-xs text-gray-400"> Creado: {new Date(challenge.creationTime * 1000).toLocaleString()} </p>
                </div>
                <div className="text-right">
                     <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold tracking-wide"> ABIERTO </span>
                     <p className="text-sm font-medium text-gray-700 mt-1"> Apuesta: {challenge.stakeAmount} S </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                <div className="border-r-0 lg:border-r lg:pr-6 border-gray-200">
                  <h4 className="text-base font-semibold text-gray-700 mb-2">Equipo Desafiante</h4>
                  <ul className="space-y-1 text-sm">
                    {challenge.challengingTeam.map((id, index) => ( <li key={index} className="flex items-center"> <span className="w-20 inline-block text-gray-500">Jugador {index + 1}:</span> <span className="font-mono text-gray-800 truncate ml-2" title={id}>{id || '-'}</span> </li> ))}
                  </ul>
                </div>
                {account.toLowerCase() !== challenge.captain1.toLowerCase() ? (
                    <div>
                        <h4 className="text-base font-semibold text-gray-700 mb-2">Aceptar con tu Equipo (6 IDs)</h4>
                        <div className="space-y-1">
                            {Array.from({ length: 6 }).map((_, index) => ( <input key={`${challenge.id}-${index}-accept`} type="text" value={acceptingIds[challenge.id]?.[index] || ''} onChange={(e) => handlePlayerIdChange(challenge.id, index, e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100" placeholder={`Tu Jugador ${index + 1} ID (números)`} required disabled={loading} pattern="\d+" title="Ingrese solo números" /> ))}
                        </div>
                        <button onClick={() => handleAcceptChallenge(challenge.id)} disabled={loading || !account} className="w-full mt-3 bg-blue-500 text-white py-2 px-4 rounded-md font-semibold transition duration-150 ease-in-out hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed" > {loading ? 'Procesando...' : 'Aceptar Desafío (5 S)'} </button>
                    </div>
                 ) : ( <div className="flex items-center justify-center text-sm text-gray-500 italic h-full"> (Eres el creador de este desafío) </div> )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChallengeList;