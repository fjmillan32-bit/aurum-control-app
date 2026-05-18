import { supabase } from './supabaseClient';

const STORAGE_KEYS = {
  OPERARIOS: 'aurum_operarios',
  EQUIPOS: 'aurum_equipos',
  CORRIDAS: 'aurum_corridas',
  PENDIENTES: 'aurum_pendientes',
};

// --- Operarios ---
export function getOperarios() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.OPERARIOS) || '[]');
}

export function addOperario(operario: any) {
  const ops = getOperarios();
  const newId = Date.now();
  const newOp = { ...operario, id: newId, sincronizado: false };
  ops.push(newOp);
  localStorage.setItem(STORAGE_KEYS.OPERARIOS, JSON.stringify(ops));
  addPendiente('operarios', 'INSERT', newOp);
  return newOp;
}

export function updateOperario(id: number, updates: any) {
  const ops = getOperarios();
  const index = ops.findIndex(o => o.id === id);
  if (index !== -1) {
    ops[index] = { ...ops[index], ...updates, sincronizado: false };
    localStorage.setItem(STORAGE_KEYS.OPERARIOS, JSON.stringify(ops));
    addPendiente('operarios', 'UPDATE', { id, ...updates });
  }
}

export function deleteOperario(id: number) {
  let ops = getOperarios();
  ops = ops.filter(o => o.id !== id);
  localStorage.setItem(STORAGE_KEYS.OPERARIOS, JSON.stringify(ops));
  addPendiente('operarios', 'DELETE', { id });
}

// --- Equipos ---
export function getEquipos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.EQUIPOS) || '[]');
}

export function addEquipo(equipo: any) {
  const eqs = getEquipos();
  const newId = Date.now();
  const newEq = { ...equipo, id: newId, sincronizado: false };
  eqs.push(newEq);
  localStorage.setItem(STORAGE_KEYS.EQUIPOS, JSON.stringify(eqs));
  addPendiente('equipos', 'INSERT', newEq);
  return newEq;
}

export function updateEquipo(id: number, updates: any) {
  const eqs = getEquipos();
  const index = eqs.findIndex(e => e.id === id);
  if (index !== -1) {
    eqs[index] = { ...eqs[index], ...updates, sincronizado: false };
    localStorage.setItem(STORAGE_KEYS.EQUIPOS, JSON.stringify(eqs));
    addPendiente('equipos', 'UPDATE', { id, ...updates });
  }
}

export function deleteEquipo(id: number) {
  let eqs = getEquipos();
  eqs = eqs.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.EQUIPOS, JSON.stringify(eqs));
  addPendiente('equipos', 'DELETE', { id });
}

// --- Corridas ---
export function getCorridas() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CORRIDAS) || '[]');
}

export function addCorrida(corrida: any) {
  const cors = getCorridas();
  const newId = Date.now();
  const newCor = { ...corrida, id: newId, sincronizado: false };
  cors.push(newCor);
  localStorage.setItem(STORAGE_KEYS.CORRIDAS, JSON.stringify(cors));
  addPendiente('corridas', 'INSERT', newCor);
  return newCor;
}

// --- Gestión de pendientes ---
function addPendiente(tabla: string, operacion: string, data: any) {
  const pendientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDIENTES) || '[]');
  pendientes.push({ tabla, operacion, data, timestamp: Date.now() });
  localStorage.setItem(STORAGE_KEYS.PENDIENTES, JSON.stringify(pendientes));
}

export async function syncPendientes(onComplete?: () => void) {
  const pendientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDIENTES) || '[]');
  if (pendientes.length === 0) {
    if (onComplete) onComplete();
    return;
  }
  for (const p of pendientes) {
    try {
      if (p.tabla === 'operarios') {
        if (p.operacion === 'INSERT') {
          const { data, error } = await supabase.from('operarios').insert(p.data).select();
          if (!error && data && data[0]) {
            const ops = getOperarios();
            const idx = ops.findIndex(o => o.id === p.data.id);
            if (idx !== -1) {
              ops[idx] = { ...ops[idx], id: data[0].id, sincronizado: true };
              localStorage.setItem(STORAGE_KEYS.OPERARIOS, JSON.stringify(ops));
            }
          }
        } else if (p.operacion === 'UPDATE') {
          await supabase.from('operarios').update(p.data).eq('id', p.data.id);
          const ops = getOperarios();
          const idx = ops.findIndex(o => o.id === p.data.id);
          if (idx !== -1) ops[idx].sincronizado = true;
          localStorage.setItem(STORAGE_KEYS.OPERARIOS, JSON.stringify(ops));
        } else if (p.operacion === 'DELETE') {
          await supabase.from('operarios').delete().eq('id', p.data.id);
        }
      } else if (p.tabla === 'equipos') {
        if (p.operacion === 'INSERT') {
          const { data, error } = await supabase.from('equipos').insert(p.data).select();
          if (!error && data && data[0]) {
            const eqs = getEquipos();
            const idx = eqs.findIndex(e => e.id === p.data.id);
            if (idx !== -1) {
              eqs[idx] = { ...eqs[idx], id: data[0].id, sincronizado: true };
              localStorage.setItem(STORAGE_KEYS.EQUIPOS, JSON.stringify(eqs));
            }
          }
        } else if (p.operacion === 'UPDATE') {
          await supabase.from('equipos').update(p.data).eq('id', p.data.id);
          const eqs = getEquipos();
          const idx = eqs.findIndex(e => e.id === p.data.id);
          if (idx !== -1) eqs[idx].sincronizado = true;
          localStorage.setItem(STORAGE_KEYS.EQUIPOS, JSON.stringify(eqs));
        } else if (p.operacion === 'DELETE') {
          await supabase.from('equipos').delete().eq('id', p.data.id);
        }
      } else if (p.tabla === 'corridas') {
        await supabase.from('corridas').insert(p.data);
        const cors = getCorridas();
        const idx = cors.findIndex(c => c.id === p.data.id);
        if (idx !== -1) cors[idx].sincronizado = true;
        localStorage.setItem(STORAGE_KEYS.CORRIDAS, JSON.stringify(cors));
      }
    } catch (err) {
      console.error('Error sincronizando:', p, err);
    }
  }
  localStorage.setItem(STORAGE_KEYS.PENDIENTES, JSON.stringify([]));
  if (onComplete) onComplete();
}

// Descargar datos remotos y fusionar con locales (sin duplicar)
export async function loadRemoteDataToLocal() {
  // Operarios
  const { data: ops } = await supabase.from('operarios').select('*');
  if (ops && ops.length) {
    const localOps = getOperarios();
    const localMap = new Map(localOps.map(o => [o.id, o]));
    for (const remoteOp of ops) {
      if (localMap.has(remoteOp.id)) {
        // Actualizar datos existentes (ej: cambios de nombre o activo)
        const local = localMap.get(remoteOp.id);
        if (JSON.stringify(local) !== JSON.stringify(remoteOp)) {
          const index = localOps.findIndex(o => o.id === remoteOp.id);
          if (index !== -1) localOps[index] = { ...remoteOp, sincronizado: true };
        }
      } else {
        // Nuevo operario
        localOps.push({ ...remoteOp, sincronizado: true });
      }
    }
    localStorage.setItem(STORAGE_KEYS.OPERARIOS, JSON.stringify(localOps));
  }

  // Equipos
  const { data: eqs } = await supabase.from('equipos').select('*');
  if (eqs && eqs.length) {
    const localEqs = getEquipos();
    const localMap = new Map(localEqs.map(e => [e.id, e]));
    for (const remoteEq of eqs) {
      if (localMap.has(remoteEq.id)) {
        const local = localMap.get(remoteEq.id);
        if (JSON.stringify(local) !== JSON.stringify(remoteEq)) {
          const index = localEqs.findIndex(e => e.id === remoteEq.id);
          if (index !== -1) localEqs[index] = { ...remoteEq, sincronizado: true };
        }
      } else {
        localEqs.push({ ...remoteEq, sincronizado: true });
      }
    }
    localStorage.setItem(STORAGE_KEYS.EQUIPOS, JSON.stringify(localEqs));
  }

  // Corridas (opcional, puedes limitar a las del mes)
  const { data: cors } = await supabase.from('corridas').select('*').order('hora_inicio', { ascending: false }).limit(500);
  if (cors && cors.length) {
    const localCors = getCorridas();
    const localMap = new Map(localCors.map(c => [c.id, c]));
    for (const remoteCor of cors) {
      if (!localMap.has(remoteCor.id)) {
        localCors.push({ ...remoteCor, sincronizado: true });
      }
    }
    localStorage.setItem(STORAGE_KEYS.CORRIDAS, JSON.stringify(localCors));
  }
}

// Sincronización completa (bidireccional)
export async function syncFull(onComplete?: () => void) {
  await syncPendientes();
  await loadRemoteDataToLocal();
  if (onComplete) onComplete();
}
