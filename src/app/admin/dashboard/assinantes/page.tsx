"use client";

import { useEffect, useState } from "react";
import { UserCheck, Search, Star, Calendar, CreditCard, Plus, UserPlus, X, CheckCircle2, Settings2, Trash2 } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { FeedbackModal, translateError } from "../../../../components/FeedbackModal";
import { ConfirmModal } from "../../../../components/ConfirmModal";

// Criar um cliente Supabase secundário que não persiste sessão para podermos cadastrar usuários sem deslogar o admin
const adminAuthClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default function AdminAssinantesPage() {
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const [clientes, setClientes] = useState<any[]>([]);
  const [planoOpcoes, setPlanoOpcoes] = useState<any[]>([]);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newAssinaturaModalOpen, setNewAssinaturaModalOpen] = useState(false);
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);

  // States: Edit Assinatura
  const [selectedAssinatura, setSelectedAssinatura] = useState<any>(null);
  const [editDataFim, setEditDataFim] = useState("");
  const [editStatus, setEditStatus] = useState("Ativa");

  // States: Nova Assinatura Manual
  const [newAssUserId, setNewAssUserId] = useState("");
  const [newAssPlanoId, setNewAssPlanoId] = useState("");
  const [newAssDataInicio, setNewAssDataInicio] = useState("");
  const [newAssDataFim, setNewAssDataFim] = useState("");
  const [savingAssinatura, setSavingAssinatura] = useState(false);

  // States: Novo Cliente Manual
  const [newCliNome, setNewCliNome] = useState("");
  const [newCliEmail, setNewCliEmail] = useState("");
  const [newCliTelefone, setNewCliTelefone] = useState("");
  const [newCliSenha, setNewCliSenha] = useState("");
  const [savingClient, setSavingClient] = useState(false);

  // Feedback State
  const [feedback, setFeedback] = useState<{isOpen: boolean, type: "error"|"success", title: string, message: string}>({
    isOpen: false, type: "success", title: "", message: ""
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    targetId: string | null;
  }>({ isOpen: false, targetId: null });

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, targetId: null });
  };

  useEffect(() => {
    fetchAssinaturas();
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    // Buscar todos clientes para o select
    const { data: cData } = await supabase.from("profiles").select("*").order("nome", { ascending: true });
    if (cData) setClientes(cData);

    // Buscar planos para o select
    const { data: pData } = await supabase.from("plano_opcoes").select("*, planos(nome)").order("valor", { ascending: true });
    if (pData) setPlanoOpcoes(pData);
  };

  const fetchAssinaturas = async () => {
    setLoading(true);
    // Busca todas as assinaturas (Ativas ou não) para o admin poder gerenciar
    const { data, error } = await supabase
      .from("assinaturas")
      .select("*, profiles(*), plano_opcoes(*, planos(*))")
      .order("data_inicio", { ascending: false });

    if (!error && data) {
      setAssinaturas(data);
    }
    setLoading(false);
  };

  const assinantesFiltrados = assinaturas.filter((a) =>
    a.profiles?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    (a.profiles?.cpf && a.profiles.cpf.replace(/\D/g, '').includes(busca.replace(/\D/g, ''))) ||
    a.plano_opcoes?.planos?.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  // === HANDLERS ===

  // Edição de Assinatura
  const handleOpenEdit = (ass: any) => {
    setSelectedAssinatura(ass);
    setEditStatus(ass.status);
    
    if (ass.data_fim) {
      const d = new Date(ass.data_fim);
      setEditDataFim(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    } else {
      setEditDataFim("");
    }
    
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    const payload: any = { status: editStatus };
    if (editDataFim) {
      payload.data_fim = new Date(editDataFim).toISOString();
    } else {
      payload.data_fim = null;
    }

    const { error } = await supabase.from('assinaturas').update(payload).eq('id', selectedAssinatura.id);
    if (error) {
      setFeedback({ isOpen: true, type: 'error', title: 'Erro', message: translateError(error.message) });
      return;
    }

    setFeedback({ isOpen: true, type: 'success', title: 'Sucesso', message: 'Assinatura atualizada!' });
    setEditModalOpen(false);
    fetchAssinaturas();
  };

  const handleDeleteAssinatura = (id: string) => {
    setConfirmModal({ isOpen: true, targetId: id });
  };

  const executeDeleteAssinatura = async () => {
    if (!confirmModal.targetId) return;
    const { error } = await supabase.from('assinaturas').delete().eq('id', confirmModal.targetId);
    if (error) {
      setFeedback({ isOpen: true, type: 'error', title: 'Erro', message: translateError(error.message) });
    } else {
      setEditModalOpen(false);
      fetchAssinaturas();
    }
    closeConfirmModal();
  };

  // Nova Assinatura Manual
  const handleOpenNewAssinatura = () => {
    setNewAssUserId("");
    setNewAssPlanoId("");
    
    const now = new Date();
    setNewAssDataInicio(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    
    const thirtyDays = new Date(now.setDate(now.getDate() + 30));
    setNewAssDataFim(new Date(thirtyDays.getTime() - thirtyDays.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    
    setNewAssinaturaModalOpen(true);
  };

  const handleSaveNewAssinatura = async () => {
    if (!newAssUserId || !newAssPlanoId || !newAssDataInicio) {
      setFeedback({ isOpen: true, type: 'error', title: 'Atenção', message: 'Preencha cliente, plano e data de início.' });
      return;
    }

    setSavingAssinatura(true);
    const { error } = await supabase.from('assinaturas').insert([{
      user_id: newAssUserId,
      plano_opcao_id: newAssPlanoId,
      status: 'Ativa',
      data_inicio: new Date(newAssDataInicio).toISOString(),
      data_fim: newAssDataFim ? new Date(newAssDataFim).toISOString() : null
    }]);

    if (error) {
      setFeedback({ isOpen: true, type: 'error', title: 'Erro ao criar', message: translateError(error.message) });
    } else {
      setFeedback({ isOpen: true, type: 'success', title: 'Sucesso', message: 'Assinatura manual criada com sucesso!' });
      setNewAssinaturaModalOpen(false);
      fetchAssinaturas();
    }
    setSavingAssinatura(false);
  };

  // Novo Cliente Manual
  const handleSaveNewClient = async () => {
    if (!newCliNome || !newCliEmail || !newCliSenha) {
      setFeedback({ isOpen: true, type: 'error', title: 'Atenção', message: 'Nome, CPF e Senha são obrigatórios para criar acesso.' });
      return;
    }

    setSavingClient(true);
    
    const cleanCpf = newCliEmail.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      setFeedback({ isOpen: true, type: 'error', title: 'Atenção', message: 'CPF inválido.' });
      setSavingClient(false);
      return;
    }
    const fakeEmail = `dyoli${cleanCpf}@gmail.com`;

    // 1. Criar o Auth User usando o cliente adminAuthClient para não derrubar a sessão atual do Admin
    const { data: authData, error: authError } = await adminAuthClient.auth.signUp({
      email: fakeEmail,
      password: newCliSenha,
    });

    if (authError) {
      setFeedback({ isOpen: true, type: 'error', title: 'Erro ao criar login', message: translateError(authError.message) });
      setSavingClient(false);
      return;
    }

    // 2. O trigger do banco já deve ter criado o profile. Vamos atualizá-lo com Nome e Telefone.
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').update({
        nome: newCliNome,
        telefone: newCliTelefone,
        cpf: cleanCpf
      }).eq('id', authData.user.id);

      if (profileError) {
        setFeedback({ isOpen: true, type: 'error', title: 'Erro Parcial', message: 'Conta criada, mas erro ao salvar nome: ' + translateError(profileError.message) });
      } else {
        setFeedback({ isOpen: true, type: 'success', title: 'Sucesso', message: 'Cliente cadastrado com sucesso! Ele já pode logar com o CPF e senha.' });
        setNewClientModalOpen(false);
        setNewCliNome("");
        setNewCliEmail("");
        setNewCliTelefone("");
        setNewCliSenha("");
        fetchSupportData(); // Atualizar o combo de clientes
      }
    }
    
    setSavingClient(false);
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
        title="Excluir Assinatura"
        message="Tem certeza que deseja excluir completamente esta assinatura do banco de dados? O cliente perderá acesso VIP e o histórico da assinatura será apagado."
        type="danger"
        confirmText="Sim, Excluir"
        onConfirm={executeDeleteAssinatura}
        onCancel={closeConfirmModal}
      />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            Assinaturas
            <span className="bg-emerald-100 text-emerald-700 text-sm py-1 px-3 rounded-full flex items-center gap-1">
              <Star size={14} /> {assinaturas.filter(a => a.status === 'Ativa').length} Ativos
            </span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">Gerencie os clientes e planos ativos, datas e expirações.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setNewClientModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-all"
          >
            <UserPlus size={18} className="text-[#ff1493]" />
            Novo Cliente
          </button>
          
          <button 
            onClick={handleOpenNewAssinatura}
            className="flex items-center justify-center gap-2 bg-[#ff1493] hover:bg-[#e91e63] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-[0_8px_20px_-6px_rgba(255,20,147,0.5)] transition-all"
          >
            <Plus size={18} />
            Nova Assinatura Manual
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 max-w-md">
        <div className="p-3 text-gray-400">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Buscar por nome, CPF ou plano..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-gray-700 font-medium placeholder:text-gray-400"
        />
      </div>

      {/* Listagem em Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-500 font-bold animate-pulse">Carregando assinaturas...</div>
        ) : assinantesFiltrados.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-[24px] border border-gray-100 shadow-sm text-gray-500 font-medium flex flex-col items-center justify-center">
            <UserCheck size={48} className="text-gray-300 mb-4" />
            <p>Nenhuma assinatura encontrada.</p>
          </div>
        ) : (
          assinantesFiltrados.map((assinatura) => (
            <div 
              key={assinatura.id} 
              className={`bg-white rounded-[24px] border ${assinatura.status === 'Ativa' ? 'border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-lg' : 'border-gray-200 opacity-60'} overflow-hidden transition-all duration-300 relative group`}
            >
              {/* Destaque Superior */}
              <div className="h-20 bg-gradient-to-r from-gray-900 to-gray-800 relative">
                <button 
                  onClick={() => handleOpenEdit(assinatura)}
                  className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white p-2 rounded-lg backdrop-blur-sm transition-colors"
                  title="Controlar Assinatura"
                >
                  <Settings2 size={16} />
                </button>
                {assinatura.plano_opcoes?.prioridade && assinatura.status === 'Ativa' && (
                  <div className="absolute top-3 right-14 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                    <Star size={12} fill="currentColor" /> Prioridade
                  </div>
                )}
                <div className={`absolute top-3 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  assinatura.status === 'Ativa' ? 'bg-emerald-500 text-white' : 
                  assinatura.status === 'Cancelada' ? 'bg-red-500 text-white' : 'bg-gray-400 text-white'
                }`}>
                  {assinatura.status}
                </div>
              </div>

              {/* Foto / Iniciais do Usuário */}
              <div className="absolute top-10 left-6">
                <div className="w-20 h-20 bg-white rounded-2xl p-1 shadow-md">
                  <div className={`w-full h-full rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-inner ${assinatura.status === 'Ativa' ? 'bg-gradient-to-br from-[#ff1493] to-[#ff4081]' : 'bg-gray-400'}`}>
                    {assinatura.profiles?.nome?.substring(0, 2).toUpperCase() || 'CLI'}
                  </div>
                </div>
              </div>

              <div className="pt-14 p-6 flex flex-col h-[calc(100%-5rem)]">
                {/* Info do Cliente */}
                <div className="mb-6">
                  <h3 className="text-xl font-black text-gray-900 mb-1 truncate">{assinatura.profiles?.nome || 'Cliente Oculto'}</h3>
                  <p className="text-sm text-gray-500 truncate">{assinatura.profiles?.cpf ? assinatura.profiles.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : 'Sem CPF'}</p>
                </div>

                {/* Detalhes do Plano */}
                <div className="mt-auto space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center shrink-0">
                      <CreditCard size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plano Selecionado</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{assinatura.plano_opcoes?.planos?.nome}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">
                        R$ {Number(assinatura.plano_opcoes?.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div className="flex-1 flex justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Início</p>
                        <p className="text-xs font-medium text-gray-700">
                          {new Date(assinatura.data_inicio).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Expiração</p>
                        <p className="text-xs font-medium text-gray-700">
                          {assinatura.data_fim ? new Date(assinatura.data_fim).toLocaleDateString('pt-BR') : 'Sem data'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* ======================= MODALS ======================= */}

      {/* MODAL 1: Editar Assinatura */}
      {editModalOpen && selectedAssinatura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[95vw] sm:max-w-md my-auto flex flex-col animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-gray-900">Controle de Assinatura</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedAssinatura.profiles?.nome}</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                <select 
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                >
                  <option value="Ativa">Ativa</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Inativa">Inativa</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Data de Expiração (Fim)</label>
                <input 
                  type="datetime-local" 
                  value={editDataFim}
                  onChange={e => setEditDataFim(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                />
                <p className="text-[10px] text-gray-400 mt-1">Deixe em branco se não expirar automaticamente.</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-between bg-gray-50/50 rounded-b-[32px]">
              <button 
                onClick={() => handleDeleteAssinatura(selectedAssinatura.id)}
                className="flex items-center gap-2 px-4 py-2.5 font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="Excluir do Banco de Dados"
              >
                <Trash2 size={18} />
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={() => setEditModalOpen(false)}
                  className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 bg-[#ff1493] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <CheckCircle2 size={18} /> Atualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* MODAL 2: Nova Assinatura Manual */}
      {newAssinaturaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[95vw] sm:max-w-md my-auto flex flex-col animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-gray-900">Nova Assinatura Manual</h2>
                <p className="text-sm text-gray-500 mt-1">Insira um cliente diretamente em um plano.</p>
              </div>
              <button onClick={() => setNewAssinaturaModalOpen(false)} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cliente *</label>
                <select 
                  value={newAssUserId}
                  onChange={e => setNewAssUserId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                >
                  <option value="">-- Selecione o cliente --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.cpf ? c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : 'Sem CPF'})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Plano e Valor *</label>
                <select 
                  value={newAssPlanoId}
                  onChange={e => setNewAssPlanoId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                >
                  <option value="">-- Selecione o plano --</option>
                  {planoOpcoes.map(p => <option key={p.id} value={p.id}>{p.planos?.nome} - R$ {p.valor}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Início *</label>
                  <input 
                    type="datetime-local" 
                    value={newAssDataInicio}
                    onChange={e => setNewAssDataInicio(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fim (Opcional)</label>
                  <input 
                    type="datetime-local" 
                    value={newAssDataFim}
                    onChange={e => setNewAssDataFim(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end bg-gray-50/50 rounded-b-[32px]">
              <button 
                onClick={() => setNewAssinaturaModalOpen(false)}
                className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveNewAssinatura}
                disabled={savingAssinatura}
                className="flex items-center gap-2 bg-[#ff1493] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {savingAssinatura ? "Salvando..." : <><CheckCircle2 size={18} /> Confirmar Assinatura</>}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL 3: Novo Cliente Manual */}
      {newClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[95vw] sm:max-w-md my-auto flex flex-col animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-gray-900">Novo Cliente</h2>
                <p className="text-sm text-gray-500 mt-1">Crie um acesso para um cliente manualmente.</p>
              </div>
              <button onClick={() => setNewClientModalOpen(false)} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo *</label>
                <input 
                  type="text" 
                  value={newCliNome}
                  onChange={e => setNewCliNome(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                  placeholder="Nome do Cliente"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">CPF (Login) *</label>
                <input 
                  type="text" 
                  value={newCliEmail}
                  onChange={e => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length > 11) v = v.slice(0, 11);
                    v = v.replace(/(\d{3})(\d)/, "$1.$2");
                    v = v.replace(/(\d{3})(\d)/, "$1.$2");
                    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                    setNewCliEmail(v);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                  placeholder="123.456.789-00"
                  maxLength={14}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={newCliTelefone}
                  onChange={e => setNewCliTelefone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Senha (Provisória) *</label>
                <input 
                  type="text" 
                  value={newCliSenha}
                  onChange={e => setNewCliSenha(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493]"
                  placeholder="Mínimo 6 caracteres"
                />
                <p className="text-[10px] text-gray-400 mt-1">Forneça essa senha ao cliente para ele entrar no app.</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end bg-gray-50/50 rounded-b-[32px]">
              <button 
                onClick={() => setNewClientModalOpen(false)}
                className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveNewClient}
                disabled={savingClient}
                className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-black transition-all disabled:opacity-50"
              >
                {savingClient ? "Cadastrando..." : <><UserPlus size={18} /> Cadastrar Cliente</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
