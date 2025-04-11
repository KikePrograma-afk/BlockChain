// src/components/VerifyMatch.tsx
import React, { useState } from 'react';
// Importar tipos específicos de ethers además del objeto principal
import { ethers, Log, LogDescription } from 'ethers'; // Asegurarse que Log y LogDescription estén si los necesitasen otros lados, aunque no directamente aquí
import { CheckCircle } from 'lucide-react';
import { CHALLENGE_ABI } from '../contracts/abi'; // ABI Nativo

interface VerifyMatchProps {
  account: string;
  contractAddress: string;
}

// --- Helper Function (si la necesitas para otras validaciones) ---
function checkTeamMatch(submittedIds: string[], apiTeamIdsSet: Set<string>): boolean {
    if (submittedIds.length !== 6 || apiTeamIdsSet.size !== 6) {
        console.warn(`checkTeamMatch: Tamaños no coinciden. Submitted: ${submittedIds.length}, API Set: ${apiTeamIdsSet.size}`);
        return false;
    }
    return submittedIds.every(id => apiTeamIdsSet.has(id));
}
// --- Fin Helper Function ---


const VerifyMatch: React.FC<VerifyMatchProps> = ({ account, contractAddress }) => {
  const [challengeId, setChallengeId] = useState('');
  const [matchId, setMatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const verifyMatch = async () => {
    setStatus('');
    if (!matchId || !challengeId || !/^\d+$/.test(challengeId) || !/^\d+$/.test(matchId)) {
      setStatus('Error: Ingresa un ID de Desafío y un ID de Partida numéricos válidos.');
      return;
    }
    if (!window.ethereum) {
        setStatus('Error: Instala MetaMask.');
        return;
    }

    setLoading(true);
    setStatus('Iniciando verificación...');

    let contractReader: ethers.Contract | null = null;
    let provider: ethers.BrowserProvider | null = null;

    try {
      // 0. Provider y Reader
      provider = new ethers.BrowserProvider(window.ethereum);
      contractReader = new ethers.Contract(contractAddress, CHALLENGE_ABI, provider);

      // --- PASO 1: OBTENER DATOS DEL DESAFÍO ---
      setStatus('Obteniendo datos del desafío...');
      let challengeData;
      try {
          challengeData = await contractReader.getChallenge(challengeId);
          if (!challengeData || challengeData.id === 0n) { throw new Error(`Desafío #${challengeId} no encontrado.`); }
          const challengeStatus = Number(challengeData.status);
           // Permitir verificar solo si está Aceptado (estado 1)
          if (challengeStatus !== 1) {
               const statusMap = ['Creado', 'Aceptado', 'Pagado', 'Disputado', 'Cancelado'];
               throw new Error(`El desafío #${challengeId} debe estar 'Aceptado' (estado actual: ${statusMap[challengeStatus] || challengeStatus}).`);
           }
      } catch (err: any) { throw new Error(`Error al obtener desafío: ${err.message || err}`); }

      const challengeAcceptTime = Number(challengeData.acceptTime);
      const challengeRequiredStartTime = Number(challengeData.requiredStartTime);
      const contractChallengingTeamIds: string[] = challengeData.challengingTeam.map((id: bigint) => id.toString());
      const contractAcceptingTeamIds: string[] = challengeData.acceptingTeam.map((id: bigint) => id.toString());
      console.log("DEBUG: Equipo Desafiante (Contrato):", contractChallengingTeamIds);
      console.log("DEBUG: Equipo Aceptante (Contrato):", contractAcceptingTeamIds);


      // --- PASO 2: OBTENER DATOS DE LA API ---
      setStatus('Verificando partida con la API...');
      const apiUrl = `https://api.deadlock-api.com/v1/matches/${matchId}/metadata`;
      let apiData;
      try {
          const response = await fetch(apiUrl);
          if (!response.ok) { throw new Error(`Error API ${response.status}: ${response.statusText}`); }
          apiData = await response.json();
      } catch (fetchError: any) { throw new Error(`Fallo al contactar API: ${fetchError.message}`); }

      const matchInfo = apiData?.match_info;
      if (!matchInfo || !matchInfo.players || matchInfo.players.length < 10 || typeof matchInfo.winning_team === 'undefined' || !matchInfo.start_time) {
        throw new Error('Datos inválidos o incompletos de la API.');
      }
      setStatus('API OK. Validando datos...');

      const apiStartTimeUnix = Math.floor(new Date(matchInfo.start_time).getTime() / 1000);
      if (isNaN(apiStartTimeUnix) || apiStartTimeUnix <= 0) { throw new Error("Fecha inválida de API."); }
      const winningTeamIndexApi = Number(matchInfo.winning_team);

      const apiTeam0Ids = new Set<string>();
      const apiTeam1Ids = new Set<string>();
      matchInfo.players.forEach((p: any) => {
          if (p?.account_id) {
              const idStr = p.account_id.toString();
              if (p.team === 0) apiTeam0Ids.add(idStr);
              else if (p.team === 1) apiTeam1Ids.add(idStr);
          }
      });
      if (apiTeam0Ids.size !== 6 || apiTeam1Ids.size !== 6) {
           throw new Error(`Equipos incompletos en API (T0: ${apiTeam0Ids.size}, T1: ${apiTeam1Ids.size}). Se requieren 6.`);
       }
      console.log("DEBUG: Equipo 0 (API):", [...apiTeam0Ids]);
      console.log("DEBUG: Equipo 1 (API):", [...apiTeam1Ids]);

      // --- PASO 3: VALIDACIÓN DE TIEMPOS (Frontend - CON MENSAJE MEJORADO) ---
      setStatus('Validando tiempos...');
      const apiStartTimeFormatted = new Date(apiStartTimeUnix * 1000).toLocaleString();
      const challengeAcceptTimeFormatted = new Date(challengeAcceptTime * 1000).toLocaleString();
      console.log(`DEBUG: API Start Time: ${apiStartTimeUnix} (${apiStartTimeFormatted})`);
      console.log(`DEBUG: Challenge Accept Time: ${challengeAcceptTime} (${challengeAcceptTimeFormatted})`);
      console.log(`DEBUG: Challenge Required Start Time: ${challengeRequiredStartTime} (${challengeRequiredStartTime ? new Date(challengeRequiredStartTime * 1000).toLocaleString() : 'N/A'})`);

      if (apiStartTimeUnix < challengeAcceptTime) {
          throw new Error(`Partida empezó (${apiStartTimeFormatted}) ANTES de aceptar el desafío (${challengeAcceptTimeFormatted}).`); // Mensaje mejorado
      }
      if (challengeRequiredStartTime !== 0 && apiStartTimeUnix < challengeRequiredStartTime) {
           const challengeRequiredStartTimeFormatted = new Date(challengeRequiredStartTime * 1000).toLocaleString();
          throw new Error(`Partida empezó (${apiStartTimeFormatted}) ANTES del tiempo mínimo requerido (${challengeRequiredStartTimeFormatted}).`); // Mensaje mejorado
      }
      setStatus('Validación de tiempos OK.');
      // --- FIN PASO 3 ---

      // --- PASO 4: VALIDACIÓN DETALLADA DE EQUIPOS (Frontend) ---
      setStatus('Validando coincidencia de equipos...');
      const challengingIsApi0 = checkTeamMatch(contractChallengingTeamIds, apiTeam0Ids);
      const acceptingIsApi1 = checkTeamMatch(contractAcceptingTeamIds, apiTeam1Ids);
      const challengingIsApi1 = checkTeamMatch(contractChallengingTeamIds, apiTeam1Ids);
      const acceptingIsApi0 = checkTeamMatch(contractAcceptingTeamIds, apiTeam0Ids);
      const scenario1Match = challengingIsApi0 && acceptingIsApi1;
      const scenario2Match = challengingIsApi1 && acceptingIsApi0;
      console.log(`DEBUG: challengingIsApi0=${challengingIsApi0}, acceptingIsApi1=${acceptingIsApi1} => Scenario1=${scenario1Match}`);
      console.log(`DEBUG: challengingIsApi1=${challengingIsApi1}, acceptingIsApi0=${acceptingIsApi0} => Scenario2=${scenario2Match}`);

      if (!scenario1Match && !scenario2Match) {
          const allContractPlayerIds = [...contractChallengingTeamIds, ...contractAcceptingTeamIds];
          const allApiPlayerIds = new Set([...apiTeam0Ids, ...apiTeam1Ids]);
          const missingFromApi = allContractPlayerIds.filter(id => !allApiPlayerIds.has(id));
          if (missingFromApi.length > 0) { throw new Error(`Error Verificación: Jugadores del desafío no encontrados en la partida API ${matchId}: ${missingFromApi.join(', ')}.`); }
          else { throw new Error(`Error Verificación: Los 12 jugadores están, pero los equipos no coinciden con la API.`); }
      }
      setStatus('Validación de equipos OK.');
      // --- FIN PASO 4 ---

      // --- PASO 5: PREPARAR DATOS PARA EL CONTRATO ---
      const team0PlayersBigInt = Array.from(apiTeam0Ids).map(id => BigInt(id));
      const team1PlayersBigInt = Array.from(apiTeam1Ids).map(id => BigInt(id));

      // --- PASO 6: LLAMAR AL CONTRATO (CON SIGNER) ---
      setStatus('Enviando datos de verificación al contrato...');
      if (!provider) throw new Error("Provider no inicializado");
      const signer = await provider.getSigner();
      const contractWriter = new ethers.Contract(contractAddress, CHALLENGE_ABI, signer);

      const tx = await contractWriter.verifyMatchOutcomeAndPay(
        challengeId, matchId, apiStartTimeUnix, winningTeamIndexApi, team0PlayersBigInt, team1PlayersBigInt
      );

      setStatus('Esperando confirmación de la verificación...');
      await tx.wait(1);

      setStatus(`¡Éxito! Partida verificada y pago procesado. Tx: ${tx.hash.substring(0,10)}...`);
      setChallengeId('');
      setMatchId('');

    } catch (error: any) {
      console.error('Error en verifyMatch:', error);
      // Mostrar directamente el mensaje del error lanzado
      setStatus(`Error: ${error.message || 'Ocurrió un error desconocido.'}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Renderizado JSX (sin cambios) ---
  return (
    <div className="bg-white rounded-lg shadow p-6">
       <div className="flex items-center mb-6">
        <CheckCircle className="w-6 h-6 mr-2 text-blue-500" />
        <h2 className="text-2xl font-bold">Verificar Partida y Pagar</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label htmlFor="verify-challenge-id" className="block text-sm font-medium text-gray-700 mb-1"> ID del Desafío </label>
          <input type="text" id="verify-challenge-id" value={challengeId} onChange={(e) => /^\d*$/.test(e.target.value) && setChallengeId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50" placeholder="ID del desafío a verificar" disabled={loading} pattern="\d*" />
        </div>
        <div>
          <label htmlFor="verify-match-id" className="block text-sm font-medium text-gray-700 mb-1"> ID de la Partida (de la API) </label>
          <input type="text" id="verify-match-id" value={matchId} onChange={(e) => /^\d*$/.test(e.target.value) && setMatchId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50" placeholder="ID de la partida jugada" disabled={loading} pattern="\d*" />
        </div>
        {status && ( <div className={`mt-4 p-3 rounded-md text-sm ${ status.startsWith('Error:') ? 'bg-red-100 text-red-700 border border-red-300' : status.startsWith('¡Éxito!') ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-blue-100 text-blue-700 border border-blue-300' }`}> {status} </div> )}
        <button onClick={verifyMatch} disabled={loading || !account} className={`w-full bg-blue-500 text-white py-3 rounded-md font-semibold transition duration-150 ease-in-out ${ (loading || !account) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600' }`} > {loading ? 'Verificando...' : 'Verificar Partida'} </button>
      </div>
    </div>
  );
};

export default VerifyMatch;