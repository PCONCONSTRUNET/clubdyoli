"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Award, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function FidelidadePage() {
  const [fidelidadeMeses, setFidelidadeMeses] = useState(0);
  const [beneficios, setBeneficios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      const { data: fidelidade } = await supabase.from('fidelidade_usuarios').select('meses_consecutivos').eq('user_id', session.user.id).single();
      const { data: benefs } = await supabase.from('fidelidade_beneficios').select('*').order('meses', { ascending: true });

      if (fidelidade) setFidelidadeMeses(fidelidade.meses_consecutivos || 0);
      if (benefs) setBeneficios(benefs);
      
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-6 pt-12 pb-12">
      <Link href="/painel/perfil" className="inline-flex items-center gap-2 text-[#ff1493] font-bold mb-6 hover:opacity-80 transition-opacity">
        <ArrowLeft size={20} />
        Voltar ao Perfil
      </Link>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 w-16 h-16 rounded-full flex items-center justify-center shadow-sm shrink-0">
          <Award className="text-[#ff1493]" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Minha Fidelidade</h1>
          <p className="text-gray-500 font-medium">Você tem <strong className="text-[#ff1493]">{fidelidadeMeses} meses</strong> consecutivos no Clube Tattoo.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-white/60 shadow-[0_15px_40px_rgba(255,105,180,0.1)]">
        <h3 className="font-bold text-xl text-gray-900 mb-8">Linha do Tempo de Benefícios</h3>
        
        {loading ? (
          <p className="text-center text-gray-500 py-4">Carregando...</p>
        ) : beneficios.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Nenhum benefício cadastrado.</p>
        ) : (
          <div className="relative pl-6 border-l-2 border-pink-100 space-y-8">
            {beneficios.map((b, i) => {
              const desbloqueado = fidelidadeMeses >= b.meses;
              return (
                <div key={b.id} className="relative">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[35px] top-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-md ${desbloqueado ? 'bg-[#ff1493]' : 'bg-gray-200'}`}>
                    {desbloqueado ? <CheckCircle2 size={16} className="text-white" /> : <Lock size={14} className="text-gray-400" />}
                  </div>
                  
                  <div className={`p-5 rounded-2xl border transition-all ${desbloqueado ? 'bg-pink-50 border-pink-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-black text-lg ${desbloqueado ? 'text-[#ff1493]' : 'text-gray-500'}`}>{b.titulo}</h4>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${desbloqueado ? 'bg-pink-200 text-pink-800' : 'bg-gray-200 text-gray-600'}`}>
                        {b.meses} Meses
                      </span>
                    </div>
                    <p className={`text-sm ${desbloqueado ? 'text-gray-700' : 'text-gray-400'}`}>{b.descricao}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
