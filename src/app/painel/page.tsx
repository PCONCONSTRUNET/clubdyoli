"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Gift, Ticket, Star, User, LogOut, X, ArrowRight } from "lucide-react";

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

export default function PainelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState<string>("VIP");
  const [isClubeTattoo, setIsClubeTattoo] = useState(false);
  const [isClubCredito, setIsClubCredito] = useState(false);
  const [modalClube, setModalClube] = useState<'tattoo' | 'credito' | null>(null);

  // Drag Carousel State
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const draggedRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    draggedRef.current = false;
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDown(false);
  const handleMouseUp = () => setIsDown(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return;
    e.preventDefault();
    draggedRef.current = true;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }

      const userNome = session.user.user_metadata?.nome || "VIP";
      setNome(userNome.split(' ')[0]);

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_clube_tattoo, creditos_acumulados')
        .eq('id', session.user.id)
        .single();

      if (profile?.is_clube_tattoo) setIsClubeTattoo(true);

      // Check club crédito via assinaturas ativas
      const { data: assinaturas } = await supabase
        .from('assinaturas')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('status', 'Ativa')
        .limit(1);

      if (assinaturas && assinaturas.length > 0) setIsClubCredito(true);

      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleBannerClick = (clube: 'tattoo' | 'credito') => {
    if (draggedRef.current) return;
    setModalClube(clube);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff8fb]">
        <p className="font-montserrat text-[#ff1493] font-bold text-xl animate-pulse">Entrando no universo Dyoli...</p>
      </div>
    );
  }

  const beneficiosAtivos = [
    ...(isClubeTattoo ? [{ nome: "Clube Tattoo", cor: "from-[#ff9a9e] to-[#fecfef]", emoji: "🌸" }] : []),
    ...(isClubCredito ? [{ nome: "Club de Crédito", cor: "from-[#a1c4fd] to-[#c2e9fb]", emoji: "💳" }] : []),
  ];

  return (
    <>
      {/* ===== MODAL DE BENEFÍCIOS ===== */}
      {modalClube && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setModalClube(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-t-[32px] p-6 pb-10 shadow-2xl"
            style={{ animation: 'slideUp 0.3s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{modalClube === 'tattoo' ? '🌸' : '💳'}</span>
                <span className="text-xl font-extrabold text-gray-900">
                  {modalClube === 'tattoo' ? 'Clube Tattoo' : 'Club de Crédito'}
                </span>
              </div>
              <button
                onClick={() => setModalClube(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Benefits List */}
            <ul className="space-y-3 mb-6">
              {(modalClube === 'tattoo' ? BENEFICIOS_TATTOO : BENEFICIOS_CREDITO).map((b, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-xl shrink-0 mt-0.5">{b.icon}</span>
                  <div>
                    <strong className="text-gray-800 text-sm block">{b.titulo}</strong>
                    <p className="text-gray-500 text-xs">{b.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Info Tattoo */}
            {modalClube === 'tattoo' && (
              <div className="bg-pink-50 border border-pink-100 rounded-2xl p-3 mb-5 text-sm text-gray-600 font-medium text-center">
                💡 Apenas <strong className="text-[#ff1493]">R$ 54,90/mês</strong> · Resgate após 3 mensalidades
              </div>
            )}

            {/* CTA */}
            <button
              onClick={() => {
                setModalClube(null);
                router.push(`/painel/planos?clube=${modalClube}`);
              }}
              className="w-full bg-gradient-to-r from-[#ff1493] to-[#ff4081] text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-pink-400/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
            >
              Ver planos e assinar <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Botão de Sair fixo no topo direito */}
      <button
        onClick={handleLogout}
        className="absolute top-6 right-6 flex items-center gap-2 text-gray-500 hover:text-[#ff1493] transition-colors font-medium text-sm px-4 py-2 bg-white/50 backdrop-blur-md rounded-full shadow-sm z-20"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Sair</span>
      </button>

      <main className="max-w-2xl mx-auto px-6 pt-12">

        {/* Topo: Boas-vindas */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
            Olá, {nome}!<br />Seja bem-vinda ao <span className="text-[#ff1493]">Dyoli Club</span> ✨
          </h1>
          <p className="text-gray-500 font-medium mt-2 text-base">
            Seu acesso VIP ao universo Dyoli.
          </p>
        </div>

        {/* Clubes Ativos */}
        {beneficiosAtivos.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Seus clubes ativos</p>
            <div className="flex gap-3 flex-wrap">
              {beneficiosAtivos.map((c, i) => (
                <div
                  key={i}
                  className={`bg-gradient-to-r ${c.cor} px-4 py-2 rounded-full flex items-center gap-2 shadow-sm`}
                >
                  <span>{c.emoji}</span>
                  <span className="text-gray-700 font-bold text-sm">{c.nome}</span>
                  <span className="text-[10px] bg-white/60 text-gray-600 px-2 py-0.5 rounded-full font-bold">ATIVO</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Carrossel de Banners */}
        <div className="relative w-full shadow-[0_15px_40px_rgba(255,105,180,0.15)] mb-10 rounded-[32px]">

          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex w-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDown ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            {/* Slide 1: Banner principal */}
            <div className="w-full flex-shrink-0 snap-center relative bg-gradient-to-br from-[#ffd9e8] to-[#f6d6e2] p-8 min-h-[220px] flex items-center rounded-[32px] overflow-hidden">
              <div className="relative z-10 w-[70%]">
                <span className="inline-block bg-white/80 backdrop-blur-md text-[#ff1493] text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest shadow-sm">
                  Conheça Nossos Planos
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-800 leading-tight mb-4 pointer-events-none">
                  Faça parte do Club de Créditos
                </h2>
                <button
                  onClick={() => router.push('/painel/clubes')}
                  className="bg-[#ff4081] text-white px-5 sm:px-6 py-2 sm:py-3 rounded-full font-bold shadow-lg shadow-pink-500/30 hover:-translate-y-1 hover:bg-[#e91e63] transition-all duration-300 text-sm sm:text-base">
                  Ver planos disponíveis
                </button>
              </div>
              <div className="absolute -bottom-4 -right-4 sm:right-0 w-[45%] h-[120%] max-w-[200px] pointer-events-none">
                <img src="/mascote_dyoli.png" alt="Mascote VIP" className="w-full h-full object-contain object-bottom drop-shadow-2xl pointer-events-none" />
              </div>
            </div>

            {/* Slide 2: Clube Tattoo → abre modal de benefícios */}
            <div
              className="w-full h-full min-h-[220px] flex-shrink-0 snap-center cursor-pointer overflow-hidden rounded-[32px] relative"
              onClick={() => handleBannerClick('tattoo')}
            >
              <img src="/banner_clube_tattoo.png" alt="Clube Tattoo" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            </div>

            {/* Slide 3: Club de Crédito → abre modal de benefícios */}
            <div
              className="w-full h-full min-h-[220px] flex-shrink-0 snap-center cursor-pointer overflow-hidden rounded-[32px] relative"
              onClick={() => handleBannerClick('credito')}
            >
              <img src="/banner_clube_credito.png" alt="Club de Crédito" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            </div>
          </div>

          {/* Paginador */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20 pointer-events-none">
            <div className="w-8 h-1.5 rounded-full bg-white/80 shadow-sm"></div>
            <div className="w-2 h-1.5 rounded-full bg-white/40 shadow-sm"></div>
            <div className="w-2 h-1.5 rounded-full bg-white/40 shadow-sm"></div>
          </div>
        </div>

        {/* Cards Premium */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 pb-12">
          <div
            onClick={() => router.push('/painel/sorteios')}
            className="bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(255,20,147,0.1)] transition-all group cursor-pointer flex flex-col items-center text-center"
          >
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <Gift className="text-[#ff1493]" size={24} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">Sorteios</h3>
            <p className="text-gray-400 text-xs font-medium">Participe e ganhe</p>
          </div>

          <div
            onClick={() => router.push('/painel/cupons')}
            className="bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(255,20,147,0.1)] transition-all group cursor-pointer flex flex-col items-center text-center"
          >
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <Ticket className="text-[#ff1493]" size={24} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">Cupons</h3>
            <p className="text-gray-400 text-xs font-medium">Descontos reais</p>
          </div>

          <div
            onClick={() => router.push('/painel/beneficios')}
            className="bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(255,20,147,0.1)] transition-all group cursor-pointer flex flex-col items-center text-center"
          >
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <Star className="text-[#ff1493]" size={24} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">Benefícios</h3>
            <p className="text-gray-400 text-xs font-medium">Vantagens VIP</p>
          </div>

          <div
            onClick={() => router.push('/painel/perfil')}
            className="bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(255,20,147,0.1)] transition-all group cursor-pointer flex flex-col items-center text-center"
          >
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <User className="text-[#ff1493]" size={24} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">Meus Dados</h3>
            <p className="text-gray-400 text-xs font-medium">Gerenciar perfil</p>
          </div>
        </div>

      </main>
    </>
  );
}
