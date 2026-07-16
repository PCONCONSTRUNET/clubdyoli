"use client";

import { useEffect, useState } from "react";
import { Award, Edit, Plus, Trash2, ArrowLeft, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../../../lib/supabase";

export default function AdminFidelidadePage() {
  const [beneficios, setBeneficios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ meses: 1, titulo: '', descricao: '' });
  
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, targetId: string | null}>({ isOpen: false, targetId: null });

  useEffect(() => {
    fetchBeneficios();
  }, []);

  const fetchBeneficios = async () => {
    setLoading(true);
    const { data } = await supabase.from('fidelidade_beneficios').select('*').order('meses', { ascending: true });
    if (data) setBeneficios(data);
    setLoading(false);
  };

  const handleOpenNew = () => {
    setEditId(null);
    setFormData({ meses: 1, titulo: '', descricao: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (b: any) => {
    setEditId(b.id);
    setFormData({ meses: b.meses, titulo: b.titulo, descricao: b.descricao });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.titulo) return alert("Preencha o título do benefício");

    if (editId) {
      await supabase.from('fidelidade_beneficios').update(formData).eq('id', editId);
    } else {
      await supabase.from('fidelidade_beneficios').insert([formData]);
    }
    
    setIsModalOpen(false);
    fetchBeneficios();
  };

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, targetId: id });
  };

  const confirmDelete = async () => {
    if (confirmModal.targetId) {
      await supabase.from('fidelidade_beneficios').delete().eq('id', confirmModal.targetId);
      setConfirmModal({ isOpen: false, targetId: null });
      fetchBeneficios();
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
            <Award className="text-[#ff1493]" size={32} />
            Gestão de Fidelidade
          </h1>
          <p className="text-gray-500 font-medium mt-1">Configure os benefícios desbloqueados por tempo de assinatura.</p>
        </div>
        <button onClick={handleOpenNew} className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-colors">
          <Plus size={18} /> Novo Benefício
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500">Meses</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500">Título do Benefício</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500 hidden sm:table-cell">Descrição</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Carregando benefícios...</td></tr>
              ) : beneficios.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum benefício cadastrado.</td></tr>
              ) : (
                beneficios.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-lg text-sm font-bold border border-pink-200">
                        {b.meses}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-900">{b.titulo}</td>
                    <td className="p-4 text-sm text-gray-500 hidden sm:table-cell">{b.descricao}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button onClick={() => handleEdit(b)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors inline-block" title="Editar">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors inline-block" title="Excluir">
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
              <h2 className="text-xl font-black text-gray-900">{editId ? 'Editar Benefício' : 'Novo Benefício'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Meses Necessários</label>
                <input 
                  type="number" 
                  value={formData.meses}
                  onChange={e => setFormData({...formData, meses: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Título do Benefício</label>
                <input 
                  type="text" 
                  value={formData.titulo}
                  onChange={e => setFormData({...formData, titulo: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                  placeholder="Ex: Tatuagem Grátis (Até 10cm)"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Descrição</label>
                <textarea 
                  value={formData.descricao}
                  onChange={e => setFormData({...formData, descricao: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493] resize-none h-24"
                  placeholder="Descreva as regras ou detalhes..."
                />
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
            <h2 className="text-xl font-black text-gray-900 mb-2">Excluir Benefício?</h2>
            <p className="text-gray-500 text-sm mb-6">Esta ação não pode ser desfeita.</p>
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
