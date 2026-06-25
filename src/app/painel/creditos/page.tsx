"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Coins, Clock, ArrowRightCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function MeusCreditosPage() {
  const [creditos, setCreditos] = useState(0);
  const [fidelidadeMeses, setFidelidadeMeses] = useState(0);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase.from('profiles').select('creditos_acumulados').eq('id', session.user.id).single();
      const { data: fidelidade } = await supabase.from('fidelidade_usuarios').select('meses_consecutivos').eq('user_id', session.user.id).single();
      const { data: hist } = await supabase.from('historico_creditos').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });

      if (profile) setCreditos(profile.creditos_acumulados || 0);
      if (fidelidade) setFidelidadeMeses(fidelidade.meses_consecutivos || 0);
      if (hist) setHistorico(hist);

      setLoading(false);
    };
    loadData();
  }, []);

  const podeResgatar = fidelidadeMeses >= 3;
  const mesesFaltantes = 3 - fidelidadeMeses;

  return (
    <main className="max-w-2xl mx-auto px-6 pt-12 pb-12">
      <Link href="/painel/perfil" className="inline-flex items-center gap-2 text-[#ff1493] font-bold mb-6 hover:opacity-80 transition-opacity">
        <ArrowLeft size={20} />
        Voltar ao Perfil
      </Link>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 w-16 h-16 rounded-full flex items-center justify-center shadow-sm shrink-0">
          <Coins className="text-[#ff1493]" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Meus Créditos</h1>
          <p className="text-gray-500 font-medium">Clube Tattoo VIP</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-white/60 shadow-[0_15px_40px_rgba(255,105,180,0.1)] mb-8">
        <div className="text-center mb-8">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Saldo Atual</span>
          <div className="text-5xl font-black text-[#ff1493] mt-2">R$ {creditos.toFixed(2).replace('.', ',')}</div>
        </div>

        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-6 text-center">
          {podeResgatar ? (
            <div>
              <p className="text-green-600 font-bold mb-4">Você já tem acesso ao resgate!</p>
              <button className="bg-gradient-to-r from-[#ff1493] to-[#ff4081] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform">
                Solicitar Resgate
              </button>
            </div>
          ) : (
            <div>
              <Clock className="mx-auto text-pink-400 mb-2" size={32} />
              <p className="text-gray-700 font-medium">Faltam <strong className="text-[#ff1493]">{mesesFaltantes} meses</strong> consecutivos para liberar seu resgate.</p>
              <p className="text-xs text-gray-500 mt-2">O resgate é liberado após 3 mensalidades consecutivas pagas.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-white/60 shadow-[0_15px_40px_rgba(255,105,180,0.1)]">
        <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-2">
          <ArrowRightCircle className="text-[#ff1493]" size={20} /> Histórico de Transações
        </h3>
        
        {loading ? (
          <p className="text-center text-gray-500 py-4">Carregando...</p>
        ) : historico.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Nenhum histórico encontrado.</p>
        ) : (
          <ul className="space-y-4">
            {historico.map(item => (
              <li key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <strong className="text-sm text-gray-700 block">{item.descricao}</strong>
                  <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <span className={`font-black ${item.tipo === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                  {item.tipo === 'entrada' ? '+' : '-'} R$ {Number(item.valor).toFixed(2).replace('.', ',')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
