"use client";

import { useState, useEffect } from "react";
import { getEquipos, addEquipo, updateEquipo, deleteEquipo } from "@/lib/localStorage";

interface GestionEquiposModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipoCreado: () => void;
}

export default function GestionEquiposModal({ isOpen, onClose, onEquipoCreado }: GestionEquiposModalProps) {
  const [equipos, setEquipos] = useState<any[]>([]);
  const [nombre, setNombre] = useState("");
  const [modelo, setModelo] = useState("");
  const [horasMantenimiento, setHorasMantenimiento] = useState("");
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editModelo, setEditModelo] = useState("");
  const [editHoras, setEditHoras] = useState("");

  const cargarEquipos = () => setEquipos(getEquipos());

  useEffect(() => {
    if (isOpen) cargarEquipos();
  }, [isOpen]);

  const agregarEquipo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return alert("El nombre es obligatorio");
    setLoading(true);
    addEquipo({
      nombre: nombre.trim(),
      modelo: modelo.trim() || null,
      horas_ultimo_mantenimiento: horasMantenimiento ? parseInt(horasMantenimiento) : null,
      activo: true,
    });
    setNombre("");
    setModelo("");
    setHorasMantenimiento("");
    cargarEquipos();
    onEquipoCreado();
    setLoading(false);
  };

  const toggleActivo = (id: number, activoActual: boolean) => {
    updateEquipo(id, { activo: !activoActual });
    cargarEquipos();
    onEquipoCreado();
  };

  const actualizarEquipo = (id: number) => {
    if (!editNombre.trim()) return alert("El nombre no puede estar vacío");
    updateEquipo(id, {
      nombre: editNombre.trim(),
      modelo: editModelo.trim() || null,
      horas_ultimo_mantenimiento: editHoras ? parseInt(editHoras) : null,
    });
    setEditandoId(null);
    cargarEquipos();
    onEquipoCreado();
  };

  const eliminarEquipo = (id: number) => {
    if (confirm("¿Eliminar permanentemente?")) {
      deleteEquipo(id);
      cargarEquipos();
      onEquipoCreado();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-500">Gestionar Equipos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <form onSubmit={agregarEquipo} className="mb-6 space-y-3">
          <input type="text" placeholder="Nombre del equipo *" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" required />
          <input type="text" placeholder="Modelo (opcional)" value={modelo} onChange={(e) => setModelo(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" />
          <input type="number" placeholder="Horas último mantenimiento" value={horasMantenimiento} onChange={(e) => setHorasMantenimiento(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" />
          <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 py-2 rounded-lg font-semibold">{loading ? "Agregando..." : "+ Agregar Equipo"}</button>
        </form>

        <h3 className="font-semibold mb-2">Equipos actuales</h3>
        <ul className="space-y-2">
          {equipos.map(eq => (
            <li key={eq.id} className="bg-gray-700 p-2 rounded">
              {editandoId === eq.id ? (
                <div className="space-y-2">
                  <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full bg-gray-600 p-1 rounded" />
                  <input type="text" value={editModelo} onChange={(e) => setEditModelo(e.target.value)} placeholder="Modelo" className="w-full bg-gray-600 p-1 rounded" />
                  <input type="number" value={editHoras} onChange={(e) => setEditHoras(e.target.value)} placeholder="Horas mantenimiento" className="w-full bg-gray-600 p-1 rounded" />
                  <div className="flex gap-2"><button onClick={() => actualizarEquipo(eq.id)} className="bg-green-600 px-2 py-1 rounded text-sm">Guardar</button><button onClick={() => setEditandoId(null)} className="bg-gray-500 px-2 py-1 rounded text-sm">Cancelar</button></div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{eq.nombre}</span> {eq.modelo && <span className="text-xs text-gray-300 ml-2">({eq.modelo})</span>} {eq.horas_ultimo_mantenimiento !== null && <span className="text-xs ml-2">- {eq.horas_ultimo_mantenimiento} h</span>}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${eq.activo ? 'bg-green-600' : 'bg-red-600'}`}>{eq.activo ? 'Activo' : 'Inactivo'}</span>
                    {!eq.sincronizado && <span className="ml-2 text-xs text-yellow-400">(pendiente)</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditandoId(eq.id); setEditNombre(eq.nombre); setEditModelo(eq.modelo || ""); setEditHoras(eq.horas_ultimo_mantenimiento?.toString() || ""); }} className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs" title="Editar">✏️</button>
                    <button onClick={() => toggleActivo(eq.id, eq.activo)} className={`px-2 py-1 rounded text-xs ${eq.activo ? 'bg-yellow-600' : 'bg-green-600'}`} title={eq.activo ? "Desactivar" : "Activar"}>{eq.activo ? '🔴 Desactivar' : '🟢 Activar'}</button>
                    <button onClick={() => eliminarEquipo(eq.id)} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs" title="Eliminar">🗑️</button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {equipos.length === 0 && <li className="text-gray-400">No hay equipos aún</li>}
        </ul>
      </div>
    </div>
  );
}
