"use client";

import { useEffect, useState } from "react";
import { getOperarios, getCorridas, syncFull, loadRemoteDataToLocal } from "@/lib/localStorage";
import NuevaCorridaModal from "@/components/NuevaCorridaModal";
import GestionOperariosModal from "@/components/GestionOperariosModal";
import GestionEquiposModal from "@/components/GestionEquiposModal";

type Corrida = {
  id: number;
  oro_gramos: number;
  eficiencia: number;
  operario_id: number;
  hora_inicio: string;
  sincronizado: boolean;
};

// Convierte una fecha UTC (string ISO) a fecha local de Colombia (UTC-5) y devuelve YYYY-MM-DD
function convertirUTCALocalColombia(isoString: string): string {
  const date = new Date(isoString);
  // Ajustar a UTC-5 (Colombia)
  const colombiaOffset = -5 * 60; // minutos
  const localDate = new Date(date.getTime() + (colombiaOffset - date.getTimezoneOffset()) * 60000);
  return localDate.toISOString().split("T")[0];
}

// Obtiene la fecha actual de Colombia en YYYY-MM-DD
function getLocalDateColombia(): string {
  const now = new Date();
  const colombiaOffset = -5 * 60;
  const localDate = new Date(now.getTime() + (colombiaOffset - now.getTimezoneOffset()) * 60000);
  return localDate.toISOString().split("T")[0];
}

export default function Home() {
  const [stats, setStats] = useState({ totalGold: 0, efficiency: 0, activeOperators: 0, todayRuns: 0 });
  const [lastRuns, setLastRuns] = useState<Corrida[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientTime, setClientTime] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOperariosModalOpen, setIsOperariosModalOpen] = useState(false);
  const [isEquiposModalOpen, setIsEquiposModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true); // valor por defecto, se corregirá en useEffect

  useEffect(() => {
    // Establecer el estado de conexión real en cliente
    setIsOnline(navigator.onLine);
    setClientTime(new Date().toLocaleTimeString("es-CO"));
    
    if (getOperarios().length === 0) {
      loadRemoteDataToLocal().then(() => fetchData());
    } else {
      fetchData();
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    console.log("🔄 fetchData ejecutándose");
    const operariosActivos = getOperarios().filter((o: any) => o.activo).length;
    const todasCorridas = getCorridas();
    console.log("📋 Corridas obtenidas:", todasCorridas.length);
    
    const todayColombia = getLocalDateColombia();
    console.log("📅 Fecha Colombia hoy:", todayColombia);
    
    // Filtrar corridas de hoy comparando la fecha local de cada corrida
    const corridasHoy = todasCorridas.filter((c: any) => {
      const fechaCorridaLocal = convertirUTCALocalColombia(c.hora_inicio);
      return fechaCorridaLocal === todayColombia;
    });
    
    console.log("📍 Corridas de hoy (después de conversión):", corridasHoy.length);
    
    const totalOro = corridasHoy.reduce((sum: number, c: any) => sum + (c.oro_gramos || 0), 0);
    const eficacias = corridasHoy.map((c: any) => c.eficiencia).filter((e: any) => e !== null);
    const avgEff = eficacias.length ? eficacias.reduce((a, b) => a + b, 0) / eficacias.length : 0;

    setStats({
      totalGold: totalOro,
      efficiency: Math.round(avgEff),
      activeOperators: operariosActivos,
      todayRuns: corridasHoy.length,
    });
    setLastRuns(corridasHoy.slice(0, 5));
    setLoading(false);
  }

  const handleSync = async () => {
    if (!isOnline) {
      alert("No hay conexión a internet");
      return;
    }
    setSyncing(true);
    try {
      await syncFull();
      alert("Sincronización completada");
    } catch (err) {
      console.error("Error sincronizando:", err);
      alert("Error al sincronizar. Revisa la consola.");
    }
    setSyncing(false);
    await fetchData();
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-wrap justify-between items-center gap-2 mb-6">
          <h1 className="text-2xl font-bold text-amber-500">⚡ Aurum Control</h1>
          <div className="flex gap-2">
            <button onClick={() => setIsOperariosModalOpen(true)} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm font-semibold">👥 Operarios</button>
            <button onClick={() => setIsEquiposModalOpen(true)} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm font-semibold">🚜 Equipos</button>
            <button onClick={() => setIsModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg text-sm font-semibold">+ Nueva Corrida</button>
            <button onClick={handleSync} disabled={syncing || !isOnline} className={`px-3 py-2 rounded-lg text-sm font-semibold ${!isOnline ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {syncing ? "Sincronizando..." : "🔄 Sincronizar"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-xl"><p className="text-gray-400 text-sm">Oro hoy</p><p className="text-2xl font-bold text-amber-400">{stats.totalGold} g</p></div>
          <div className="bg-gray-800 p-4 rounded-xl"><p className="text-gray-400 text-sm">Eficiencia</p><p className="text-2xl font-bold text-green-400">{stats.efficiency}%</p></div>
          <div className="bg-gray-800 p-4 rounded-xl"><p className="text-gray-400 text-sm">Operarios</p><p className="text-2xl font-bold text-blue-400">{stats.activeOperators}</p></div>
          <div className="bg-gray-800 p-4 rounded-xl"><p className="text-gray-400 text-sm">Corridas hoy</p><p className="text-2xl font-bold text-white">{stats.todayRuns}</p></div>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl mb-6">
          <h2 className="font-semibold mb-3">Últimas corridas</h2>
          {loading ? <p className="text-gray-400">Cargando...</p> : lastRuns.length === 0 ? <p className="text-gray-400">No hay corridas hoy. Agrega una.</p> : (
            <ul className="space-y-2">
              {lastRuns.map((run) => (
                <li key={run.id} className="flex justify-between border-b border-gray-700 py-2">
                  <span>Operario ID: {run.operario_id}</span>
                  <span>{run.oro_gramos} g Au</span>
                  <span className={run.eficiencia >= 80 ? "text-green-400" : "text-yellow-400"}>{run.eficiencia || 0}%</span>
                  {!run.sincronizado && <span className="text-xs text-yellow-400">(pendiente)</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded-xl">
          <h2 className="font-semibold mb-2">Estado del sistema</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-sm">{isOnline ? "Conectado" : "Sin conexión - offline"}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Última sincronización: {clientTime}</p>
        </div>
      </div>
      <NuevaCorridaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCorridaAdded={() => fetchData()} />
      <GestionOperariosModal isOpen={isOperariosModalOpen} onClose={() => setIsOperariosModalOpen(false)} onOperarioCreado={() => fetchData()} />
      <GestionEquiposModal isOpen={isEquiposModalOpen} onClose={() => setIsEquiposModalOpen(false)} onEquipoCreado={() => fetchData()} />
    </main>
  );
}
