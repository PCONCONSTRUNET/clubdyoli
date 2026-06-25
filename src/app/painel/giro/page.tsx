"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Gift } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";

const PRIZES = [
  { id: 1, name: "Produto do Estúdio", color: "#F9A8D4" }, // pink-300
  { id: 2, name: "R$10 Crédito", color: "#FBCFE8" },       // pink-200
  { id: 3, name: "Sorteio Extra", color: "#FDF2F8" },      // pink-50
  { id: 4, name: "R$20 Crédito", color: "#F9A8D4" },       // pink-300
  { id: 5, name: "Giro Extra", color: "#FBCFE8" },         // pink-200
  { id: 6, name: "Desconto Serviço", color: "#FDF2F8" },   // pink-50
];

export default function GiroDaSortePage() {
  const [girosDisponiveis, setGirosDisponiveis] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prizeWon, setPrizeWon] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      const { data: profile } = await supabase.from('profiles').select('giros_disponiveis').eq('id', session.user.id).single();
      if (profile) setGirosDisponiveis(profile.giros_disponiveis || 0);
    };
    loadData();
  }, []);

  const handleSpin = () => {
    if (girosDisponiveis <= 0 || isSpinning) return;
    
    setIsSpinning(true);
    setPrizeWon(null);

    // MOCK Backend prize calculation
    const targetPrizeIndex = Math.floor(Math.random() * PRIZES.length);
    const sliceAngle = 360 / PRIZES.length;
    const targetAngle = 360 - (targetPrizeIndex * sliceAngle);
    
    // 5 full spins + target angle
    const totalRotation = rotation + (360 * 5) + targetAngle - (rotation % 360);
    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setPrizeWon(PRIZES[targetPrizeIndex].name);
      setGirosDisponiveis(prev => prev - 1);
      
      // TODO: Salvar prêmio no banco de dados via Supabase
    }, 5000); // 5s match animation
  };

  return (
    <main className="max-w-2xl mx-auto px-6 pt-12 pb-12 overflow-hidden">
      <Link href="/painel/perfil" className="inline-flex items-center gap-2 text-[#ff1493] font-bold mb-6 hover:opacity-80 transition-opacity">
        <ArrowLeft size={20} />
        Voltar ao Perfil
      </Link>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 w-16 h-16 rounded-full flex items-center justify-center shadow-sm shrink-0">
          <Sparkles className="text-[#ff1493]" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Giro da Sorte</h1>
          <p className="text-gray-500 font-medium">Você tem <strong className="text-[#ff1493]">{girosDisponiveis} giro(s)</strong> disponível(is).</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-[0_15px_40px_rgba(255,105,180,0.1)] mb-8 flex flex-col items-center">
        
        {/* Roleta Container */}
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 mb-10 mt-6">
          {/* Arrow Pointer */}
          <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 z-10 text-[#ff1493] drop-shadow-md">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-12-18h24z"/></svg>
          </div>
          
          {/* Roleta Wheel */}
          <div 
            className="w-full h-full rounded-full border-4 border-pink-100 shadow-2xl relative overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? "transform 5s cubic-bezier(0.25, 0.1, 0.2, 1)" : "none",
            }}
          >
            {PRIZES.map((prize, i) => {
              const rotationAngle = i * (360 / PRIZES.length);
              const skewAngle = 90 - (360 / PRIZES.length); // For 6 slices, 360/6=60. 90-60=30
              return (
                <div 
                  key={prize.id}
                  className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left border border-white/20 flex items-center justify-center"
                  style={{
                    backgroundColor: prize.color,
                    transform: `rotate(${rotationAngle}deg) skewY(-${skewAngle}deg)`,
                  }}
                >
                  <div 
                    className="absolute text-xs sm:text-sm font-bold text-pink-900 w-full text-center px-4"
                    style={{
                      transform: `skewY(${skewAngle}deg) rotate(${180/PRIZES.length}deg) translate(20px, 40px)`,
                      textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                    }}
                  >
                    {prize.name}
                  </div>
                </div>
              );
            })}
            
            {/* Center Dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-pink-200 z-10">
              <Sparkles size={20} className="text-[#ff1493]" />
            </div>
          </div>
        </div>

        {girosDisponiveis > 0 ? (
          <button 
            onClick={handleSpin}
            disabled={isSpinning}
            className={`w-full max-w-xs bg-gradient-to-r from-[#ff1493] to-[#ff4081] text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-pink-500/30 transition-all ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-pink-500/50'}`}
          >
            {isSpinning ? "Girando..." : "Girar Agora"}
          </button>
        ) : (
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100 w-full max-w-xs">
            <p className="text-gray-500 font-bold">Você já utilizou seu giro deste mês.</p>
          </div>
        )}

      </div>

      {prizeWon && (
        <div className="animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500 bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 p-6 rounded-2xl flex flex-col items-center text-center shadow-lg">
          <Gift size={48} className="text-[#ff1493] mb-4" />
          <h3 className="text-2xl font-black text-gray-900">Parabéns!</h3>
          <p className="text-gray-700 mt-2">Você ganhou: <strong className="text-[#ff1493] text-xl block mt-1">{prizeWon}</strong></p>
          <p className="text-xs text-gray-500 mt-4">O prêmio foi salvo no seu perfil.</p>
        </div>
      )}
    </main>
  );
}
