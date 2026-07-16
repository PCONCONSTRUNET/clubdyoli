"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Ticket } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

const PRIZES = [
  { id: 1, name: "5% OFF", color: "#F9A8D4" }, // pink-300
  { id: 2, name: "7% OFF", color: "#FBCFE8" }, // pink-200
  { id: 3, name: "10% OFF", color: "#FDF2F8" }, // pink-50
  { id: 4, name: "15% OFF", color: "#F9A8D4" }, // pink-300
  { id: 5, name: "5% OFF", color: "#FBCFE8" }, // pink-200
  { id: 6, name: "7% OFF", color: "#FDF2F8" }, // pink-50
  { id: 7, name: "10% OFF", color: "#F9A8D4" }, // pink-300
  { id: 8, name: "15% OFF", color: "#FBCFE8" }, // pink-200
];

export default function GiroCuponsPage() {
  const [girosDisponiveis, setGirosDisponiveis] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prizeWon, setPrizeWon] = useState<string | null>(null);
  const [prizes, setPrizes] = useState<any[]>(PRIZES); // Fallback until loaded

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: profile } = await supabase.from('profiles').select('giros_disponiveis').eq('id', session.user.id).single();
      if (profile) setGirosDisponiveis(profile.giros_disponiveis);

      const { data: dbPrizes } = await supabase.from('premios_roleta').select('*').eq('ativo', true).order('peso', { ascending: false });
      if (dbPrizes && dbPrizes.length > 0) {
        // Map dbPrizes to visual prizes. We need at least 8 slices for the wheel to look good.
        const mappedPrizes = dbPrizes.map((p, i) => ({
          id: p.id,
          name: p.nome,
          color: ["#F9A8D4", "#FBCFE8", "#FDF2F8"][i % 3] // Alternate pink colors
        }));
        
        // If we have less than 8 prizes, we duplicate them to fill the wheel visually
        const filledPrizes = [];
        let i = 0;
        while (filledPrizes.length < 8) {
          filledPrizes.push({ ...mappedPrizes[i % mappedPrizes.length], vizId: filledPrizes.length });
          i++;
        }
        setPrizes(filledPrizes);
      }
    }
    loadData();
  }, []);

  const handleSpin = () => {
    if (girosDisponiveis <= 0 || isSpinning) return;

    // ===== SISTEMA DE ÁUDIO =====
    let audioCtx: any = null;
    let spinSource: any = null;
    let spinGain: any = null;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      // --- Som de girar: ruído branco + filtro passa-banda ---
      const bufferSize = audioCtx.sampleRate * 5; // 5 segundos
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      spinSource = audioCtx.createBufferSource();
      spinSource.buffer = buffer;

      // Filtro para dar sensação de "vento" da roleta girando
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, audioCtx.currentTime);      // começa rápido / agudo
      filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 4.5); // vai ficando grave ao parar
      filter.Q.value = 2;

      spinGain = audioCtx.createGain();
      spinGain.gain.setValueAtTime(0, audioCtx.currentTime);
      spinGain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.3);   // fade in
      spinGain.gain.setValueAtTime(0.25, audioCtx.currentTime + 3.5);            // sustain
      spinGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 5); // fade out ao parar

      spinSource.connect(filter);
      filter.connect(spinGain);
      spinGain.connect(audioCtx.destination);
      spinSource.start();

      // --- Ticks desacelerando (cliques da roleta) ---
      let ticks = 0;
      const maxTicks = 30;
      const playTick = () => {
        if (!audioCtx || ticks >= maxTicks) return;
        try {
          const osc2 = audioCtx.createOscillator();
          const g2 = audioCtx.createGain();
          osc2.type = 'square';
          const tickFreq = 900 - (ticks / maxTicks) * 600; // agudo -> grave
          osc2.frequency.setValueAtTime(tickFreq, audioCtx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(tickFreq * 0.5, audioCtx.currentTime + 0.04);
          g2.gain.setValueAtTime(0.08, audioCtx.currentTime);
          g2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
          osc2.connect(g2); g2.connect(audioCtx.destination);
          osc2.start(); osc2.stop(audioCtx.currentTime + 0.04);
        } catch(e) {}
        ticks++;
        const progress = ticks / maxTicks;
        const delay = 50 + Math.pow(progress, 2.5) * 450; // desacelera naturalmente
        setTimeout(playTick, delay);
      };
      playTick();

    } catch(e) {}

    const playWinSound = () => {
      if (!audioCtx) return;
      try {
        // Fanfarra de vitória com notas em sequência
        const notes = [
          { freq: 523.25, start: 0 },
          { freq: 659.25, start: 0.12 },
          { freq: 783.99, start: 0.24 },
          { freq: 1046.50, start: 0.36 },
        ];
        notes.forEach(({ freq, start }) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
          g.gain.setValueAtTime(0, audioCtx.currentTime + start);
          g.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + start + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + 0.5);
          o.connect(g); g.connect(audioCtx.destination);
          o.start(audioCtx.currentTime + start);
          o.stop(audioCtx.currentTime + start + 0.5);
        });
      } catch(e) {}
    };
    // ===== FIM ÁUDIO =====

    setIsSpinning(true);
    setPrizeWon(null);

    // MOCK Backend prize calculation (REMOVED)
    // Now hitting the real API endpoint
    const spinAndSave = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsSpinning(false);
        return;
      }

      try {
        const res = await fetch('/api/cupons/giro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao girar a roleta");

        const targetPrizeIndex = prizes.findIndex(c => c.id === data.premioId);
        if (targetPrizeIndex === -1) throw new Error("Prêmio não encontrado na roleta");

        const sliceAngle = 360 / prizes.length;
        const targetAngle = 360 - (targetPrizeIndex * sliceAngle);
        
        // 5 full spins + target angle
        const totalRotation = rotation + (360 * 5) + targetAngle - (rotation % 360);
        setRotation(totalRotation);

        setTimeout(() => {
          setIsSpinning(false);
          setPrizeWon(prizes[targetPrizeIndex].name);
          setGirosDisponiveis(prev => prev - 1);
          playWinSound();
        }, 5000);
      } catch (err: any) {
        alert(err.message);
        setIsSpinning(false);
      }
    };

    spinAndSave();
  };

  return (
    <main className="max-w-2xl mx-auto px-6 pt-12 pb-12 overflow-hidden">
      <Link href="/painel" className="inline-flex items-center gap-2 text-[#ff1493] font-bold mb-6 hover:opacity-80 transition-opacity">
        <ArrowLeft size={20} />
        Voltar ao Painel
      </Link>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 w-16 h-16 rounded-full flex items-center justify-center shadow-sm shrink-0">
          <Ticket className="text-[#ff1493]" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Roleta de Cupons</h1>
          <p className="text-gray-500 font-medium">Gire para ganhar um desconto exclusivo no estúdio!</p>
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
            {/* Background Slices */}
            <div 
              className="absolute inset-0" 
              style={{
                background: `conic-gradient(${prizes.map((p, i) => `${p.color} ${i * 45}deg ${(i+1) * 45}deg`).join(', ')})`,
                transform: 'rotate(-22.5deg)'
              }}
            />

            {/* Separator Lines */}
            {prizes.map((_, i) => (
              <div 
                key={`line-${i}`}
                className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-white/40 origin-left -mt-[1px] z-0"
                style={{ transform: `rotate(${i * 45 - 112.5}deg)` }}
              />
            ))}

            {/* Texts */}
            {prizes.map((prize, i) => (
              <div 
                key={prize.vizId || prize.id}
                className="absolute top-1/2 left-1/2 w-[45%] h-12 -mt-6 z-10 origin-left"
                style={{
                  transform: `rotate(${i * 45 - 90}deg)`,
                }}
              >
                <div 
                  className="absolute left-10 sm:left-12 top-1/2 -translate-y-1/2 font-black text-pink-900 text-lg sm:text-xl text-left leading-tight w-[calc(100%-40px)]"
                  style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
                >
                  {prize.name}
                </div>
              </div>
            ))}
            
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
            {isSpinning ? "Girando..." : "Girar Roleta"}
          </button>
        ) : (
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100 w-full max-w-xs">
            <p className="text-gray-500 font-bold">Você não tem giros de cupons disponíveis.</p>
          </div>
        )}

      </div>

      {prizeWon && (
        <div className="animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500 bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 p-6 rounded-2xl flex flex-col items-center text-center shadow-lg">
          <Ticket size={48} className="text-[#ff1493] mb-4" />
          <h3 className="text-2xl font-black text-gray-900">Parabéns!</h3>
          <p className="text-gray-700 mt-2">Você ganhou um cupom de: <strong className="text-[#ff1493] text-2xl block mt-1">{prizeWon}</strong></p>
          <p className="text-xs text-gray-500 mt-4">O cupom foi adicionado à sua aba de Cupons.</p>
          <Link href="/painel/cupons" className="mt-4 bg-white text-[#ff1493] font-bold px-6 py-2 rounded-full shadow-sm hover:bg-pink-50 transition-colors">
            Ver meus cupons
          </Link>
        </div>
      )}
    </main>
  );
}
