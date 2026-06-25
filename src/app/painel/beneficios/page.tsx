"use client";

import { useEffect, useState } from "react";
import { Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

const BENEFICIOS_TATTOO = [
  { icon: "💰", titulo: "Créditos Acumulativos", desc: "R$ 54,90 em créditos a cada mensalidade paga" },
  { icon: "🎰", titulo: "Giro da Sorte", desc: "1 giro por mês para ganhar prêmios exclusivos" },
  { icon: "🎟️", titulo: "Roleta de Cupons", desc: "Cupons exclusivos a cada uso de créditos" },
  { icon: "⭐", titulo: "Prioridade na Agenda", desc: "Você é identificada pelo atendente e tem prioridade" },
  { icon: "🎁", titulo: "Sorteios Mensais", desc: "Participação automática nos sorteios mensais" },
  { icon: "🌸", titulo: "Fidelidade Crescente", desc: "Benefícios que crescem com o tempo de assinatura" },
];

const BENEFICIOS_CREDITO = [
  { icon: "💳", titulo: "Créditos Mensais", desc: "Todo valor pago vira crédito para usar em procedimentos" },
  { icon: "🏷️", titulo: "Descontos Exclusivos", desc: "Descontos especiais de acordo com seu plano" },
  { icon: "🎁", titulo: "Sorteios Mensais", desc: "Participação automática nos sorteios mensais" },
  { icon: "⭐", titulo: "Atendimento Prioritário", desc: "Passe na frente na hora de agendar suas sessões" },
  { icon: "👑", titulo: "Grupo VIP", desc: "Acesso à comunidade exclusiva com dicas e novidades" },
  { icon: "📈", titulo: "Benefícios Crescentes", desc: "Planos com mais descontos quanto mais você investe" },
];

export default function BeneficiosPage() {
  const [isClubeTattoo, setIsClubeTattoo] = useState(false);
  const [isClubCredito, setIsClubCredito] = useState(false);
  const [loading, setLoading] = useState(true);
  const [girosDisponiveis, setGirosDisponiveis] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_clube_tattoo, giros_disponiveis')
        .eq('id', session.user.id)
        .single();

      if (profile?.is_clube_tattoo) setIsClubeTattoo(true);
      if (profile?.giros_disponiveis) setGirosDisponiveis(profile.giros_disponiveis);

      const { data: assinaturas } = await supabase
        .from('assinaturas')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('status', 'Ativa')
        .limit(1);

      if (assinaturas && assinaturas.length > 0) setIsClubCredito(true);

      setLoading(false);
    }
    fetchData();
  }, []);

  const temClubeAtivo = isClubeTattoo || isClubCredito;

  return (
    <main className="max-w-2xl mx-auto px-6 pt-12 pb-16">
      <Link href="/painel" className="inline-flex items-center gap-2 text-[#ff1493] font-bold mb-6 hover:opacity-80 transition-opacity">
        <ArrowLeft size={20} />
        Voltar
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 w-16 h-16 rounded-full flex items-center justify-center shadow-sm">
          <Star className="text-[#ff1493]" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Benefícios</h1>
          <p className="text-gray-500 font-medium">As vantagens de ser VIP</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-[#ff1493] font-bold animate-pulse">Carregando...</p>
        </div>
      ) : temClubeAtivo ? (
        /* ===== CLUBES ATIVOS ===== */
        <div className="flex flex-col gap-5">
          {isClubeTattoo && (
            <div className="bg-gradient-to-br from-[#ff9a9e]/20 to-[#fecfef]/30 border border-pink-100 rounded-[24px] p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🌸</span>
                <div>
                  <h2 className="font-black text-gray-800 text-lg">Clube Tattoo</h2>
                  <span className="inline-block text-[10px] bg-[#ff1493] text-white px-2 py-0.5 rounded-full font-bold mt-0.5">ATIVO</span>
                </div>
              </div>
              <ul className="space-y-3">
                {BENEFICIOS_TATTOO.map((b, i) => (
                  <li key={i} className="flex gap-3 items-start flex-wrap">
                    <span className="text-lg shrink-0">{b.icon}</span>
                    <div className="flex-1">
                      <strong className="text-gray-800 text-sm block">{b.titulo}</strong>
                      <p className="text-gray-500 text-xs">{b.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isClubCredito && (
            <div className="bg-gradient-to-br from-[#a1c4fd]/20 to-[#c2e9fb]/30 border border-blue-100 rounded-[24px] p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💳</span>
                <div>
                  <h2 className="font-black text-gray-800 text-lg">Club de Crédito</h2>
                  <span className="inline-block text-[10px] bg-[#ff1493] text-white px-2 py-0.5 rounded-full font-bold mt-0.5">ATIVO</span>
                </div>
              </div>
              <ul className="space-y-3">
                {BENEFICIOS_CREDITO.map((b, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="text-lg shrink-0">{b.icon}</span>
                    <div>
                      <strong className="text-gray-800 text-sm block">{b.titulo}</strong>
                      <p className="text-gray-500 text-xs">{b.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Giro da Sorte (Standalone) */}
          {girosDisponiveis > 0 && (
            <div className="bg-gradient-to-br from-[#ff4081] to-[#ff1493] text-white rounded-[24px] p-5 sm:p-6 shadow-[0_10px_30px_rgba(255,20,147,0.2)] relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <div className="absolute -right-10 -top-10 w-40 h-40 opacity-20 pointer-events-none rounded-full bg-[conic-gradient(#F9A8D4_0deg_60deg,#FBCFE8_60deg_120deg,#FDF2F8_120deg_180deg,#F9A8D4_180deg_240deg,#FBCFE8_240deg_300deg,#FDF2F8_300deg_360deg)] animate-[spin_10s_linear_infinite]"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="bg-white/20 p-1.5 rounded-full shadow-lg shrink-0 backdrop-blur-md">
                  <div className="w-12 h-12 rounded-full border-[3px] border-white overflow-hidden relative bg-[conic-gradient(#F9A8D4_0deg_60deg,#FBCFE8_60deg_120deg,#FDF2F8_120deg_180deg,#F9A8D4_180deg_240deg,#FBCFE8_240deg_300deg,#FDF2F8_300deg_360deg)] flex items-center justify-center animate-[spin_8s_linear_infinite]">
                    <div className="w-2 h-2 bg-white rounded-full z-10 shadow-sm border border-pink-200"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#ff1493] z-20"></div>
                  </div>
                </div>
                <div>
                  <h2 className="font-black text-lg text-white drop-shadow-sm">Giro da Sorte</h2>
                  <p className="text-pink-50 text-xs sm:text-sm drop-shadow-sm">Você tem <strong>{girosDisponiveis} giro(s)</strong> grátis disponível!</p>
                </div>
              </div>
              <Link href="/painel/giro" className="relative z-10 inline-block bg-white text-[#ff1493] font-black text-sm px-6 py-3 rounded-full shadow-xl hover:scale-105 hover:bg-pink-50 transition-all text-center whitespace-nowrap border border-pink-100">
                Resgatar Prêmio
              </Link>
            </div>
          )}

          {/* Roleta de Cupons (Standalone) */}
          <div className="bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white rounded-[24px] p-5 sm:p-6 shadow-[0_10px_30px_rgba(168,85,247,0.2)] relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div className="absolute -right-10 -top-10 w-40 h-40 opacity-20 pointer-events-none rounded-full bg-[conic-gradient(#d8b4fe_0deg_60deg,#e9d5ff_60deg_120deg,#f3e8ff_120deg_180deg,#d8b4fe_180deg_240deg,#e9d5ff_240deg_300deg,#f3e8ff_300deg_360deg)] animate-[spin_10s_linear_infinite]"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="bg-white/20 p-1.5 rounded-full shadow-lg shrink-0 backdrop-blur-md">
                <div className="w-12 h-12 rounded-full border-[3px] border-white overflow-hidden relative bg-[conic-gradient(#d8b4fe_0deg_60deg,#e9d5ff_60deg_120deg,#f3e8ff_120deg_180deg,#d8b4fe_180deg_240deg,#e9d5ff_240deg_300deg,#f3e8ff_300deg_360deg)] flex items-center justify-center animate-[spin_8s_linear_infinite]">
                  <div className="w-2 h-2 bg-white rounded-full z-10 shadow-sm border border-purple-200"></div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[8px] border-l-transparent border-r-transparent border-t-purple-500 z-20"></div>
                </div>
              </div>
              <div>
                <h2 className="font-black text-lg text-white drop-shadow-sm">Roleta de Cupons</h2>
                <p className="text-purple-50 text-xs sm:text-sm drop-shadow-sm">Você tem <strong>1 giro(s)</strong> grátis disponível!</p>
              </div>
            </div>
            <Link href="/painel/giro-cupons" className="relative z-10 inline-block bg-white text-purple-600 font-black text-sm px-6 py-3 rounded-full shadow-xl hover:scale-105 hover:bg-purple-50 transition-all text-center whitespace-nowrap border border-purple-100">
              Resgatar Cupom
            </Link>
          </div>
        </div>
      ) : (
        /* ===== SEM CLUBE ATIVO ===== */
        <div className="flex flex-col gap-5">
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-sm text-gray-600 font-medium text-center">
            🌟 Você ainda não tem um clube ativo.{" "}
            <Link href="/painel/clubes" className="text-[#ff1493] font-bold hover:underline">
              Conheça os clubes!
            </Link>
          </div>

          {/* Preview Clube Tattoo (bloqueado) */}
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[24px] border border-white/60 shadow-sm opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl grayscale">🌸</span>
              <h2 className="font-black text-gray-500 text-lg">Clube Tattoo</h2>
              <span className="ml-auto text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">INATIVO</span>
            </div>
            <ul className="space-y-2">
              {BENEFICIOS_TATTOO.map((b, i) => (
                <li key={i} className="flex gap-2 items-center text-gray-400 text-sm">
                  <span className="grayscale">{b.icon}</span>
                  <span>{b.titulo}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Preview Club Crédito (bloqueado) */}
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[24px] border border-white/60 shadow-sm opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl grayscale">💳</span>
              <h2 className="font-black text-gray-500 text-lg">Club de Crédito</h2>
              <span className="ml-auto text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">INATIVO</span>
            </div>
            <ul className="space-y-2">
              {BENEFICIOS_CREDITO.map((b, i) => (
                <li key={i} className="flex gap-2 items-center text-gray-400 text-sm">
                  <span className="grayscale">{b.icon}</span>
                  <span>{b.titulo}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
