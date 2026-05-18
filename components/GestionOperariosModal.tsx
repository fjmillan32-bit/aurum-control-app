"use client";

import { useState, useEffect } from "react";
import { getOperarios, addOperario, updateOperario, deleteOperario } from "@/lib/localStorage";

interface GestionOperariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOperarioCreado: () => void;
}

export default function GestionOperariosModal({ isOpen, onClose, onOperarioCreado }: GestionOperariosModalProps) {
  const [operarios, setOperarios] = useState<any[]>([]);
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDocumento, setEditDocumento] = useState("");

  const cargarOperarios = () => setOperarios(getOperarios());

  useEffect(() => {
    if (isOpen) cargarOperarios();
  }, [isOpen]);

  const agregarOperario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return alert("El nombre es obligatorio");
    setLoading(true);
    addOperario({ nombre: nombre.trim(), documento: documento.trim() || null, activo: true });
    setNombre("");
    setDocumento("");
    cargarOperarios();
    onOperarioCreado();
    setLoading(false);
  };

  const toggleActivo = (id: number, activoActual: boolean) => {
    updateOperario(id, { activo: !activoActual });
    cargarOperarios();
    onOperarioCreado();
  };

  const actualizarOperario = (id: number) => {
    if (!editNombre.trim()) return alert("El nombre no puede estar vacío");
    updateOperario(id, { nombre: editNombre.trim(), documento: editDocumento.trim() || null });
    setEditandoId(null);
    cargarOperarios();
    onOperarioCreado();
  };

  const eliminarOperario = (id: number) => {
    if (confirm("¿Eliminar permanentemente?")) {
      deleteOperario(id);
      cargarOperarios();
      onOperarioCreado();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-500">Gestionar Operarios</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <form onSubmit={agregarOperario} className="mb-6 space-y-3">
          <input
            type="text"
            placeholder="Nombre completo *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2"
            required
          />
          <input
            type="text"
            placeholder="Documento (opcional)"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 py-2 rounded-lg font-semibold"
          >
            {loading ? "Agregando..." : "+ Agregar Operario"}
          </button>
        </form>

        <h3 className="font-semibold mb-2">Operarios actuales</h3>
        <ul className="space-y-2">
          {operarios.map(op => (
            <li key={op.id} className="bg-gray-700 p-2 rounded">
              {editandoId === op.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full bg-gray-600 p-1 rounded"
                  />
                  <input
                    type="text"
                    value={editDocumento}
                    onChange={(e) => setEditDocumento(e.target.value)}
                    placeholder="Documento"
                    className="w-full bg-gray-600 p-1 rounded"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => actualizarOperario(op.id)} className="bg-green-600 px-2 py-1 rounded text-sm">Guardar</button>
                    <button onClick={() => setEditandoId(null)} className="bg-gray-500 px-2 py-1 rounded text-sm">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{op.nombre}</span>
                    {op.documento && <span className="text-xs text-gray-300 ml-2">({op.documento})</span>}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${op.activo ? 'bg-green-600' : 'bg-red-600'}`}>
                      {op.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    {!op.sincronizado && <span className="ml-2 text-xs text-yellow-400">(pendiente)</span>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditandoId(op.id);
                        setEditNombre(op.nombre);
                        setEditDocumento(op.documento || "");
                      }}
                      className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => toggleActivo(op.id, op.activo)}
                      className={`px-2 py-1 rounded text-xs ${op.activo ? 'bg-yellow-600' : 'bg-green-600'}`}
                      title={op.activo ? "Desactivar" : "Activar"}
                    >
                      {op.activo ? '🔴 Desactivar' : '🟢 Activar'}
                    </button>
                    <button
                      onClick={() => eliminarOperario(op.id)}
                      className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {operarios.length === 0 && <li className="text-gray-400">No hay operarios aún</li>}
        </ul>
      </div>
    </div>
  );
}
