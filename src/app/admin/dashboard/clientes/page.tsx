"use client";

import { useState, useEffect } from "react";
import { Search, CreditCard, Tag, Star, ChevronRight, Trash2, X, Plus, Minus, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import { ConfirmModal } from "../../../../components/ConfirmModal";
import { FeedbackModal } from "../../../../components/FeedbackModal";

export default function AdminClientesPage() {
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [busca, setBusca] = useState("");
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal de confirmação de exclusão
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    actionType: "deleteClient" | "deletePayment" | null;
    targetId: string | null;
  }>({ isOpen: false, actionType: null, targetId: null });

  // Modal de gerenciar créditos
  const [creditosModal, setCreditosModal] = useState<{
    aberto: boolean;
    operacao: "adicionar" | "remover";
    valor: string;
    loading: boolean;
  }>({ aberto: false, operacao: "adicionar", valor: "", loading: false });

  // Feedback global
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  const showFeedback = (type: "success" | "error", title: string, message: string) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const fetchClientes = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(`
        id, nome, telefone, created_at, role, cpf, is_clube_tattoo, creditos_acumulados,
        assinaturas (id, status, plano_opcoes (valor, planos (nome))),
        pagamentos (id, valor, status, data_pagamento),
        user_cupons (usado_em, cupons (id, codigo, porcentagem_desconto, tipo, valor_premio, status))
      `)
      .eq("role", "client")
      .order("created_at", { ascending: false });

    if (profiles && !error) {
      const formatados = profiles.map((p: any) => {
        const ass = p.assinaturas?.[0];
        const cuponsAtivos = (p.user_cupons || [])
          .filter((uc: any) => uc.cupons && uc.cupons.status === "Ativo" && !uc.usado_em)
          .map((uc: any) => ({
            id: uc.cupons.id,
            codigo: uc.cupons.codigo,
            desconto:
              uc.cupons.tipo === "Premio"
                ? uc.cupons.valor_premio
                : `${uc.cupons.porcentagem_desconto}% OFF`,
          }));

        return {
          id: p.id,
          nome: p.nome,
          cpf: p.cpf
            ? p.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
            : "CPF não informado",
          telefone: p.telefone || "Não informado",
          plano: ass
            ? `${ass.plano_opcoes?.planos?.nome} (R$ ${ass.plano_opcoes?.valor})`
            : "Nenhum",
          status: ass?.status || "Inativo",
          desde: new Date(p.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          pagamentos:
            p.pagamentos?.map((pag: any) => ({
              id: pag.id,
              data: new Date(pag.data_pagamento).toLocaleDateString("pt-BR"),
              valor: `R$ ${pag.valor}`,
              status: pag.status,
            })) || [],
          cupons: cuponsAtivos,
          isClubeTattoo: p.is_clube_tattoo || false,
          creditos: p.creditos_acumulados || 0,
        };
      });
      setClientes(formatados);

      // Atualiza o cliente selecionado se estiver aberto
      if (selectedCliente) {
        const atualizado = formatados.find((c) => c.id === selectedCliente.id);
        if (atualizado) setSelectedCliente(atualizado);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Excluir Cliente ─────────────────────────────────────────────────────────
  const handleDeleteClient = (id: string) => {
    setConfirmModal({ isOpen: true, actionType: "deleteClient", targetId: id });
  };

  const handleDeletePayment = (id: string) => {
    setConfirmModal({ isOpen: true, actionType: "deletePayment", targetId: id });
  };

  const executeDelete = async () => {
    const { actionType, targetId } = confirmModal;
    setConfirmModal({ isOpen: false, actionType: null, targetId: null });
    if (!targetId) return;

    if (actionType === "deleteClient") {
      setDeletingId(targetId);

      // Chamar a API route server-side que deleta do auth + banco
      const res = await fetch("/api/admin/excluir-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetId }),
      });

      const result = await res.json();

      if (!res.ok) {
        // Fallback: tenta deletar só do banco (sem auth)
        await supabase.from("user_cupons").delete().eq("user_id", targetId);
        await supabase.from("pagamentos").delete().eq("user_id", targetId);
        await supabase.from("assinaturas").delete().eq("user_id", targetId);
        await supabase.from("profiles").delete().eq("id", targetId);
        showFeedback(
          "success",
          "Cliente removido",
          "Cliente removido do banco de dados. Para remover da autenticação configure SUPABASE_SERVICE_ROLE_KEY."
        );
      } else {
        showFeedback("success", "Cliente excluído", "Cliente removido completamente do sistema.");
      }

      setSelectedCliente(null);
      setDeletingId(null);
      await fetchClientes();
    } else if (actionType === "deletePayment") {
      await supabase.from("pagamentos").delete().eq("id", targetId);
      setSelectedCliente((prev: any) => ({
        ...prev,
        pagamentos: prev.pagamentos.filter((p: any) => p.id !== targetId),
      }));
      showFeedback("success", "Removido", "Pagamento excluído do histórico.");
      await fetchClientes();
    }
  };

  // ─── Gerenciar Créditos ───────────────────────────────────────────────────────
  const handleSalvarCreditos = async () => {
    if (!selectedCliente || !creditosModal.valor) return;
    const valor = parseFloat(creditosModal.valor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      showFeedback("error", "Valor inválido", "Informe um valor numérico positivo.");
      return;
    }

    setCreditosModal((m) => ({ ...m, loading: true }));

    const novoCredito =
      creditosModal.operacao === "adicionar"
        ? selectedCliente.creditos + valor
        : Math.max(0, selectedCliente.creditos - valor);

    const { error } = await supabase
      .from("profiles")
      .update({ creditos_acumulados: novoCredito })
      .eq("id", selectedCliente.id);

    setCreditosModal({ aberto: false, operacao: "adicionar", valor: "", loading: false });

    if (error) {
      showFeedback("error", "Erro", "Não foi possível atualizar os créditos.");
    } else {
      showFeedback(
        "success",
        "Créditos atualizados!",
        `${creditosModal.operacao === "adicionar" ? "Adicionado" : "Removido"} R$ ${valor.toFixed(2).replace(".", ",")}. Novo saldo: R$ ${novoCredito.toFixed(2).replace(".", ",")}.`
      );
      await fetchClientes();
    }
  };

  // ─── Filtro ───────────────────────────────────────────────────────────────────
  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.cpf.replace(/\D/g, "").includes(busca.replace(/\D/g, ""))
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full pb-20">
      <FeedbackModal
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback((f) => ({ ...f, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.actionType === "deleteClient" ? "Excluir Cliente" : "Excluir Pagamento"}
        message={
          confirmModal.actionType === "deleteClient"
            ? "Tem certeza? Esta ação apagará o cliente, assinaturas, cupons, histórico de pagamento e a conta de acesso. É irreversível."
            : "Tem certeza que deseja apagar este pagamento do histórico?"
        }
        type="danger"
        confirmText="Sim, Excluir"
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, actionType: null, targetId: null })}
      />

      {/* Modal Gerenciar Créditos */}
      {creditosModal.aberto && selectedCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-gray-900">Gerenciar Créditos</h3>
              <button
                onClick={() => setCreditosModal({ aberto: false, operacao: "adicionar", valor: "", loading: false })}
                className="p-1.5 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-pink-50 rounded-2xl p-4 mb-5 text-center">
              <p className="text-xs text-gray-500 font-bold mb-1">Saldo atual de {selectedCliente.nome}</p>
              <p className="text-3xl font-black text-[#ff1493]">
                R$ {Number(selectedCliente.creditos).toFixed(2).replace(".", ",")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setCreditosModal((m) => ({ ...m, operacao: "adicionar" }))}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border transition-colors ${
                  creditosModal.operacao === "adicionar"
                    ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Plus size={16} /> Adicionar
              </button>
              <button
                onClick={() => setCreditosModal((m) => ({ ...m, operacao: "remover" }))}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border transition-colors ${
                  creditosModal.operacao === "remover"
                    ? "bg-red-100 border-red-400 text-red-700"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Minus size={16} /> Remover
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={creditosModal.valor}
                onChange={(e) => setCreditosModal((m) => ({ ...m, valor: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-bold focus:outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493] transition-colors"
                placeholder="Ex: 50.00"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCreditosModal({ aberto: false, operacao: "adicionar", valor: "", loading: false })}
                className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarCreditos}
                disabled={creditosModal.loading || !creditosModal.valor}
                className={`flex-1 py-3 rounded-xl font-black text-white transition-colors shadow-lg disabled:opacity-50 ${
                  creditosModal.operacao === "adicionar"
                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"
                    : "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                }`}
              >
                {creditosModal.loading
                  ? "Salvando..."
                  : creditosModal.operacao === "adicionar"
                  ? "Adicionar"
                  : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Clientes */}
      <div className={`flex-1 flex flex-col space-y-6 ${selectedCliente ? "hidden lg:flex" : "flex"}`}>
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
            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-4 border-[#ff1493] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400 font-medium text-sm">Carregando clientes...</p>
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-gray-400 font-medium">Nenhum cliente encontrado.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {clientesFiltrados.map((cliente) => (
                  <li
                    key={cliente.id}
                    onClick={() => setSelectedCliente(cliente)}
                    className={`p-4 sm:p-6 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between group ${
                      selectedCliente?.id === cliente.id
                        ? "bg-[#ff1493]/5 border-l-4 border-[#ff1493]"
                        : "border-l-4 border-transparent"
                    } ${deletingId === cliente.id ? "opacity-40 pointer-events-none" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          cliente.status === "Ativo" ? "bg-[#ff1493] text-white" : "bg-gray-200 text-gray-500"
                        }`}
                      >
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
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            cliente.status === "Ativo"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {cliente.status}
                        </span>
                      </div>
                      <ChevronRight size={20} className="text-gray-300 group-hover:text-[#ff1493] transition-colors" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Painel de Detalhes */}
      {selectedCliente && (
        <div className="w-full lg:w-[450px] bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col h-full overflow-hidden animate-in slide-in-from-right-8 duration-300">
          {/* Header escuro */}
          <div className="p-6 sm:p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff1493]/20 blur-2xl rounded-full" />

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
              <div className="flex gap-2 relative z-10">
                <button
                  onClick={() => handleDeleteClient(selectedCliente.id)}
                  className="p-2 bg-red-500/20 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
                  title="Excluir Cliente do Sistema"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <h2 className="text-2xl font-black mb-1 relative z-10">{selectedCliente.nome}</h2>
            <p className="text-gray-400 text-sm mb-4 relative z-10">
              Cliente desde {selectedCliente.desde}
            </p>

            <div className="flex flex-wrap gap-2 relative z-10">
              <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                {selectedCliente.telefone}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedCliente.status === "Ativo"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/20"
                }`}
              >
                {selectedCliente.status}
              </span>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-8">
            {/* Assinatura */}
            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Star size={16} /> Assinatura
              </h3>
              {selectedCliente.status === "Ativo" ? (
                <div className="bg-[#ff1493]/5 border border-[#ff1493]/20 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{selectedCliente.plano}</p>
                    <p className="text-xs text-[#ff1493] font-medium mt-1">Benefícios VIP Ativos</p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <CheckCircle2 size={12} /> Ativa
                  </span>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-gray-500 text-sm font-medium">Nenhum plano ativo no momento.</p>
                </div>
              )}
            </section>

            {/* Clube Tattoo */}
            {selectedCliente.isClubeTattoo && (
              <section>
                <h3 className="text-sm font-bold text-[#ff1493] uppercase tracking-wider mb-4 flex items-center gap-2">
                  ⭐ Clube Tattoo
                </h3>
                <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 font-bold">Créditos Acumulados</p>
                    <p className="text-xl font-black text-gray-900">
                      R$ {Number(selectedCliente.creditos).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setCreditosModal({ aberto: true, operacao: "adicionar", valor: "", loading: false })
                    }
                    className="text-xs font-bold bg-[#ff1493] text-white px-4 py-2.5 rounded-lg shadow-sm hover:bg-pink-600 transition-colors flex items-center gap-1.5"
                  >
                    <CreditCard size={14} /> Gerenciar
                  </button>
                </div>
              </section>
            )}

            {/* Cupons */}
            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Tag size={16} /> Cupons Ativos
                {selectedCliente.cupons.length > 0 && (
                  <span className="bg-[#ff1493] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {selectedCliente.cupons.length}
                  </span>
                )}
              </h3>
              {selectedCliente.cupons.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedCliente.cupons.map((cupom: any) => (
                    <span
                      key={cupom.id}
                      className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide flex items-center gap-1.5"
                    >
                      <Tag size={10} />
                      {cupom.codigo} · {cupom.desconto}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum cupom ativo na conta.</p>
              )}
            </section>

            {/* Histórico Financeiro */}
            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard size={16} /> Histórico Financeiro
              </h3>
              {selectedCliente.pagamentos.length > 0 ? (
                <div className="space-y-3">
                  {selectedCliente.pagamentos.map((pag: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100"
                    >
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
