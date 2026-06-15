"use client";

import { useState, useEffect } from "react";
import { Gift, ArrowLeft, Calendar, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function SorteiosPage() {
  const [sorteios, setSorteios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSorteiosAtivos = async () => {
      const { data, error } = await supabase
        .from('sorteios')
        .select('*')
        .eq('status', 'Ativo')
        .order('data_inicio', { ascending: false });

      if (!error && data) {
        setSorteios(data);
      }
      setLoading(false);
    };

    fetchSorteiosAtivos();
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-6 pt-12 pb-20">
      <Link href="/painel" className="inline-flex items-center gap-2 text-[#ff1493] font-bold mb-6 hover:opacity-80 transition-opacity">
        <ArrowLeft size={20} />
        Voltar
      </Link>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 w-16 h-16 rounded-full flex items-center justify-center shadow-sm">
          <Gift className="text-[#ff1493]" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Sorteios</h1>
          <p className="text-gray-500 font-medium mt-1">Participe e ganhe prêmios exclusivos</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500 font-bold animate-pulse">Buscando sorteios...</div>
      ) : sorteios.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-[0_15px_40px_rgba(255,105,180,0.1)] text-center">
          <div className="text-6xl mb-4">🎁</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Nenhum sorteio ativo</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Fique ligada! Em breve lançaremos novos sorteios incríveis para as assinantes do Dyoli Club.</p>
          <button className="bg-gray-100 text-gray-400 px-6 py-3 rounded-full font-bold cursor-not-allowed">
            Aguarde novidades
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sorteios.map(sorteio => (
            <div key={sorteio.id} className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/60 shadow-[0_15px_40px_rgba(0,0,0,0.05)] overflow-hidden">
              {/* Imagem */}
              <div className="h-56 bg-gray-100 relative">
                {sorteio.imagem_url ? (
                  <img src={sorteio.imagem_url} alt={sorteio.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-pink-50/50">
                    <ImageIcon size={48} />
                    <span className="font-medium mt-2">Sem imagem</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[#ff1493] text-sm font-bold shadow-sm">
                  Ativo
                </div>
              </div>

              {/* Informações */}
              <div className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{sorteio.titulo}</h2>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  {sorteio.descricao}
                </p>

                <div className="bg-gradient-to-r from-pink-50 to-pink-100/50 p-5 rounded-2xl border border-pink-100 mb-6">
                  <div className="text-sm text-pink-600 font-bold uppercase tracking-wider mb-1">Prêmio do Sorteio</div>
                  <div className="text-xl font-black text-gray-900">{sorteio.premio}</div>
                </div>

                <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-50 p-3 rounded-xl">
                  <Calendar size={18} className="text-[#ff1493]" />
                  <span>
                    Válido até: <strong className="text-gray-700">{new Date(sorteio.data_fim).toLocaleDateString('pt-BR')}</strong>
                  </span>
                </div>

                {/* Botão de Ação */}
                <button className="w-full mt-6 bg-[#ff1493] text-white px-6 py-4 rounded-xl font-bold shadow-[0_8px_20px_-6px_rgba(255,20,147,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(255,20,147,0.6)] transition-all hover:-translate-y-1 text-lg">
                  Estou Participando!
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
