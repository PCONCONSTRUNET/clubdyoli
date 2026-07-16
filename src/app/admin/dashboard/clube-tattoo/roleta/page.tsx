"use client";

import { useEffect, useState } from "react";
import { Sparkles, Edit, Plus, Trash2, ArrowLeft, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../../../lib/supabase";

export default function AdminRoletaPage() {
  const [premios, setPremios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: '', tipo: 'Desconto', peso: 1, ativo: true });
  
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, targetId: string | null}>({ isOpen: false, targetId: null });

  useEffect(() => {
    fetchPremios();
  }, []);

  const fetchPremios = async () => {
    setLoading(true);
    const { data } = await supabase.from('premios_roleta').select('*').order('peso', { ascending: false });
    if (data) setPremios(data);
    setLoading(false);
  };

  const handleOpenNew = () => {
    setEditId(null);
    setFormData({ nome: '', tipo: 'Desconto', peso: 1, ativo: true });
    setIsModalOpen(true);
  };

  const handleEdit = (p: any) => {
    setEditId(p.id);
    setFormData({ nome: p.nome, tipo: p.tipo || 'Desconto', peso: p.peso, ativo: p.ativo });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome) return alert("Preencha o nome do prêmio");

    if (editId) {
      await supabase.from('premios_roleta').update(formData).eq('id', editId);
    } else {
      await supabase.from('premios_roleta').insert([formData]);
    }
    
    setIsModalOpen(false);
    fetchPremios();
  };

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, targetId: id });
  };

  const confirmDelete = async () => {
    if (confirmModal.targetId) {
      await supabase.from('premios_roleta').delete().eq('id', confirmModal.targetId);
      setConfirmModal({ isOpen: false, targetId: null });
      fetchPremios();
    }
  };

  return (
    <div className="p-6 pb-20 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#ff1493] transition-colors mb-6 font-bold text-sm">
        <ArrowLeft size={16} /> Voltar ao Dashboard
      </Link>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Sparkles className="text-[#ff1493]" size={32} />
            Gerenciar Roleta
          </h1>
          <p className="text-gray-500 font-medium mt-1">Configure prêmios e probabilidades do Giro da Sorte.</p>
        </div>
        <button onClick={handleOpenNew} className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-colors">
          <Plus size={18} /> Novo Prêmio
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500">Prêmio / Tipo</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500">Peso (Probabilidade)</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500">Status</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Carregando prêmios...</td></tr>
              ) : premios.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum prêmio cadastrado.</td></tr>
              ) : (
                premios.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{p.nome}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{p.tipo}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-bold border border-gray-200">
                        {p.peso}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-md uppercase ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors inline-block" title="Editar">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors inline-block" title="Excluir">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CRIAR/EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md my-auto flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900">{editId ? 'Editar Prêmio' : 'Novo Prêmio'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Prêmio (Ex: 10% OFF)</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tipo</label>
                <select 
                  value={formData.tipo}
                  onChange={e => setFormData({...formData, tipo: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                >
                  <option value="Desconto">Desconto</option>
                  <option value="Brinde">Brinde</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Peso (Probabilidade)</label>
                <input 
                  type="number" 
                  value={formData.peso}
                  onChange={e => setFormData({...formData, peso: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                />
                <p className="text-[10px] text-gray-400 mt-1">Valores maiores saem com mais frequência.</p>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="ativo"
                  checked={formData.ativo}
                  onChange={e => setFormData({...formData, ativo: e.target.checked})}
                  className="w-4 h-4 text-[#ff1493] rounded"
                />
                <label htmlFor="ativo" className="text-sm font-bold text-gray-700">Ativo na Roleta</label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end bg-gray-50/50 rounded-b-[32px]">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-[#ff1493] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
              >
                <CheckCircle2 size={18} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm my-auto flex flex-col p-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Excluir Prêmio?</h2>
            <p className="text-gray-500 text-sm mb-6">Esta ação não pode ser desfeita e ele não aparecerá mais na roleta.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({isOpen: false, targetId: null})} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl shadow-md shadow-red-500/20 hover:bg-red-600 transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
