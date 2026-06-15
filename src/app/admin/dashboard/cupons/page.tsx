"use client";

import { useState, useEffect } from "react";
import { Plus, Tag, Trash2, X, CheckCircle2, Send, PauseCircle, PlayCircle, Globe, Lock, Edit3 } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import { FeedbackModal, translateError } from "../../../../components/FeedbackModal";
import { ConfirmModal } from "../../../../components/ConfirmModal";

export default function AdminCuponsPage() {
  const [cupons, setCupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  
  // State for Create/Edit Cupom
  const [editId, setEditId] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState("Desconto"); // 'Desconto' ou 'Premio'
  const [porcentagem, setPorcentagem] = useState<number | "">("");
  const [valorPremio, setValorPremio] = useState("");
  const [validade, setValidade] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);
  const [planoId, setPlanoId] = useState("");
  const [status, setStatus] = useState("Ativo");

  // State for Send Cupom
  const [clientes, setClientes] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [selectedCupom, setSelectedCupom] = useState("");
  const [selectedCliente, setSelectedCliente] = useState("");

  // Feedback State
  const [feedback, setFeedback] = useState<{isOpen: boolean, type: "error"|"success", title: string, message: string}>({
    isOpen: false, type: "success", title: "", message: ""
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean,
    actionType: "delete" | null,
    targetId: string | null
  }>({ isOpen: false, actionType: null, targetId: null });

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, actionType: null, targetId: null });
  };

  useEffect(() => {
    fetchCupons();
    fetchClientes();
  }, []);

  const fetchCupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cupons")
      .select("*, planos(nome)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCupons(data);
    }
    setLoading(false);
  };

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, email")
      .order("nome", { ascending: true });
      
    if (!error && data) {
      setClientes(data);
    }

    const { data: pData } = await supabase.from('planos').select('id, nome').eq('status', 'Ativo');
    if (pData) setPlanos(pData);
  };

  const handleOpenModal = () => {
    setEditId(null);
    setCodigo("");
    setTipo("Desconto");
    setPorcentagem("");
    setValorPremio("");
    setValidade("");
    setIsGlobal(false);
    setPlanoId("");
    setStatus("Ativo");
    setModalOpen(true);
  };

  const handleEditCupom = (cupom: any) => {
    setEditId(cupom.id);
    setCodigo(cupom.codigo);
    setTipo(cupom.tipo);
    setPorcentagem(cupom.porcentagem_desconto || "");
    setValorPremio(cupom.valor_premio || "");
    setIsGlobal(cupom.is_global || false);
    setPlanoId(cupom.plano_id || "");
    setStatus(cupom.status);
    
    if (cupom.validade) {
      const d = new Date(cupom.validade);
      setValidade(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    } else {
      setValidade("");
    }
    
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!codigo) {
      setFeedback({ isOpen: true, type: 'error', title: 'Atenção', message: 'Informe o código do cupom.' });
      return;
    }
    if (!validade) {
      setFeedback({ isOpen: true, type: 'error', title: 'Atenção', message: 'A data de validade é obrigatória.' });
      return;
    }

    const payload: any = {
      codigo,
      tipo,
      validade: new Date(validade).toISOString(),
      is_global: isGlobal,
      plano_id: isGlobal && planoId ? planoId : null,
      status
    };

    if (tipo === "Desconto") {
      payload.porcentagem_desconto = porcentagem || 0;
      payload.valor_premio = null;
    } else {
      payload.porcentagem_desconto = null;
      payload.valor_premio = valorPremio;
    }

    let error;
    if (editId) {
      const { error: updateError } = await supabase.from('cupons').update(payload).eq('id', editId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('cupons').insert([payload]);
      error = insertError;
    }
    
    if (error) {
      setFeedback({ isOpen: true, type: 'error', title: 'Erro', message: translateError(error.message) });
      return;
    }

    setFeedback({ isOpen: true, type: 'success', title: 'Sucesso', message: editId ? 'Cupom atualizado!' : 'Cupom criado com sucesso!' });
    setModalOpen(false);
    fetchCupons();
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      actionType: "delete",
      targetId: id
    });
  };

  const executeDelete = async () => {
    const { targetId } = confirmModal;
    if (targetId) {
      await supabase.from('cupons').delete().eq('id', targetId);
      fetchCupons();
    }
    closeConfirmModal();
  };

  const handleToggleStatus = async (cupom: any) => {
    const newStatus = cupom.status === 'Ativo' ? 'Inativo' : 'Ativo';
    const { error } = await supabase.from('cupons').update({ status: newStatus }).eq('id', cupom.id);
    if (error) {
      setFeedback({ isOpen: true, type: 'error', title: 'Erro', message: translateError(error.message) });
    } else {
      fetchCupons();
    }
  };

  const handleSendCupom = async () => {
    if (!selectedCupom || !selectedCliente) {
      setFeedback({ isOpen: true, type: 'error', title: 'Atenção', message: 'Selecione um cupom e um cliente.' });
      return;
    }

    const { error } = await supabase.from('user_cupons').insert([{
      user_id: selectedCliente,
      cupom_id: selectedCupom
    }]);

    if (error) {
      setFeedback({ isOpen: true, type: 'error', title: 'Erro ao enviar', message: translateError(error.message) });
      return;
    }

    setFeedback({ isOpen: true, type: 'success', title: 'Sucesso', message: 'Cupom enviado com sucesso para a carteira do cliente!' });
    setSendModalOpen(false);
    setSelectedCupom("");
    setSelectedCliente("");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <FeedbackModal 
        isOpen={feedback.isOpen} 
        type={feedback.type} 
        title={feedback.title} 
        message={feedback.message} 
        onClose={() => setFeedback(f => ({...f, isOpen: false}))} 
      />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Excluir Cupom"
        message="Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita e clientes que possuam esse cupom salvo em suas carteiras irão perdê-lo."
        type="danger"
        confirmText="Sim, Excluir"
        onConfirm={executeDelete}
        onCancel={closeConfirmModal}
      />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestão de Cupons</h1>
          <p className="text-gray-500 font-medium mt-1">Crie e gerencie descontos e prêmios oferecidos.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setSendModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-all"
          >
            <Send size={18} className="text-[#ff1493]" />
            Enviar Cupom
          </button>
          
          <button 
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 bg-[#ff1493] hover:bg-[#e91e63] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-[0_8px_20px_-6px_rgba(255,20,147,0.5)] transition-all"
          >
            <Plus size={18} />
            Novo Cupom
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-10 text-center text-gray-500 font-bold">Carregando cupons...</div>
        ) : cupons.length === 0 ? (
          <div className="col-span-full py-10 text-center bg-white rounded-[24px] border border-gray-100 shadow-sm text-gray-500 font-medium">
            Nenhum cupom encontrado.
          </div>
        ) : (
          cupons.map((cupom) => {
            const isExpired = cupom.validade ? new Date(cupom.validade) < new Date() : false;
            
            return (
              <div key={cupom.id} className={`bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border ${cupom.status === 'Ativo' && !isExpired ? 'border-[#ff1493]/20' : 'border-gray-200 opacity-80'} flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${cupom.status === 'Ativo' && !isExpired ? 'bg-[#ff1493]/10 text-[#ff1493]' : 'bg-gray-100 text-gray-400'}`}>
                      <Tag size={24} />
                    </div>
                    <div>
                      <h3 className={`font-black text-lg ${cupom.status === 'Ativo' && !isExpired ? 'text-gray-900' : 'text-gray-500'}`}>{cupom.codigo}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cupom.status === 'Ativo' && !isExpired ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                          {isExpired ? 'Expirado' : cupom.status}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                          {cupom.tipo}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${cupom.is_global ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                          {cupom.is_global ? <Globe size={10} /> : <Lock size={10} />}
                          {cupom.is_global ? (cupom.plano_id ? `Clube: ${cupom.planos?.nome}` : 'Global') : 'Exclusivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 relative z-10 flex-col sm:flex-row">
                    <button 
                      onClick={() => handleEditCupom(cupom)} 
                      className="p-2 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 rounded-lg" 
                      title="Editar"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(cupom)} 
                      className={`p-2 rounded-lg transition-colors ${cupom.status === 'Ativo' ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'}`}
                      title={cupom.status === 'Ativo' ? 'Pausar Cupom' : 'Retomar Cupom'}
                    >
                      {cupom.status === 'Ativo' ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                    </button>
                    <button onClick={() => handleDelete(cupom.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-lg" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">{cupom.tipo === 'Premio' ? 'Prêmio' : 'Desconto'}</span>
                    <span className="font-bold text-gray-900 text-right max-w-[150px] truncate">
                      {cupom.tipo === 'Premio' ? cupom.valor_premio : `${cupom.porcentagem_desconto}%`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Expira em</span>
                    <span className={`font-bold ${isExpired ? 'text-red-500' : 'text-gray-700'}`}>
                      {cupom.validade ? new Date(cupom.validade).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sem data'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Usos Totais</span>
                    <span className="font-bold text-gray-700">{cupom.total_usos || 0} vezes</span>
                  </div>
                </div>

                {cupom.status === 'Ativo' && !isExpired && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#ff1493]/5 to-transparent rounded-bl-full pointer-events-none"></div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal - Novo Cupom */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md my-auto flex flex-col animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-black text-gray-900">{editId ? "Editar Cupom" : "Novo Cupom"}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Código do Cupom *</label>
                <input 
                  type="text" 
                  value={codigo}
                  onChange={e => setCodigo(e.target.value.toUpperCase())}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-bold uppercase focus:outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493] transition-colors"
                  placeholder="Ex: VIP20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Público-Alvo *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setIsGlobal(true)}
                    className={`py-2 px-2 rounded-lg font-bold text-[11px] sm:text-xs border transition-colors flex flex-col items-center gap-1 ${isGlobal ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Globe size={16} /> Disponível P/ Todos
                  </button>
                  <button 
                    onClick={() => setIsGlobal(false)}
                    className={`py-2 px-2 rounded-lg font-bold text-[11px] sm:text-xs border transition-colors flex flex-col items-center gap-1 ${!isGlobal ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Lock size={16} /> Exclusivo (Envio)
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {isGlobal ? "Aparecerá automaticamente na carteira de todos os assinantes." : "Ficará escondido até você enviá-lo pelo botão 'Enviar Cupom'."}
                </p>
              </div>

              {isGlobal && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Restringir por Clube/Plano? (Opcional)</label>
                  <select 
                    value={planoId}
                    onChange={e => setPlanoId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                  >
                    <option value="">-- Todos os Clubes / Assinantes --</option>
                    {planos.map(p => <option key={p.id} value={p.id}>Somente membros do {p.nome}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Benefício *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setTipo('Desconto')}
                    className={`py-2 rounded-lg font-bold text-sm border transition-colors ${tipo === 'Desconto' ? 'bg-[#ff1493]/10 border-[#ff1493] text-[#ff1493]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    Desconto (%)
                  </button>
                  <button 
                    onClick={() => setTipo('Premio')}
                    className={`py-2 rounded-lg font-bold text-sm border transition-colors ${tipo === 'Premio' ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    Prêmio / Brinde
                  </button>
                </div>
              </div>

              {tipo === 'Desconto' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Porcentagem (%)</label>
                  <input 
                    type="number" 
                    value={porcentagem}
                    onChange={e => setPorcentagem(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-bold focus:outline-none focus:border-[#ff1493]"
                    placeholder="Ex: 10"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Descrição do Prêmio</label>
                  <input 
                    type="text" 
                    value={valorPremio}
                    onChange={e => setValorPremio(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-bold focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: Sessão Grátis"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Validade Real *</label>
                <input 
                  type="datetime-local" 
                  value={validade}
                  onChange={e => setValidade(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status Inicial</label>
                <select 
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-bold focus:outline-none focus:border-[#ff1493]"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Pausado (Inativo)</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end bg-gray-50/50 rounded-b-[32px] sticky bottom-0">
              <button 
                onClick={() => setModalOpen(false)}
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

      {/* Modal - Enviar Cupom */}
      {sendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md my-auto flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-gray-900">Enviar Cupom Manual</h2>
                <p className="text-sm text-gray-500 mt-1">Envie um benefício exclusivo para um cliente.</p>
              </div>
              <button onClick={() => setSendModalOpen(false)} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Selecione o Cliente</label>
                <select 
                  value={selectedCliente}
                  onChange={e => setSelectedCliente(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                >
                  <option value="">-- Escolha um cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Selecione o Cupom (Exclusivo)</label>
                <select 
                  value={selectedCupom}
                  onChange={e => setSelectedCupom(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                >
                  <option value="">-- Escolha um cupom --</option>
                  {cupons.filter(c => c.status === 'Ativo' && !c.is_global).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} - {c.tipo === 'Premio' ? c.valor_premio : `${c.porcentagem_desconto}% OFF`}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Apenas cupons Ativos e marcados como Exclusivos aparecem aqui.</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end bg-gray-50/50 rounded-b-[32px]">
              <button 
                onClick={() => setSendModalOpen(false)}
                className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSendCupom}
                className="flex items-center gap-2 bg-[#ff1493] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
              >
                <Send size={18} /> Enviar Benefício
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
