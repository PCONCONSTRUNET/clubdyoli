"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Gift, Star, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function PlanosPage() {
  const router = useRouter();
  const [planos, setPlanos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assinandoId, setAssinandoId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlanos() {
      // Puxar as opções de valores dos planos
      const { data, error } = await supabase
        .from('plano_opcoes')
        .select('*, planos(nome)');
      
      if (data && !error) {
        // Formatar para o formato esperado pela UI
        const cores = [
          "from-[#ff9a9e] to-[#fecfef]",
          "from-[#a1c4fd] to-[#c2e9fb]",
          "from-[#f6d365] to-[#fda085]",
          "from-[#d4fc79] to-[#96e6a1]"
        ];
        
        const formated = data.sort((a, b) => a.valor - b.valor).map((p, idx) => ({
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
    
    // Obter sessão atual
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Você precisa estar logado para assinar.");
      setAssinandoId(null);
      return;
    }

    const userId = session.user.id;

    try {
      // 1. Criar a Assinatura (Simulação de sucesso)
      await supabase.from('assinaturas').insert([{
        user_id: userId,
        plano_opcao_id: plano.id,
        status: 'Ativa'
      }]);

      // 2. Gerar o Cupom Automático (se configurado)
      if (plano.cupom_porcentagem > 0) {
        const codigoCupom = `VIP${plano.cupom_porcentagem}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
        
        // Calcula a data de validade
        const dataValidade = new Date();
        dataValidade.setDate(dataValidade.getDate() + plano.cupom_validade_dias);
        
        // Insere o cupom
        const { data: cupomData, error: cupomError } = await supabase.from('cupons').insert([{
          codigo: codigoCupom,
          porcentagem_desconto: plano.cupom_porcentagem,
          validade: dataValidade.toLocaleDateString('pt-BR'),
          total_usos: 1,
          status: 'Ativo'
        }]).select().single();

        if (cupomData && !cupomError) {
          // Vincula ao usuário
          await supabase.from('user_cupons').insert([{
            user_id: userId,
            cupom_id: cupomData.id
          }]);
        }
      }

      alert("Plano assinado com sucesso! Seus cupons foram gerados e estão disponíveis na aba Cupons.");
      router.push('/painel/cupons');

    } catch (error) {
      console.error("Erro ao assinar:", error);
      alert("Erro ao processar assinatura.");
    } finally {
      setAssinandoId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-[#ff1493] font-bold animate-pulse">Carregando planos...</p></div>;
  }

  return (
    <main className="max-w-5xl mx-auto px-6 pt-12 pb-20">
      <Link href="/painel" className="inline-flex items-center gap-2 text-[#ff1493] font-bold mb-6 hover:opacity-80 transition-opacity">
        <ArrowLeft size={20} />
        Voltar
      </Link>
      
      <div className="text-center mb-12">
        <span className="inline-block bg-[#ff1493]/10 text-[#ff1493] font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest text-sm">
          Novo
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          Club de <span className="text-[#ff1493] relative inline-block">
            Créditos
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0 10 Q 50 20 100 10" fill="transparent" stroke="#ff1493" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </span>
        </h1>
        <p className="text-gray-500 font-medium text-lg mt-4">
          Escolha a opção de valor para pagar mensal e aproveite vantagens exclusivas.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {planos.map((plano, idx) => (
          <div 
            key={idx} 
            className="bg-white/90 backdrop-blur-xl rounded-[20px] sm:rounded-[32px] border border-white shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(255,20,147,0.15)] overflow-hidden flex flex-col hover:-translate-y-2 transition-all duration-300 group relative"
          >


            {/* Header do Card */}
            <div className={`bg-gradient-to-br ${plano.cor} p-4 sm:p-8 text-center text-gray-800 relative overflow-hidden z-10 shadow-sm`}>
              {/* Marca D'água no Header */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40 z-0 mix-blend-overlay">
                <img src="/logo.png" alt="" className="w-[140%] h-[140%] object-contain grayscale" />
              </div>

              <div className="relative z-10">
                <h2 className="text-base sm:text-2xl font-black mb-1 sm:mb-2 uppercase tracking-wide opacity-90 leading-tight">{plano.nome}</h2>
                <div className="flex justify-center items-end gap-1">
                  <span className="text-xs sm:text-lg font-bold mb-1 sm:mb-1.5 opacity-80">R$</span>
                  <span className="text-3xl sm:text-5xl font-black tracking-tighter">{plano.preco.split(',')[0]}</span>
                  <span className="text-sm sm:text-xl font-bold mb-0.5 sm:mb-1 opacity-80">,{plano.preco.split(',')[1]}</span>
                </div>
                <span className="text-[10px] sm:text-sm font-medium opacity-70 mt-1 block">por mês</span>
              </div>
              <div className="absolute top-0 left-0 w-full h-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500 z-20"></div>
            </div>
            
            {/* Corpo do Card */}
            <div className="p-4 sm:p-8 flex-1 flex flex-col bg-white/50 relative z-10 overflow-hidden">
              <ul className="space-y-3 sm:space-y-5 mb-5 sm:mb-8 flex-1 relative z-10">
                <li className="flex gap-2 sm:gap-4 items-start">
                  <div className="bg-[#ff1493]/10 p-1 sm:p-1.5 rounded-full mt-0.5 shrink-0">
                    <CheckCircle2 className="text-[#ff1493] w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-gray-700 font-medium leading-tight text-[11px] sm:text-base">
                    <strong className="text-[#ff1493] text-[13px] sm:text-lg">{plano.desconto}</strong> de Desconto em procedimentos no estúdio
                  </span>
                </li>
                {plano.cupom_porcentagem > 0 && (
                  <li className="flex gap-2 sm:gap-4 items-start">
                    <div className="bg-emerald-100 p-1 sm:p-1.5 rounded-full mt-0.5 shrink-0">
                      <Gift className="text-emerald-600 w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-gray-700 font-medium leading-tight text-[11px] sm:text-base">
                      Cupom automático de <strong className="text-emerald-600">{plano.cupom_porcentagem}% OFF</strong> na hora
                    </span>
                  </li>
                )}
                <li className="flex gap-2 sm:gap-4 items-start">
                  <div className="bg-[#ff1493]/10 p-1 sm:p-1.5 rounded-full mt-0.5 shrink-0">
                    <Gift className="text-[#ff1493] w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-gray-700 font-medium leading-tight text-[11px] sm:text-base">
                    Direito a <strong className="text-gray-900">sorteios mensais</strong>
                  </span>
                </li>
                {plano.prioridade && (
                  <li className="flex gap-2 sm:gap-4 items-start">
                    <div className="bg-[#ff1493]/10 p-1 sm:p-1.5 rounded-full mt-0.5 shrink-0">
                      <Star className="text-[#ff1493] w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-gray-700 font-medium leading-tight text-[11px] sm:text-base">
                      <strong className="text-gray-900">Prioridade</strong> na agenda
                    </span>
                  </li>
                )}
              </ul>
              <button 
                onClick={() => handleAssinar(plano)}
                disabled={assinandoId === plano.id}
                className="w-full bg-gray-900 text-white py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-lg hover:bg-[#ff1493] hover:shadow-pink-500/30 transition-all duration-300 transform active:scale-95 uppercase tracking-wider text-[10px] sm:text-sm relative z-10 disabled:opacity-50"
              >
                {assinandoId === plano.id ? "Assinando..." : "Assinar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-white/90 backdrop-blur-xl p-6 sm:p-10 rounded-[32px] border border-white shadow-[0_15px_40px_rgba(0,0,0,0.06)]">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
          <Info className="text-[#ff1493] shrink-0" size={32} />
          Como funciona o Club de Crédito?
        </h3>
        <div className="space-y-4 text-gray-600 sm:text-lg font-medium leading-relaxed">
          <p>
            O <strong>Club de Crédito</strong> é muito mais que uma assinatura: todo o valor pago mensalmente é considerado <strong className="text-[#ff1493]">crédito acumulado</strong>.
          </p>
          <p>
            Por exemplo: se você acumular durante <strong>6 meses</strong>, pode solicitar uma sessão no estúdio equivalente ao valor acumulado total. Ou até mesmo negociar uma sessão especial muito benéfica para você utilizando o seu saldo!
          </p>
          <p>
            E não para por aí! Enquanto acumula, você ainda ganha <strong>descontos nos procedimentos</strong>, participa de <strong>sorteios mensais</strong> e garante vantagens exclusivas (como <strong>prioridade na agenda</strong> nos planos a partir de R$ 149,90).
          </p>
        </div>
      </div>
    </main>
  );
}
