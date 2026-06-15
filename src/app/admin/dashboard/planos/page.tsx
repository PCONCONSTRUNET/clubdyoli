"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Tag, ChevronDown, CheckCircle2, Save, X } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import { FeedbackModal, translateError } from "../../../../components/FeedbackModal";

export default function AdminPlanosPage() {
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [expandirOpcoes, setExpandirOpcoes] = useState(false);
  const [loading, setLoading] = useState(true);

  const [planoAtual, setPlanoAtual] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);

  // Feedback State
  const [feedback, setFeedback] = useState<{isOpen: boolean, type: "error"|"success", title: string, message: string}>({
    isOpen: false, type: "success", title: "", message: ""
  });

  const formatBRL = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const loadPlano = async () => {
    setLoading(true);
    // Para simplificar a demonstração, puxaremos o primeiro plano "Club de Crédito"
    const { data: planoData } = await supabase.from('planos').select('*').limit(1).single();
    if (planoData) {
      const { data: opcoesData } = await supabase.from('plano_opcoes').select('*').eq('plano_id', planoData.id).order('valor', { ascending: true });
      const planoMontado = {
        id: planoData.id,
        nome: planoData.nome,
        descricao: planoData.descricao,
        status: planoData.status,
        opcoes: opcoesData || []
      };
      setPlanoAtual(planoMontado);
      setEditForm(planoMontado);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPlano();
  }, []);

  const handleSave = async () => {
    if (!editForm) return;
    
    // Atualizar Plano Principal
    const { error: planoError } = await supabase.from('planos').update({
      nome: editForm.nome,
      descricao: editForm.descricao,
      status: editForm.status
    }).eq('id', editForm.id);

    if (planoError) {
      setFeedback({ isOpen: true, type: 'error', title: 'Erro', message: translateError(planoError.message) });
      return;
    }

    // Para atualizar opções, removemos as antigas e inserimos as novas
    // (Em um ambiente de produção pesado, faríamos upsert, mas como são poucas e para simplificar:)
    const { error: deleteError } = await supabase.from('plano_opcoes').delete().eq('plano_id', editForm.id);
    if (deleteError) {
      setFeedback({ isOpen: true, type: 'error', title: 'Erro', message: translateError(deleteError.message) });
      return;
    }
    
    const novasOpcoes = editForm.opcoes.map((op: any) => ({
      plano_id: editForm.id,
      valor: op.valor,
      desconto: op.desconto,
      prioridade: op.prioridade,
      cupom_porcentagem: op.cupom_porcentagem || 0,
      cupom_validade_dias: op.cupom_validade_dias || 30
    }));

    if (novasOpcoes.length > 0) {
      const { error: insertError } = await supabase.from('plano_opcoes').insert(novasOpcoes);
      if (insertError) {
        setFeedback({ isOpen: true, type: 'error', title: 'Erro', message: translateError(insertError.message) });
        return;
      }
    }

    setFeedback({ isOpen: true, type: 'success', title: 'Sucesso', message: 'Plano atualizado com sucesso!' });
    await loadPlano();
    setModalEditOpen(false);
  };

  const updateOpcao = (id: any, key: string, value: any) => {
    setEditForm({
      ...editForm,
      opcoes: editForm.opcoes.map((op: any) => op.id === id ? { ...op, [key]: value } : op)
    });
  };

  const removeOpcao = (id: any) => {
    setEditForm({
      ...editForm,
      opcoes: editForm.opcoes.filter((op: any) => op.id !== id)
    });
  };

  const addNewOpcao = () => {
    setEditForm({
      ...editForm,
      opcoes: [...editForm.opcoes, { id: 'temp-' + Date.now(), valor: 0, desconto: "0%", prioridade: false, cupom_porcentagem: 0, cupom_validade_dias: 30 }]
    });
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Carregando plano atual...</div>;
  if (!planoAtual) return <div className="p-8 text-center text-gray-500 font-bold">Nenhum plano encontrado.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <FeedbackModal 
        isOpen={feedback.isOpen} 
        type={feedback.type} 
        title={feedback.title} 
        message={feedback.message} 
        onClose={() => setFeedback(f => ({...f, isOpen: false}))} 
      />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            Gestão de Planos
          </h1>
          <p className="text-gray-500 font-medium mt-1">Crie, edite ou remova os planos de assinatura do sistema.</p>
        </div>
        
        <button className="flex items-center gap-2 bg-[#ff1493] hover:bg-[#e91e63] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-[0_8px_20px_-6px_rgba(255,20,147,0.5)] transition-all">
          <Plus size={18} />
          Criar Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Card do Plano */}
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col relative overflow-hidden group transition-all hover:shadow-[0_15px_40px_rgba(255,20,147,0.1)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff1493]/5 rounded-bl-full pointer-events-none"></div>
          
          <div className="p-8 flex-1">
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#ff1493]/10 text-[#ff1493] rounded-2xl flex items-center justify-center shadow-sm">
                  <Tag size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{planoAtual.nome}</h2>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 mt-1 inline-block">
                    {planoAtual.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setEditForm(planoAtual); setModalEditOpen(true); }}
                  className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-900 rounded-xl transition-colors shadow-sm bg-gray-50"
                  title="Editar Plano"
                >
                  <Edit3 size={18} />
                </button>
                <button className="p-2.5 text-gray-400 hover:text-white hover:bg-red-500 rounded-xl transition-colors shadow-sm bg-gray-50" title="Excluir Plano">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <p className="text-gray-500 font-medium mb-6 relative z-10">
              {planoAtual.descricao}
            </p>

            <div className="border border-gray-100 rounded-2xl overflow-hidden relative z-10">
              <button 
                onClick={() => setExpandirOpcoes(!expandirOpcoes)}
                className="w-full bg-gray-50/80 hover:bg-gray-100 p-4 flex items-center justify-between transition-colors text-gray-900 font-bold"
              >
                Opções de Valor ({planoAtual.opcoes.length})
                <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${expandirOpcoes ? 'rotate-180' : ''}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out ${expandirOpcoes ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-white`}>
                <ul className="divide-y divide-gray-50">
                  {planoAtual.opcoes.map((opcao: any) => (
                    <li key={opcao.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div>
                        <p className="font-black text-lg text-gray-900">{formatBRL(opcao.valor)}</p>
                        <p className="text-xs text-[#ff1493] font-bold">{opcao.desconto} OFF nos estúdios</p>
                      </div>
                      {opcao.prioridade && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                          <CheckCircle2 size={14} /> Prioridade
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lateral / Overlayer de Edição */}
      {modalEditOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setModalEditOpen(false)}></div>
          
          <div className="w-full max-w-xl bg-white h-full shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-right-8 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900">Editar Plano</h2>
              <button onClick={() => setModalEditOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-lg shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome do Plano</label>
                  <input 
                    type="text" 
                    value={editForm.nome}
                    onChange={(e) => setEditForm({...editForm, nome: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Descrição Curta</label>
                  <textarea 
                    value={editForm.descricao}
                    onChange={(e) => setEditForm({...editForm, descricao: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493]"
                    rows={2}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Opções de Valores</label>
                  <button onClick={addNewOpcao} className="text-xs font-bold text-[#ff1493] hover:text-[#e91e63] flex items-center gap-1">
                    <Plus size={14} /> Adicionar Opção
                  </button>
                </div>
                
                <div className="space-y-3">
                  {editForm.opcoes.map((opcao: any, index: number) => (
                    <div key={opcao.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 relative group">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Valor (R$)</label>
                          <input 
                            type="number" 
                            value={opcao.valor}
                            onChange={(e) => updateOpcao(opcao.id, 'valor', Number(e.target.value))}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-[#ff1493]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Desconto Visual (%)</label>
                          <input 
                            type="text" 
                            value={opcao.desconto}
                            onChange={(e) => updateOpcao(opcao.id, 'desconto', e.target.value)}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-[#ff1493]"
                            placeholder="Ex: 5%"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Cupom Gerado (%)</label>
                          <input 
                            type="number" 
                            value={opcao.cupom_porcentagem}
                            onChange={(e) => updateOpcao(opcao.id, 'cupom_porcentagem', Number(e.target.value))}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-[#ff1493] text-emerald-600"
                            placeholder="Ex: 5"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Validade (Dias)</label>
                          <input 
                            type="number" 
                            value={opcao.cupom_validade_dias}
                            onChange={(e) => updateOpcao(opcao.id, 'cupom_validade_dias', Number(e.target.value))}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-[#ff1493]"
                            placeholder="Ex: 30"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={opcao.prioridade}
                            onChange={(e) => updateOpcao(opcao.id, 'prioridade', e.target.checked)}
                            className="accent-[#ff1493] w-4 h-4"
                          />
                          Prioridade VIP na Agenda
                        </label>
                        <button onClick={() => removeOpcao(opcao.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white">
              <button 
                onClick={handleSave}
                className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Save size={18} />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
