
import React, { useState, useEffect } from 'react';
import { X, DollarSign, MapPin, Music, FileText, Loader2 } from 'lucide-react';
import { Gig, GigStatus } from '../types';

interface GigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (gig: any) => void;
  initialData?: Partial<Gig> | null;
  isLoading?: boolean;
}

const GigModal: React.FC<GigModalProps> = ({ isOpen, onClose, onSubmit, initialData, isLoading = false }) => {
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
      <div className="bg-[#24272D] border border-[#31333B] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[#31333B] flex justify-between items-center bg-[#24272D]">
          <h2 className="text-xl font-bold text-white">{initialData ? 'Editar Compromisso' : 'Novo Show / Evento'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#1E1F25] rounded-full text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form id="gig-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-white uppercase flex items-center gap-1">
              <Music size={12} /> Título do Evento
            </label>
            <input 
              required
              type="text" 
              placeholder="Ex: Show no SESC, Casamento João & Maria..."
              className="w-full bg-[#1E1F25] border border-[#31333B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3057F2] transition-colors"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 min-w-0">
              <label className="text-xs font-bold text-white uppercase">
                Data
              </label>
              <input 
                required
                type="date" 
                className="w-full bg-[#1E1F25] border border-[#31333B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3057F2] transition-colors text-sm min-w-0"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                style={{
                  colorScheme: 'dark',
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
              />
            </div>
            <div className="space-y-1 min-w-0">
              <label className="text-xs font-bold text-white uppercase flex items-center gap-1">
                <DollarSign size={12} /> Valor (R$)
              </label>
              <input 
                type="number" 
                step="0.01"
                placeholder="Opcional"
                className="w-full bg-[#1E1F25] border border-[#31333B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3057F2] transition-colors text-sm min-w-0 truncate"
                value={formData.value}
                onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 min-w-0">
              <label className="text-xs font-bold text-white uppercase flex items-center gap-1">
                <Music size={12} /> Banda / Projeto
              </label>
              <input 
                type="text" 
                placeholder="Nome da banda"
                className="w-full bg-[#1E1F25] border border-[#31333B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3057F2] transition-colors text-sm min-w-0 truncate"
                value={formData.band_name}
                onChange={e => setFormData(prev => ({ ...prev, band_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1 min-w-0">
              <label className="text-xs font-bold text-white uppercase flex items-center gap-1">
                <MapPin size={12} /> Local
              </label>
              <input 
                type="text" 
                placeholder="Onde será?"
                className="w-full bg-[#1E1F25] border border-[#31333B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3057F2] transition-colors text-sm min-w-0 truncate"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-white uppercase flex items-center gap-1">
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
            <label className="text-xs font-bold text-white uppercase flex items-center gap-1">
              Status Inicial do Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#1E1F25] border border-[#31333B] rounded-xl">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: GigStatus.PENDING }))}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${formData.status === GigStatus.PENDING ? 'bg-amber-500/20 text-amber-500 shadow-sm' : 'text-white hover:text-white'}`}
              >
                Pendente
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: GigStatus.PAID }))}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${formData.status === GigStatus.PAID ? 'bg-emerald-500/20 text-emerald-500 shadow-sm' : 'text-white hover:text-white'}`}
              >
                Pago
              </button>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-[#31333B] bg-[#24272D] flex gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-[#31333B] text-white font-semibold hover:bg-[#1E1F25] transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="gig-form"
            disabled={isLoading}
            className="flex-[2] px-4 py-3 rounded-xl bg-[#3057F2] text-white font-bold hover:bg-[#2545D9] shadow-lg shadow-[#3057F2]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              initialData ? 'Salvar Alterações' : 'Confirmar Evento'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GigModal;
