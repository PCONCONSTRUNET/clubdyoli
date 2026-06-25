"use client";

import { useState, useEffect } from "react";
import { Search, MoreVertical, CreditCard, Tag, Star, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import { ConfirmModal } from "../../../../components/ConfirmModal";

export default function AdminClientesPage() {
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  const [busca, setBusca] = useState("");

  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    actionType: "deleteClient" | "deletePayment" | null;
    targetId: string | null;
  }>({ isOpen: false, actionType: null, targetId: null });

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, actionType: null, targetId: null });
  };

  const fetchClientes = async () => {
    setLoading(true);
      // Puxa perfis que são clientes
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id, nome, telefone, created_at, role, cpf, is_clube_tattoo, creditos_acumulados,
          assinaturas (status, plano_opcoes (valor, planos (nome))),
          pagamentos (id, valor, status, data_pagamento)
        `)
        .eq('role', 'client');

      if (profiles && !error) {
        const formatados = profiles.map((p: any) => {
          const ass = p.assinaturas?.[0]; // Pega a primeira assinatura para exibir
          return {
            id: p.id,
            nome: p.nome,
            cpf: p.cpf ? p.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "CPF não informado",
            telefone: p.telefone || "Não informado",
            plano: ass ? `${ass.plano_opcoes?.planos?.nome} (R$ ${ass.plano_opcoes?.valor})` : "Nenhum",
            status: ass?.status || "Inativo",
            desde: new Date(p.created_at).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', year: 'numeric'}),
            pagamentos: p.pagamentos?.map((pag: any) => ({
              id: pag.id,
              data: new Date(pag.data_pagamento).toLocaleDateString('pt-BR'),
              valor: `R$ ${pag.valor}`,
              status: pag.status
            })) || [],
            cupons: [], // Mock por enquanto
            isClubeTattoo: p.is_clube_tattoo || false,
            creditos: p.creditos_acumulados || 0
          };
        });
        setClientes(formatados);
      }
      setLoading(false);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleDeleteClient = (id: string) => {
    setConfirmModal({ isOpen: true, actionType: "deleteClient", targetId: id });
  };

  const handleDeletePayment = (id: string) => {
    setConfirmModal({ isOpen: true, actionType: "deletePayment", targetId: id });
  };

  const executeDelete = async () => {
    const { actionType, targetId } = confirmModal;
    if (!targetId) return;

    if (actionType === "deleteClient") {
      await supabase.from('profiles').delete().eq('id', targetId);
      setSelectedCliente(null);
    } else if (actionType === "deletePayment") {
      await supabase.from('pagamentos').delete().eq('id', targetId);
      // We must deselect client or refetch and update selected client
      setSelectedCliente((prev: any) => ({
        ...prev,
        pagamentos: prev.pagamentos.filter((p: any) => p.id !== targetId)
      }));
    }
    
    fetchClientes();
    closeConfirmModal();
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) || 
    c.cpf.replace(/\D/g, '').includes(busca.replace(/\D/g, ''))
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full pb-20">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.actionType === "deleteClient" ? "Excluir Cliente" : "Excluir Pagamento"}
        message={confirmModal.actionType === "deleteClient" 
          ? "Tem certeza que deseja excluir este cliente do sistema? Esta ação apagará todas as assinaturas, cupons e histórico de pagamento dele. A exclusão é irreversível."
          : "Tem certeza que deseja apagar este pagamento do histórico?"}
        type="danger"
        confirmText="Sim, Excluir"
        onConfirm={executeDelete}
        onCancel={closeConfirmModal}
      />
      {/* Lista de Clientes */}
      <div className={`flex-1 flex flex-col space-y-6 ${selectedCliente ? 'hidden lg:flex' : 'flex'}`}>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestão de Clientes</h1>
          <p className="text-gray-500 font-medium mt-1">Gerencie a base de clientes, assinaturas e histórico.</p>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <input 
                type="text" 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou CPF..." 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493] transition-all"
              />
              <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-gray-100">
              {clientesFiltrados.map((cliente) => (
                <li 
                  key={cliente.id} 
                  onClick={() => setSelectedCliente(cliente)}
                  className={`p-4 sm:p-6 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between group ${selectedCliente?.id === cliente.id ? 'bg-[#ff1493]/5 border-l-4 border-[#ff1493]' : 'border-l-4 border-transparent'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${cliente.status === 'Ativo' ? 'bg-[#ff1493] text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {cliente.nome.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 flex items-center gap-1">
                        {cliente.nome} {cliente.isClubeTattoo && <span title="Clube Tattoo">⭐</span>}
                      </h3>
                      <p className="text-sm text-gray-500">{cliente.cpf}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-bold text-gray-700">{cliente.plano}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${cliente.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                        {cliente.status}
                      </span>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-[#ff1493] transition-colors" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Detalhes do Cliente Selecionado */}
      {selectedCliente && (
        <div className="w-full lg:w-[450px] bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col h-full overflow-hidden animate-in slide-in-from-right-8 duration-300">
          <div className="p-6 sm:p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff1493]/20 blur-2xl rounded-full"></div>
            
            <button 
              onClick={() => setSelectedCliente(null)}
              className="lg:hidden flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm font-medium"
            >
              <ChevronRight size={16} className="rotate-180" /> Voltar
            </button>

            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-[#ff1493] text-white rounded-full flex items-center justify-center font-black text-2xl shadow-lg relative z-10">
                {selectedCliente.nome.charAt(0)}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDeleteClient(selectedCliente.id)}
                  className="p-2 bg-red-500/20 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
                  title="Excluir Cliente"
                >
                  <Trash2 size={20} />
                </button>
                <button className="text-gray-400 hover:text-white p-2">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
            
            <h2 className="text-2xl font-black mb-1 relative z-10">{selectedCliente.nome}</h2>
            <p className="text-gray-400 text-sm mb-4 relative z-10">{selectedCliente.id} • Cliente desde {selectedCliente.desde}</p>
            
            <div className="flex flex-wrap gap-2 relative z-10">
              <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                {selectedCliente.telefone}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedCliente.status === 'Ativo' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/20 text-gray-400 border border-gray-500/20'}`}>
                {selectedCliente.status}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-8">
            {/* Assinatura Atual */}
            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Star size={16} /> Assinatura
              </h3>
              {selectedCliente.status === 'Ativo' ? (
                <div className="bg-[#ff1493]/5 border border-[#ff1493]/20 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{selectedCliente.plano}</p>
                    <p className="text-xs text-[#ff1493] font-medium mt-1">Benefícios VIP Ativos</p>
                  </div>
                  <button className="text-xs font-bold bg-white text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                    Gerenciar
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-gray-500 text-sm font-medium">Nenhum plano ativo no momento.</p>
                </div>
              )}
            </section>

            {/* Clube Tattoo - Gerenciar Créditos */}
            {selectedCliente.isClubeTattoo && (
              <section>
                <h3 className="text-sm font-bold text-[#ff1493] uppercase tracking-wider mb-4 flex items-center gap-2">
                  ⭐ Clube Tattoo
                </h3>
                <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 font-bold">Créditos Acumulados</p>
                    <p className="text-xl font-black text-gray-900">R$ {Number(selectedCliente.creditos).toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => alert('Abrir modal de adicionar/remover crédito (mock)')}
                      className="text-xs font-bold bg-[#ff1493] text-white px-3 py-2 rounded-lg shadow-sm hover:bg-pink-600 transition-colors"
                    >
                      Gerenciar
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Cupons */}
            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Tag size={16} /> Cupons Ativos
              </h3>
              {selectedCliente.cupons.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedCliente.cupons.map((cupom: string) => (
                    <span key={cupom} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide">
                      {cupom}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum cupom ativo na conta.</p>
              )}
            </section>

            {/* Últimos Pagamentos */}
            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard size={16} /> Histórico Financeiro
              </h3>
              {selectedCliente.pagamentos.length > 0 ? (
                <div className="space-y-3">
                  {selectedCliente.pagamentos.map((pag: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{pag.valor}</p>
                        <p className="text-xs text-gray-500">{pag.data}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                          {pag.status}
                        </span>
                        <button 
                          onClick={() => handleDeletePayment(pag.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Excluir Pagamento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum pagamento registrado.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
