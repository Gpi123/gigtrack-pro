
import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, MapPin, Music, FileText } from 'lucide-react';
import { Gig, GigStatus } from '../types';

interface GigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (gig: any) => void;
  initialData?: Partial<Gig> | null;
}

const GigModal: React.FC<GigModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    value: '',
    location: '',
    band_name: '',
    notes: '',
    status: GigStatus.PENDING
  });

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        value: '',
        location: '',
        band_name: '',
        notes: '',
        status: GigStatus.PENDING
      });
    } else if (initialData) {
      // Set form data when modal opens with initial data
      setFormData({
        title: initialData.title || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
        value: initialData.value !== undefined && initialData.value !== 0 ? initialData.value.toString() : '',
        location: initialData.location || '',
        band_name: initialData.band_name || '',
        notes: initialData.notes || '',
        status: initialData.status || GigStatus.PENDING
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submission = {
      ...formData,
      value: formData.value === '' ? 0 : parseFloat(formData.value) || 0,
      id: initialData?.id
    };
    onSubmit(submission);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-white">{initialData ? 'Editar Compromisso' : 'Novo Show / Evento'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <Music size={12} /> Título do Evento
            </label>
            <input 
              required
              type="text" 
              placeholder="Ex: Show no SESC, Casamento João & Maria..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-slate-600 transition-colors"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Calendar size={12} /> Data
              </label>
              <input 
                required
                type="date" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-slate-600 transition-colors"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <DollarSign size={12} /> Valor (R$)
              </label>
              <input 
                type="number" 
                step="0.01"
                placeholder="Opcional (A definir)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-slate-600 transition-colors"
                value={formData.value}
                onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Music size={12} /> Banda / Projeto
              </label>
              <input 
                type="text" 
                placeholder="Nome da banda"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-slate-600 transition-colors"
                value={formData.band_name}
                onChange={e => setFormData(prev => ({ ...prev, band_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <MapPin size={12} /> Local
              </label>
              <input 
                type="text" 
                placeholder="Onde será?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-slate-600 transition-colors"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <FileText size={12} /> Notas Adicionais
            </label>
            <textarea 
              rows={3}
              placeholder="Observações, lista de repertório, horário de chegada..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none text-sm"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="space-y-1 pb-4">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              Status Inicial do Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: GigStatus.PENDING }))}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${formData.status === GigStatus.PENDING ? 'bg-amber-500/20 text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Pendente
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: GigStatus.PAID }))}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${formData.status === GigStatus.PAID ? 'bg-emerald-500/20 text-emerald-500 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Pago
              </button>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-800 bg-slate-900 flex gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-[2] px-4 py-3 rounded-xl bg-slate-700 text-white font-bold hover:bg-slate-600 shadow-lg shadow-slate-700/20 transition-all active:scale-95"
          >
            {initialData ? 'Salvar Alterações' : 'Confirmar Evento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GigModal;
