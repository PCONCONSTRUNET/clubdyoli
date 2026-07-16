"use client";

import { useState } from "react";
import { Search, UserCheck, Ticket, Gift, CheckCircle2, AlertCircle, Globe, QrCode, X } from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from "../../../../lib/supabase";
import { FeedbackModal } from "../../../../components/FeedbackModal";
import { ConfirmModal } from "../../../../components/ConfirmModal";

export default function AdminValidarCupomPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState<any>(null);
  const [cupons, setCupons] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  
  const [feedback, setFeedback] = useState<{isOpen: boolean, type: "error"|"success", title: string, message: string}>({
    isOpen: false, type: "success", title: "", message: ""
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean, 
    cupomId: string, 
    isGlobal: boolean
  }>({ isOpen: false, cupomId: "", isGlobal: false });

  const formatCpfInput = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return v;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) {
      setFeedback({ isOpen: true, type: 'error', title: 'Atenção', message: 'Digite um CPF ou Nome.' });
      return;
    }

    setLoading(true);
    setCliente(null);
    setCupons([]);

    const cleanTerm = searchTerm.replace(/\D/g, "").length === 11 ? searchTerm.replace(/\D/g, "") : searchTerm;
    
    // 1. Buscar Cliente
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`cpf.eq.${cleanTerm},nome.ilike.%${searchTerm}%`)
      .limit(1);

    if (error || !profiles || profiles.length === 0) {
      setFeedback({ isOpen: true, type: 'error', title: 'Não encontrado', message: 'Nenhum cliente encontrado com esse CPF ou Nome.' });
      setLoading(false);
      return;
    }

    const foundUser = profiles[0];
    setCliente(foundUser);
    
    // 2. Buscar Cupons do Cliente
    await fetchCuponsDoCliente(foundUser.id);
  };

  const fetchCuponsDoCliente = async (userId: string) => {
    // 1. Buscar assinaturas ativas do usuário para saber de quais clubes ele faz parte
    const { data: assinaturasData } = await supabase
      .from('assinaturas')
      .select('plano_opcoes(plano_id)')
      .eq('user_id', userId)
      .eq('status', 'Ativa');
      
    const myActivePlanosIds = new Set(
      (assinaturasData || []).map((a: any) => a.plano_opcoes?.plano_id).filter(id => id)
    );

    // 2. Buscar cupons exclusivos e globais já registrados do cliente
    const { data: userCuponsData, error: userCuponsError } = await supabase
      .from('user_cupons')
      .select('cupom_id, usado_em, cupons(*)')
      .eq('user_id', userId);

    let myCupons: any[] = [];
    const usedCouponsMap = new Map(); // cupom_id -> usado_em

    if (!userCuponsError && userCuponsData) {
      userCuponsData.forEach((uc: any) => {
        if (uc.cupons) {
          uc.cupons.usado_em = uc.usado_em; // Marcar se foi usado
          myCupons.push(uc.cupons);
          usedCouponsMap.set(uc.cupom_id, uc.usado_em);
        }
      });
    }

    // 3. Buscar cupons Globais disponíveis para todos (ou para os clubes do usuário)
    const { data: globalCuponsData, error: globalCuponsError } = await supabase
      .from('cupons')
      .select('*')
      .eq('is_global', true)
      .eq('status', 'Ativo');

    if (!globalCuponsError && globalCuponsData) {
      const myCupomIds = new Set(myCupons.map(c => c.id));
      for (const gc of globalCuponsData) {
        if (!myCupomIds.has(gc.id)) {
          // Se o cupom global tem um plano específico, o usuário precisa estar nesse plano
          if (!gc.plano_id || myActivePlanosIds.has(gc.plano_id)) {
            myCupons.push(gc);
          }
        }
      }
    }

    // Ordenar: Disponíveis primeiro, depois os usados, depois expirados
    myCupons.sort((a, b) => {
      const aExpired = a.validade ? new Date(a.validade) < new Date() : false;
      const bExpired = b.validade ? new Date(b.validade) < new Date() : false;
      const aUsed = !!a.usado_em;
      const bUsed = !!b.usado_em;

      if (!aUsed && !aExpired && (bUsed || bExpired)) return -1;
      if (!bUsed && !bExpired && (aUsed || aExpired)) return 1;
      if (aUsed && !bUsed) return 1;
      if (!aUsed && bUsed) return -1;
      return 0;
    });

    setCupons(myCupons);
    setLoading(false);
    return myCupons;
  };

  const onScan = async (detectedCodes: any[]) => {
    if (detectedCodes.length > 0) {
      const text = detectedCodes[0].rawValue;
      if (!text) return;
      
      setShowScanner(false);
      setLoading(true);
      
      let userId = "";
      let cupomCodigo = text;
      
      if (text.includes('|')) {
        [cupomCodigo, userId] = text.split('|');
      }

      if (userId) {
        const { data: profiles, error } = await supabase.from('profiles').select('*').eq('id', userId).limit(1);
        if (profiles && profiles.length > 0) {
          const foundUser = profiles[0];
          setCliente(foundUser);
          const myCupons = await fetchCuponsDoCliente(foundUser.id);
          
          const scannedCupom = myCupons.find((c: any) => c.codigo === cupomCodigo);
          if (scannedCupom) {
             const isExpired = scannedCupom.validade ? new Date(scannedCupom.validade) < new Date() : false;
             const isUsed = !!scannedCupom.usado_em;
             const canUse = scannedCupom.status === 'Ativo' && !isExpired && !isUsed;
             if (canUse) {
               handleDarBaixa(scannedCupom.id, scannedCupom.is_global);
             } else {
               setFeedback({ isOpen: true, type: 'error', title: 'Atenção', message: 'O cupom escaneado já foi utilizado, está inativo ou expirado.' });
             }
          } else {
             setFeedback({ isOpen: true, type: 'error', title: 'Não Encontrado', message: 'O cupom escaneado não foi encontrado na carteira deste cliente.' });
          }
          return;
        }
      }
      
      setFeedback({ isOpen: true, type: 'error', title: 'QR Code Inválido', message: 'Não foi possível identificar o cliente ou o cupom com este QR Code.' });
      setLoading(false);
    }
  };

  const handleDarBaixa = async (cupomId: string, isGlobal: boolean) => {
    setConfirmModal({ isOpen: true, cupomId, isGlobal });
  };

  const executeDarBaixa = async () => {
    const { cupomId, isGlobal } = confirmModal;
    setConfirmModal({ isOpen: false, cupomId: "", isGlobal: false });
    setLoading(true);

    // 1. Verificar quantos usos restam no cupom
    const { data: cupomData } = await supabase
      .from('cupons')
      .select('total_usos')
      .eq('id', cupomId)
      .single();

    const usosRestantes = cupomData?.total_usos ?? 1;

    if (usosRestantes > 1) {
      // ── Ainda tem mais usos: apenas decrementa, não expira ──
      await supabase
        .from('cupons')
        .update({ total_usos: usosRestantes - 1 })
        .eq('id', cupomId);

      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Uso Registrado!',
        message: `Cupom validado com sucesso! Restam ainda ${usosRestantes - 1} uso(s) disponíveis.`
      });
    } else {
      // ── Último uso: expirar o cupom ──
      if (isGlobal) {
        // Cupom global: registrar uso do usuário e marcar cupom como Inativo
        const { data: existing } = await supabase
          .from('user_cupons')
          .select('id')
          .eq('user_id', cliente.id)
          .eq('cupom_id', cupomId);

        if (existing && existing.length > 0) {
          await supabase
            .from('user_cupons')
            .update({ usado_em: new Date().toISOString() })
            .eq('user_id', cliente.id)
            .eq('cupom_id', cupomId);
        } else {
          await supabase.from('user_cupons').insert([{
            user_id: cliente.id,
            cupom_id: cupomId,
            usado_em: new Date().toISOString()
          }]);
        }

        // Marcar cupom como inativo pois esgotou os usos
        await supabase
          .from('cupons')
          .update({ status: 'Inativo', total_usos: 0 })
          .eq('id', cupomId);
      } else {
        // Cupom exclusivo: apenas marca a entrada do usuário como usada
        await supabase
          .from('user_cupons')
          .update({ usado_em: new Date().toISOString() })
          .eq('user_id', cliente.id)
          .eq('cupom_id', cupomId);

        await supabase
          .from('cupons')
          .update({ total_usos: 0 })
          .eq('id', cupomId);
      }

      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Baixa Concluída!',
        message: 'Cupom validado e expirado — todos os usos foram consumidos.'
      });
    }

    // Recarregar cupons do cliente
    if (cliente) {
      await fetchCuponsDoCliente(cliente.id);
    }
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
        title="Validar Cupom"
        message="Confirmar a utilização deste cupom pelo cliente? Esta ação não pode ser desfeita."
        type="warning"
        confirmText="Sim, Dar Baixa"
        onConfirm={executeDarBaixa}
        onCancel={() => setConfirmModal({ isOpen: false, cupomId: "", isGlobal: false })}
      />
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Validar Cupom</h1>
        <p className="text-gray-500 font-medium mt-1">Busque um cliente para dar baixa nos cupons e prêmios na hora do uso.</p>
      </div>

      <div className="bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative">
          <label className="block text-sm font-bold text-gray-700 mb-2">Digite o CPF ou Nome do Cliente</label>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={20} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  if (e.target.value.replace(/\D/g, "").length > 0 && !e.target.value.includes('@')) {
                    setSearchTerm(formatCpfInput(e.target.value));
                  } else {
                    setSearchTerm(e.target.value);
                  }
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-900 font-bold focus:outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493] transition-all text-lg"
                placeholder="Ex: 123.456.789-00 ou João da Silva"
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5)] transition-all whitespace-nowrap disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Buscar Cliente'}
            </button>
            <button 
              type="button" 
              onClick={() => setShowScanner(true)}
              className="bg-[#ff1493] hover:bg-[#e91e63] text-white px-6 py-4 rounded-xl font-bold shadow-[0_8px_20px_-6px_rgba(255,20,147,0.5)] transition-all whitespace-nowrap flex items-center justify-center gap-2"
            >
              <QrCode size={20} />
              Ler QR Code
            </button>
          </div>
        </form>
      </div>

      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[32px] overflow-hidden flex flex-col relative">
            <div className="p-6 text-center border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-xl">Escaneie o QR Code</h3>
              <button onClick={() => setShowScanner(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="aspect-square bg-black relative">
              <Scanner onScan={onScan} />
              <div className="absolute inset-0 border-[40px] border-black/30 pointer-events-none">
                <div className="absolute inset-0 border-2 border-dashed border-[#ff1493]"></div>
              </div>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-500 font-medium">Aponte a câmera para o QR Code no celular ou voucher do cliente.</p>
            </div>
          </div>
        </div>
      )}

      {cliente && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-[24px] border border-gray-200 flex items-center gap-4">
            <div className="w-16 h-16 bg-[#ff1493]/10 text-[#ff1493] rounded-full flex items-center justify-center font-black text-2xl">
              {cliente.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">{cliente.nome}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium mt-1">
                <span>CPF: <strong className="text-gray-700">{formatCpfInput(cliente.cpf || "")}</strong></span>
                <span>•</span>
                <span>Telefone: <strong className="text-gray-700">{cliente.telefone || "Não informado"}</strong></span>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 pt-4">Carteira de Cupons do Cliente</h3>
          
          {cupons.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[24px] border border-gray-100">
              <Ticket className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500 font-medium text-lg">Este cliente não possui nenhum cupom disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cupons.map((cupom, idx) => {
                const isExpired = cupom.validade ? new Date(cupom.validade) < new Date() : false;
                const isUsed = !!cupom.usado_em;
                const semUsos = (cupom.total_usos !== null && cupom.total_usos !== undefined) ? cupom.total_usos === 0 : false;
                const canUse = cupom.status === 'Ativo' && !isExpired && !isUsed && !semUsos;
                const usosLabel = (cupom.total_usos !== null && cupom.total_usos !== undefined && cupom.total_usos > 0)
                  ? `${cupom.total_usos} uso(s) restante(s)`
                  : null;

                return (
                  <div key={idx} className={`bg-white p-6 rounded-[24px] border ${canUse ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-60'} flex flex-col relative`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        {cupom.is_global && (
                          <span className="inline-block bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md mb-2 uppercase tracking-wider">
                            Global
                          </span>
                        )}
                        <h4 className="font-black text-xl text-gray-900">{cupom.codigo}</h4>
                        <p className="text-sm font-bold text-[#ff1493]">
                          {cupom.tipo === 'Premio' ? cupom.valor_premio : `${cupom.porcentagem_desconto}% OFF`}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${cupom.tipo === 'Premio' ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-[#ff1493]'}`}>
                        {cupom.tipo === 'Premio' ? <Gift size={24} /> : <Ticket size={24} />}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">
                        {isUsed
                          ? `Usado em: ${new Date(cupom.usado_em).toLocaleDateString('pt-BR')}`
                          : isExpired
                            ? 'Expirado'
                            : cupom.status !== 'Ativo'
                              ? 'Pausado'
                              : usosLabel
                                ? <span className="text-emerald-600 font-bold">{usosLabel}</span>
                                : 'Disponível para uso'}
                      </span>
                      
                      {canUse ? (
                        <button 
                          onClick={() => handleDarBaixa(cupom.id, cupom.is_global)}
                          className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
                        >
                          <CheckCircle2 size={16} /> Dar Baixa
                        </button>
                      ) : (
                        <span className={`px-4 py-2 rounded-xl font-bold text-sm ${isUsed ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {isUsed ? 'Já Utilizado' : 'Indisponível'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
