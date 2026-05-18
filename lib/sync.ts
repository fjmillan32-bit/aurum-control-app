import { supabase } from "./supabaseClient";
import { db, CorridaOffline } from "./db";

// Sincronizar corridas pendientes (sincronizado = false) hacia Supabase
export async function syncPendingCorridas() {
  const pending = await db.corridas.where("sincronizado").equals(false).toArray();
  if (pending.length === 0) return;

  console.log(`Sincronizando ${pending.length} corridas pendientes...`);

  for (const corrida of pending) {
    // Preparar datos para Supabase (sin el id local)
    const { id, ...corridaData } = corrida;
    
    const { error } = await supabase.from("corridas").insert([corridaData]);
    
    if (!error) {
      // Marcar como sincronizado y opcionalmente borrar local (o mantener como respaldo)
      await db.corridas.update(id!, { sincronizado: true });
      console.log(`Corrida ${id} sincronizada`);
    } else {
      console.error(`Error sincronizando corrida ${id}:`, error);
    }
  }
}

// Escuchar cambios de conexión y sincronizar automáticamente
export function initOfflineSync() {
  const handleOnline = () => {
    console.log("Conexión recuperada, sincronizando...");
    syncPendingCorridas();
  };

  window.addEventListener("online", handleOnline);
  // También sincronizar al cargar la página si hay conexión
  if (navigator.onLine) {
    syncPendingCorridas();
  }

  return () => window.removeEventListener("online", handleOnline);
}
