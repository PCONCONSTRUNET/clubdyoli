"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Gift, Ticket, Star, User, Home, LogOut } from "lucide-react";

export default function PainelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState<string>("VIP");

  // Drag Carousel State
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Velocidade do arraste
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
      } else {
        // Obter nome do usuário do user metadata
        const userNome = session.user.user_metadata?.nome || "VIP";
        setNome(userNome.split(' ')[0]); // Pega o primeiro nome
        setLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff8fb]">
        <p className="font-montserrat text-[#ff1493] font-bold text-xl animate-pulse">Entrando no universo Dyoli...</p>
      </div>
    );
  }

  return (
    <>
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
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
            Olá, {nome}!<br />Seja bem-vinda ao <span className="text-[#ff1493]">Dyoli Club</span> ✨
          </h1>
          <p className="text-gray-500 font-medium mt-2 text-base">
            Seu acesso VIP ao universo Dyoli.
          </p>
        </div>

        {/* Carrossel de Banners */}
        <div className="relative w-full rounded-[32px] overflow-hidden shadow-[0_15px_40px_rgba(255,105,180,0.15)] mb-10 group bg-gradient-to-br from-[#ffd9e8] to-[#f6d6e2]">
          
          <div 
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:h-0 [-ms-overflow-style:none] [scrollbar-width:none] items-stretch ${isDown ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            
            {/* Slide 1: Banner Original */}
            <div className="min-w-full snap-center relative bg-gradient-to-br from-[#ffd9e8] to-[#f6d6e2] p-8 min-h-[220px] flex items-center shrink-0">
              <div className="relative z-10 w-[70%]">
                <span className="inline-block bg-white/80 backdrop-blur-md text-[#ff1493] text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest shadow-sm">
                  Conheça Nossos Planos
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-800 leading-tight mb-4 pointer-events-none">
                  Faça parte do Club de Créditos
                </h2>
                <button 
                  onClick={() => router.push('/painel/planos')}
                  className="bg-[#ff4081] text-white px-5 sm:px-6 py-2 sm:py-3 rounded-full font-bold shadow-lg shadow-pink-500/30 hover:-translate-y-1 hover:bg-[#e91e63] transition-all duration-300 text-sm sm:text-base">
                  Ver planos disponíveis
                </button>
              </div>

              {/* Mascote Absolute Position */}
              <div className="absolute -bottom-4 -right-4 sm:right-0 w-[45%] h-[120%] max-w-[200px] pointer-events-none">
                <img 
                  src="/mascote_dyoli.png" 
                  alt="Mascote VIP" 
                  className="w-full h-full object-contain object-bottom drop-shadow-2xl pointer-events-none"
                />
              </div>
            </div>

            {/* Slide 2: Banner Imagens Customizadas (PC e Mobile) */}
            <div 
              className="min-w-full snap-center relative min-h-[220px] shrink-0 overflow-hidden" 
              onClick={() => {
                // Previne clique caso seja um arraste (drag)
                if(!isDown) router.push('/painel/planos');
              }}
            >
              {/* Imagem para Computador */}
              <img 
                src="/club_pc.png" 
                alt="Banner Club" 
                className="hidden sm:block w-full h-full object-cover scale-[1.15] absolute inset-0 pointer-events-none" 
              />
              {/* Imagem para Celular */}
              <img 
                src="/creditos_mobile.png" 
                alt="Banner Club Mobile" 
                className="block sm:hidden w-full h-full object-cover scale-[1.15] absolute inset-0 pointer-events-none" 
              />
            </div>

            {/* Slide 3: Banner Sorteio (Mobile) */}
            <div 
              className="min-w-full snap-center relative min-h-[220px] shrink-0 overflow-hidden" 
              onClick={() => {
                if(!isDown) router.push('/painel/sorteios');
              }}
            >
              <img 
                src="/sorteio_mobile.png" 
                alt="Banner Sorteio" 
                className="w-full h-full object-cover scale-[1.05] absolute inset-0 pointer-events-none" 
              />
            </div>

          </div>

          {/* Dica visual de arrastar (Paginadores) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20 pointer-events-none">
            <div className="w-8 h-1.5 rounded-full bg-white/80 shadow-sm"></div>
            <div className="w-2 h-1.5 rounded-full bg-white/40 shadow-sm"></div>
            <div className="w-2 h-1.5 rounded-full bg-white/40 shadow-sm"></div>
          </div>
        </div>

        {/* Cards Premium */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: Sorteios */}
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

          {/* Card 2: Cupons */}
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

          {/* Card 3: Benefícios */}
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

          {/* Card 4: Meus Dados */}
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
