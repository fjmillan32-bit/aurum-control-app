"use client";

import { useState, useEffect } from "react";
import { getOperarios, getEquipos, addCorrida } from "@/lib/localStorage";

interface NuevaCorridaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCorridaAdded: () => void;
}

export default function NuevaCorridaModal({ isOpen, onClose, onCorridaAdded }: NuevaCorridaModalProps) {
  const [operarios, setOperarios] = useState<{ id: number; nombre: string }[]>([]);
  const [equipos, setEquipos] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    operario_id: "",
    equipo_id: "",
    hora_inicio: new Date().toISOString().slice(0, 16),
    hora_fin: "",
    volumen_m3: "",
    tipo_material: "grava gruesa",
    oro_estimado_gramos: "",
    oro_gramos: "",
    mercurio_gramos: "",
  });

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
      setFormData({
        operario_id: "",
        equipo_id: "",
        hora_inicio: new Date().toISOString().slice(0, 16),
        hora_fin: "",
        volumen_m3: "",
        tipo_material: "grava gruesa",
        oro_estimado_gramos: "",
        oro_gramos: "",
        mercurio_gramos: "",
      });
    }
  }, [isOpen]);

  const cargarDatos = () => {
    setOperarios(getOperarios().filter((o: any) => o.activo));
    setEquipos(getEquipos().filter((e: any) => e.activo));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!formData.operario_id || !formData.equipo_id || !formData.volumen_m3 || !formData.oro_gramos) {
      alert("Completa los campos obligatorios (*)");
      setLoading(false);
      return;
    }

    const oroReal = parseFloat(formData.oro_gramos);
    const oroEstimado = parseFloat(formData.oro_estimado_gramos) || 0;
    let eficiencia = 0;
    if (oroEstimado > 0) {
      eficiencia = (oroReal / oroEstimado) * 100;
      if (eficiencia > 100) eficiencia = 100;
    }

    const nuevaCorrida = {
      operario_id: parseInt(formData.operario_id),
      equipo_id: parseInt(formData.equipo_id),
      hora_inicio: new Date(formData.hora_inicio).toISOString(),
      hora_fin: formData.hora_fin ? new Date(formData.hora_fin).toISOString() : null,
      volumen_m3: parseFloat(formData.volumen_m3),
      tipo_material: formData.tipo_material,
      oro_gramos: oroReal,
      mercurio_gramos: formData.mercurio_gramos ? parseFloat(formData.mercurio_gramos) : null,
      eficiencia: Math.round(eficiencia),
      foto_concentrado_url: null,
    };

    addCorrida(nuevaCorrida);
    alert("Corrida guardada localmente.");
    // Forzar actualización del dashboard
    onCorridaAdded();
    onClose();
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-500">Nueva Corrida</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Operario *</label>
            <select name="operario_id" value={formData.operario_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" required>
              <option value="">Selecciona</option>
              {operarios.map(op => <option key={op.id} value={op.id}>{op.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Equipo *</label>
            <select name="equipo_id" value={formData.equipo_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" required>
              <option value="">Selecciona</option>
              {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hora inicio *</label>
            <input type="datetime-local" name="hora_inicio" value={formData.hora_inicio} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hora fin</label>
            <input type="datetime-local" name="hora_fin" value={formData.hora_fin} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Volumen procesado (m³) *</label>
            <input type="number" step="0.1" name="volumen_m3" value={formData.volumen_m3} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de material</label>
            <select name="tipo_material" value={formData.tipo_material} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2">
              <option value="grava gruesa">Grava gruesa</option>
              <option value="grava fina">Grava fina</option>
              <option value="arcilloso">Arcilloso</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Oro estimado (g) (opcional)</label>
            <input type="number" step="0.01" name="oro_estimado_gramos" value={formData.oro_estimado_gramos} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Oro recuperado (g) *</label>
            <input type="number" step="0.01" name="oro_gramos" value={formData.oro_gramos} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mercurio usado (g)</label>
            <input type="number" step="0.1" name="mercurio_gramos" value={formData.mercurio_gramos} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 py-2 rounded-lg font-semibold">
            {loading ? "Guardando..." : "Registrar Corrida"}
          </button>
        </form>
      </div>
    </div>
  );
}
