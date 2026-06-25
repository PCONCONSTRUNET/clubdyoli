"use client";

import { useState } from "react";
import { Sparkles, Ticket } from "lucide-react";
import { supabase } from "../lib/supabase";

const COUPONS = [
  { id: 1, text: "5%", color: "#FBCFE8", type: 5 },
  { id: 2, text: "7%", color: "#F9A8D4", type: 7 },
  { id: 3, text: "10%", color: "#F472B6", type: 10 },
  { id: 4, text: "15%", color: "#EC4899", type: 15 },
  { id: 5, text: "5%", color: "#FBCFE8", type: 5 },
  { id: 6, text: "7%", color: "#F9A8D4", type: 7 },
];

export default function RoletaCuponsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [couponWon, setCouponWon] = useState<any>(null);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setCouponWon(null);

    // MOCK Backend prize calculation
    const targetPrizeIndex = Math.floor(Math.random() * COUPONS.length);
    const sliceAngle = 360 / COUPONS.length;
    const targetAngle = 360 - (targetPrizeIndex * sliceAngle);
    
    // 5 full spins + target angle
    const totalRotation = rotation + (360 * 5) + targetAngle - (rotation % 360);
    setRotation(totalRotation);

    setTimeout(async () => {
      setIsSpinning(false);
      const won = COUPONS[targetPrizeIndex];
      setCouponWon(won);
      
      // TODO: Salvar cupom na tabela cupons e user_cupons no backend
    }, 5000); 
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] p-6 sm:p-8 w-full max-w-md shadow-2xl relative flex flex-col items-center text-center">
        
        {/* Botão Fechar só aparece se não estiver girando e já tiver ganho ou forçado */}
        {!isSpinning && couponWon && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-[#ff1493] transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-50"
          >
            ✕
          </button>
        )}

        <div className="mb-4">
          <h3 className="text-2xl font-extrabold text-[#ff1493]">Roleta de Cupons!</h3>
          <p className="text-gray-500 text-sm mt-1">Como cliente VIP, você ganhou a chance de rodar a roleta e garantir um desconto extra na sua próxima visita.</p>
        </div>

        {/* Roleta Container */}
        <div className="relative w-64 h-64 mb-6 mt-4">
          <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-10 text-[#ff1493] drop-shadow-md">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-12-18h24z"/></svg>
          </div>
          
          <div 
            className="w-full h-full rounded-full border-4 border-pink-100 shadow-xl relative overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? "transform 5s cubic-bezier(0.25, 0.1, 0.2, 1)" : "none",
            }}
          >
            {COUPONS.map((prize, i) => {
              const rotationAngle = i * (360 / COUPONS.length);
              const skewAngle = 90 - (360 / COUPONS.length); // 90 - 60 = 30
              return (
                <div 
                  key={i}
                  className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left border border-white/20 flex items-center justify-center"
                  style={{
                    backgroundColor: prize.color,
                    transform: `rotate(${rotationAngle}deg) skewY(-${skewAngle}deg)`,
                  }}
                >
                  <div 
                    className="absolute text-sm font-black text-white w-full text-center px-4"
                    style={{
                      transform: `skewY(${skewAngle}deg) rotate(${180/COUPONS.length}deg) translate(20px, 40px)`,
                      textShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}
                  >
                    {prize.text}
                  </div>
                </div>
              );
            })}
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-pink-200 z-10">
              <Sparkles size={16} className="text-[#ff1493]" />
            </div>
          </div>
        </div>

        {!couponWon ? (
          <button 
            onClick={handleSpin}
            disabled={isSpinning}
            className={`w-full bg-gradient-to-r from-[#ff1493] to-[#ff4081] text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-pink-500/30 transition-all ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-pink-500/50'}`}
          >
            {isSpinning ? "Girando..." : "Girar Roleta"}
          </button>
        ) : (
          <div className="w-full animate-in zoom-in duration-300">
            <div className="bg-pink-50 border border-pink-200 p-4 rounded-2xl mb-4">
              <Ticket className="mx-auto text-[#ff1493] mb-2" size={24} />
              <p className="text-gray-700 font-bold mb-1">Você ganhou um cupom de</p>
              <div className="text-3xl font-black text-[#ff1493]">{couponWon.text} OFF</div>
            </div>
            <button 
              onClick={onClose}
              className="w-full bg-gray-900 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-gray-800 transition-colors"
            >
              Ir para Meus Cupons
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
