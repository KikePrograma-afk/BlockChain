// src/components/CreateChallenge.tsx
import React, { useState } from 'react';
// Importar tipos específicos de ethers además del objeto principal
import { ethers, Log, LogDescription } from 'ethers';
import { CircleDollarSign } from 'lucide-react';
import { CHALLENGE_ABI } from '../contracts/abi'; // Asegúrate que este ABI tiene 'as const'

interface CreateChallengeProps {
  account: string;
  contractAddress: string;
}

const CreateChallenge: React.FC<CreateChallengeProps> = ({
  account,
  contractAddress,
}) => {
  const [playerIds, setPlayerIds] = useState<string[]>(Array(6).fill(''));
  const [matchId, setMatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handlePlayerIdChange = (index: number, value: string) => {
    if (/^\d*$/.test(value)) {
        const newPlayerIds = [...playerIds];
        newPlayerIds[index] = value;
        setPlayerIds(newPlayerIds);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    // ... (Validaciones) ...
    if (!window.ethereum) {
        setStatus('Error: Instala MetaMask para usar esta función.');
        return;
    }
    if (playerIds.some(id => !id) || playerIds.length !== 6) {
        setStatus("Error: Por favor, ingresa los 6 IDs de jugador numéricos.");
        return;
    }
    const finalMatchId = (matchId && /^\d+$/.test(matchId)) ? matchId : '0';

    setLoading(true);
    setStatus('Preparando transacción...');
    let challengeContract: ethers.Contract | null = null;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      challengeContract = new ethers.Contract(contractAddress, CHALLENGE_ABI, signer);
      const stakeAmount = ethers.parseEther('5');
      const teamIdsBigInt = playerIds.map(id => BigInt(id));

      setStatus('Enviando transacción...');
      const tx = await challengeContract.createChallenge(finalMatchId, teamIdsBigInt, 0, { value: stakeAmount });

      setStatus('Esperando confirmación...');
      const receipt = await tx.wait(1);

      // --- CAPTURAR ID DEL EVENTO (CON TIPOS EXPLÍCITOS) ---
      let newChallengeId = "???";
      if (receipt?.logs && challengeContract) {
          console.log("DEBUG: Recibo obtenido, buscando logs...");
          try {
              // Mapear logs con tipo explícito para 'log'
              const parsedLogs = receipt.logs
                  .map((log: Log) => { // <--- TIPO EXPLÍCITO Log
                      try {
                          return challengeContract!.interface.parseLog(log);
                      } catch (e) {
                          return null;
                      }
                  })
                  // Filtrar con tipo explícito para 'parsed' y type guard
                  .filter((parsed: LogDescription | null): parsed is LogDescription => parsed !== null); // <--- TIPO EXPLÍCITO LogDescription | null

              console.log("DEBUG: Logs parseados:", parsedLogs);

              const challengeCreatedEvent = parsedLogs.find((log: { name: string; }) => log.name === "ChallengeCreated");

              if (challengeCreatedEvent) {
                  console.log("DEBUG: Evento ChallengeCreated encontrado:", challengeCreatedEvent);
                  if (challengeCreatedEvent.args && challengeCreatedEvent.args.length > 0) {
                       newChallengeId = challengeCreatedEvent.args[0].toString();
                       console.log("DEBUG: ID del Desafío extraído:", newChallengeId);
                  } else {
                      console.warn("DEBUG: Evento ChallengeCreated parseado pero sin argumentos.");
                  }
              } else {
                  console.warn("DEBUG: Evento ChallengeCreated NO encontrado.");
                  // Fallback (opcional)
                  try {
                    const counterFallback = await challengeContract.challengeCounter; // Acceder sin ()
                    newChallengeId = counterFallback.toString();
                    console.log("DEBUG: Fallback - Usando challengeCounter actual:", newChallengeId);
                  } catch (counterErr) {
                      console.error("DEBUG: Fallback - Error al leer challengeCounter", counterErr);
                  }
              }
          } catch (parseError) {
              console.error("Error crítico parseando logs:", parseError);
          }
      } else {
          console.warn("DEBUG: No se obtuvieron logs en el recibo.");
      }
      // --- FIN CAPTURAR ID ---

      setStatus(`¡Éxito! Desafío #${newChallengeId} creado. Tx: ${tx.hash.substring(0,10)}...`);
      setPlayerIds(Array(6).fill(''));
      setMatchId('');

    } catch (error: any) {
      // ... (manejo de errores) ...
       console.error('Error en handleSubmit:', error);
       const reason = error?.reason || error?.data?.message || error?.message || 'Ocurrió un error desconocido.';
       if (error.code === 'ACTION_REJECTED') {
         setStatus('Error: Transacción rechazada por el usuario.');
       } else if (reason.includes("Must send exact stake amount")) {
         setStatus('Error: Problema con la cantidad enviada (debería ser 5 S).');
       } else {
         setStatus(`Error: ${reason}`);
       }
    } finally {
      setLoading(false);
    }
  };

  // --- Renderizado JSX (sin cambios) ---
  return (
    // ... (El JSX permanece igual) ...
     <div className="bg-white rounded-lg shadow p-6">
       <div className="flex items-center mb-6">
        <CircleDollarSign className="w-6 h-6 mr-2 text-blue-500" />
        <h2 className="text-2xl font-bold">Crear Desafío</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Grid para IDs de jugador */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {playerIds.map((id, index) => (
            <div key={index}>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                Jugador {index + 1} ID
              </label>
              <input
                type="text" // text pero validamos que sean números
                value={id}
                onChange={(e) => handlePlayerIdChange(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                placeholder="ID numérico de cuenta"
                required
                disabled={loading}
                pattern="\d+" // Patrón HTML para números
                title="Por favor, ingrese solo números." // Mensaje de validación HTML
              />
            </div>
          ))}
        </div>

        {/* Input para Match ID Opcional */}
        <div className="mb-6">
           <label className="block text-sm font-medium text-gray-700 mb-1">
            Match ID Predefinido (Opcional)
          </label>
          <input
            type="text" // text pero validamos que sean números
            value={matchId}
            onChange={(e) => /^\d*$/.test(e.target.value) && setMatchId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            placeholder="Dejar vacío o 0 si no aplica"
            disabled={loading}
             pattern="\d*"
             title="Por favor, ingrese solo números."
          />
        </div>

        {/* Área para mostrar mensajes de estado/error */}
        {status && (
          <div className={`mb-4 p-3 rounded-md text-sm ${
            status.startsWith('Error:') ? 'bg-red-100 text-red-700 border border-red-300' :
            status.startsWith('¡Éxito!') ? 'bg-green-100 text-green-700 border border-green-300' :
            'bg-blue-100 text-blue-700 border border-blue-300' // Para mensajes informativos/de carga
          }`}>
            {status}
          </div>
        )}

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={loading || !account} // Deshabilitar si carga o no hay cuenta
          className={`w-full bg-blue-500 text-white py-3 rounded-md font-semibold transition duration-150 ease-in-out ${
            (loading || !account) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
          }`}
        >
          {loading ? 'Procesando...' : 'Crear Desafío (5 S)'}
        </button>
      </form>
    </div>
  );
};

export default CreateChallenge;