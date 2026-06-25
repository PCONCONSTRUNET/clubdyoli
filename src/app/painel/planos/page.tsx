"use client";

import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, CheckCircle2, Gift, Star, Info, Sparkles, Coins } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function PlanosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clube = searchParams.get('clube') || 'credito';

  const [planos, setPlanos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assinandoId, setAssinandoId] = useState<string | null>(null);
  const [assinandoTattoo, setAssinandoTattoo] = useState(false);

  useEffect(() => {
    async function fetchPlanos() {
      const { data, error } = await supabase
        .from('plano_opcoes')
        .select('*, planos(nome, descricao)');

      if (data && !error) {
        const cores = [
          "from-[#ff9a9e] to-[#fecfef]",
          "from-[#a1c4fd] to-[#c2e9fb]",
          "from-[#f6d365] to-[#fda085]",
          "from-[#d4fc79] to-[#96e6a1]"
        ];
        const formated = data
          .sort((a: any, b: any) => a.valor - b.valor)
          .map((p: any, idx: number) => ({
            id: p.id,
            nome: p.planos?.nome || "Plano",
            preco: p.valor.toFixed(2).replace('.', ','),
            desconto: p.desconto,
            cor: cores[idx % cores.length],
            prioridade: p.prioridade,
            cupom_porcentagem: p.cupom_porcentagem || 0,
            cupom_validade_dias: p.cupom_validade_dias || 30
          }));
        setPlanos(formated);
      }
      setLoading(false);
    }
    fetchPlanos();
  }, []);

  const handleAssinar = async (plano: any) => {
    setAssinandoId(plano.id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert("Você precisa estar logado."); setAssinandoId(null); return; }
    const userId = session.user.id;
    try {
      await supabase.from('assinaturas').insert([{ user_id: userId, plano_opcao_id: plano.id, status: 'Ativa' }]);
      if (plano.cupom_porcentagem > 0) {
        const codigoCupom = `VIP${plano.cupom_porcentagem}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
        const dataValidade = new Date();
        dataValidade.setDate(dataValidade.getDate() + plano.cupom_validade_dias);
        const { data: cupomData, error: cupomError } = await supabase.from('cupons').insert([{
          codigo: codigoCupom, porcentagem_desconto: plano.cupom_porcentagem,
          validade: dataValidade.toLocaleDateString('pt-BR'), total_usos: 1, status: 'Ativo'
        }]).select().single();
        if (cupomData && !cupomError) {
          await supabase.from('user_cupons').insert([{ user_id: userId, cupom_id: cupomData.id }]);
        }
      }
      alert("Plano assinado com sucesso!");
      router.push('/painel/cupons');
    } catch { alert("Erro ao processar assinatura."); }
    finally { setAssinandoId(null); }
  };

  const handleAssinarTattoo = async () => {
    setAssinandoTattoo(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert("Você precisa estar logado."); setAssinandoTattoo(false); return; }
    try {
      await supabase.from('profiles').update({ is_clube_tattoo: true, giros_disponiveis: 1 }).eq('id', session.user.id);
      alert("Clube Tattoo assinado! Acesse seu perfil para ver seus benefícios.");
      router.push('/painel/perfil');
    } catch { alert("Erro ao processar assinatura."); }
    finally { setAssinandoTattoo(false); }
  };

  return (
    <main className="max-w-5xl mx-auto px-6 pt-12 pb-20">
      <Link href="/painel/clubes" className="inline-flex items-center gap-2 text-[#ff1493] font-bold mb-6 hover:opacity-80 transition-opacity">
        <ArrowLeft size={20} />
        Voltar aos Clubes
      </Link>

      {/* === CLUBE TATTOO === */}
      {clube === "tattoo" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🌸</div>
            <h1 className="text-4xl font-extrabold text-gray-900">Clube <span className="text-[#ff1493]">Tattoo</span></h1>
            <p className="text-gray-500 font-medium mt-2">Créditos acumulativos, sorte e fidelidade exclusiva.</p>
          </div>
          <div className="max-w-lg mx-auto">
            <div className="bg-white/90 backdrop-blur-xl rounded-[32px] border border-pink-100 shadow-[0_20px_60px_rgba(255,20,147,0.15)] overflow-hidden">
              <div className="bg-gradient-to-br from-[#ff9a9e] via-[#fecfef] to-[#ffd9e8] p-8 text-center relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-center items-end gap-1 mb-1">
                    <span className="text-xl font-bold text-gray-700 mb-1">R$</span>
                    <span className="text-6xl font-black text-gray-800 tracking-tighter">54</span>
                    <span className="text-2xl font-bold text-gray-700 mb-1">,90</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">por mês · recorrente</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-black text-gray-900 text-lg mb-5">O que está incluso:</h3>
                <ul className="space-y-4 mb-8">
                  {[
                    { icon: <Coins size={18} className="text-[#ff1493]" />, texto: "R$ 54,90 em créditos acumulativos a cada mensalidade" },
                    { icon: <Sparkles size={18} className="text-[#ff1493]" />, texto: "1 Giro da Sorte por mês para ganhar prêmios" },
                    { icon: <Gift size={18} className="text-[#ff1493]" />, texto: "Roleta de Cupons exclusiva a cada uso de créditos" },
                    { icon: <Star size={18} className="text-[#ff1493]" />, texto: "Prioridade ⭐ na agenda — identificado pelo atendente" },
                    { icon: <CheckCircle2 size={18} className="text-[#ff1493]" />, texto: "Participação automática nos sorteios mensais" },
                    { icon: <CheckCircle2 size={18} className="text-[#ff1493]" />, texto: "Programa de fidelidade com benefícios crescentes" },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <div className="bg-[#ff1493]/10 p-1.5 rounded-full mt-0.5 shrink-0">{item.icon}</div>
                      <span className="text-gray-700 font-medium leading-snug text-sm">{item.texto}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 mb-6 text-sm text-gray-600 font-medium">
                  💡 Resgate após <strong className="text-[#ff1493]">3 mensalidades</strong>. Em 12 meses acumula <strong>R$ 658,80</strong>!
                </div>
                <button
                  onClick={handleAssinarTattoo}
                  disabled={assinandoTattoo}
                  className="w-full bg-gradient-to-r from-[#ff1493] to-[#ff4081] text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-pink-400/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
                >
                  {assinandoTattoo ? "Processando..." : "🌸 Quero o Clube Tattoo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === CLUB DE CRÉDITO === */}
      {clube === "credito" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">💳</div>
            <h1 className="text-4xl font-extrabold text-gray-900">Club de <span className="text-[#ff1493]">Crédito</span></h1>
            <p className="text-gray-500 font-medium mt-2">Escolha o valor e acumule créditos com descontos exclusivos.</p>
          </div>
          {loading ? (
            <div className="text-center py-12"><p className="text-[#ff1493] font-bold animate-pulse">Carregando planos...</p></div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {planos.map((plano, idx) => (
                <div key={idx} className="bg-white/90 backdrop-blur-xl rounded-[20px] sm:rounded-[32px] border border-white shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(255,20,147,0.15)] overflow-hidden flex flex-col hover:-translate-y-2 transition-all duration-300 group">
                  <div className={`bg-gradient-to-br ${plano.cor} p-4 sm:p-8 text-center text-gray-800 relative overflow-hidden`}>
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40 mix-blend-overlay">
                      <img src="/logo.png" alt="" className="w-[140%] h-[140%] object-contain grayscale" />
                    </div>
                    <div className="relative z-10">
                      <h2 className="text-base sm:text-xl font-black mb-1 uppercase tracking-wide opacity-90">{plano.nome}</h2>
                      <div className="flex justify-center items-end gap-1">
                        <span className="text-xs sm:text-lg font-bold mb-1 opacity-80">R$</span>
                        <span className="text-3xl sm:text-5xl font-black tracking-tighter">{plano.preco.split(',')[0]}</span>
                        <span className="text-sm sm:text-xl font-bold mb-0.5 opacity-80">,{plano.preco.split(',')[1]}</span>
                      </div>
                      <span className="text-[10px] sm:text-sm font-medium opacity-70 mt-1 block">por mês</span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-8 flex-1 flex flex-col bg-white/50">
                    <ul className="space-y-3 mb-5 flex-1">
                      <li className="flex gap-2 items-start">
                        <div className="bg-[#ff1493]/10 p-1 rounded-full mt-0.5 shrink-0"><CheckCircle2 className="text-[#ff1493] w-4 h-4" /></div>
                        <span className="text-gray-700 font-medium text-[11px] sm:text-sm"><strong className="text-[#ff1493]">{plano.desconto}</strong> de Desconto</span>
                      </li>
                      <li className="flex gap-2 items-start">
                        <div className="bg-[#ff1493]/10 p-1 rounded-full mt-0.5 shrink-0"><Gift className="text-[#ff1493] w-4 h-4" /></div>
                        <span className="text-gray-700 font-medium text-[11px] sm:text-sm">Sorteios mensais</span>
                      </li>
                      {plano.prioridade && (
                        <li className="flex gap-2 items-start">
                          <div className="bg-[#ff1493]/10 p-1 rounded-full mt-0.5 shrink-0"><Star className="text-[#ff1493] w-4 h-4" /></div>
                          <span className="text-gray-700 font-medium text-[11px] sm:text-sm"><strong>Prioridade</strong> na agenda</span>
                        </li>
                      )}
                    </ul>
                    <button
                      onClick={() => handleAssinar(plano)}
                      disabled={assinandoId === plano.id}
                      className="w-full bg-gray-900 text-white py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-lg hover:bg-[#ff1493] transition-all duration-300 uppercase tracking-wider text-[10px] sm:text-sm disabled:opacity-50"
                    >
                      {assinandoId === plano.id ? "Assinando..." : "Assinar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-12 bg-white/90 backdrop-blur-xl p-6 sm:p-10 rounded-[32px] border border-white shadow-[0_15px_40px_rgba(0,0,0,0.06)]">
            <h3 className="text-2xl font-extrabold text-gray-900 mb-4 flex items-center gap-3"><Info className="text-[#ff1493]" size={28} />Como funciona?</h3>
            <p className="text-gray-600 font-medium leading-relaxed">Todo valor pago mensalmente vira <strong className="text-[#ff1493]">crédito acumulado</strong> para usar em procedimentos. Você ainda ganha descontos, participa de sorteios e tem prioridade na agenda nos planos maiores.</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function PlanosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-[#ff1493] font-bold animate-pulse">Carregando...</p></div>}>
      <PlanosContent />
    </Suspense>
  );
}
