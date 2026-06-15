"use client";

import { useState, useEffect } from "react";
import { Handshake, TrendingUp, Settings, Download, Activity, Code } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

export default function ParceriaPage() {
  const [percentual, setPercentual] = useState(15);
  const [isMounted, setIsMounted] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    async function loadConfig() {
      const { data, error } = await supabase.from('configuracoes').select('taxa_parceria').eq('id', 1).single();
      if (data && !error) {
        setPercentual(Number(data.taxa_parceria));
      } else {
        setPercentual(15);
      }
      setLoadingConfig(false);
    }
    loadConfig();
  }, []);

  const handleSavePercentual = async (val: number) => {
    await supabase.from('configuracoes').update({ taxa_parceria: val }).eq('id', 1);
  };

  const totalReceitas = 36322.50; // Mock de receita da semana
  const valorDev = (totalReceitas * percentual) / 100;

  // Mock de repasses semanais (para o gráfico)
  const semanas = [
    { semana: "Sem 1", valor: 8500, repasse: (8500 * percentual) / 100 },
    { semana: "Sem 2", valor: 9200, repasse: (9200 * percentual) / 100 },
    { semana: "Sem 3", valor: 8900, repasse: (8900 * percentual) / 100 },
    { semana: "Sem 4", valor: 9722.50, repasse: (9722.50 * percentual) / 100 },
  ];

  const maxRepasse = Math.max(...semanas.map(m => m.repasse)) || 1;

  const transacoes = [
    { id: "PAY-9382", plano: "Club de Crédito R$ 149,90", valor: 149.90 },
    { id: "PAY-9381", plano: "Club de Crédito R$ 79,99", valor: 79.99 },
    { id: "PAY-9380", plano: "Club de Crédito R$ 249,90", valor: 249.90 },
    { id: "PAY-9379", plano: "Club de Crédito R$ 299,90", valor: 299.90 },
    { id: "PAY-9378", plano: "Club de Crédito R$ 149,90", valor: 149.90 },
  ];

  // format currency
  const formatBRL = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] animate-in fade-in">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff1493]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
              Desenvolvedor: Lucas Pereira
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            Acordo de Parceria <Code className="text-[#ff1493]" size={28} />
          </h1>
          <p className="text-gray-500 font-medium mt-1">Gestão de repasses, gráficos de desempenho e configurações do sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Configuração VIP */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-black p-8 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] text-white relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff1493]/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 group-hover:bg-[#ff1493]/30 transition-colors duration-500"></div>
          
          <div className="relative z-10 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/5">
                  <Settings className="text-[#ff1493]" size={24} />
                </div>
                <h2 className="text-xl font-bold">Taxa de Repasse</h2>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Deslize para ajustar a porcentagem acordada sobre as mensalidades do sistema. O gráfico e a previsão são atualizados em tempo real.
            </p>
            
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
              <input 
                type="range" 
                min="0" max="50" 
                value={percentual} 
                onChange={(e) => setPercentual(Number(e.target.value))}
                onMouseUp={(e) => handleSavePercentual(Number((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => handleSavePercentual(Number((e.target as HTMLInputElement).value))}
                className="w-full accent-[#ff1493] h-2.5 bg-white/20 rounded-lg appearance-none cursor-pointer hover:bg-white/30 transition-colors"
              />
              <span className="font-black text-3xl w-20 text-right text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
                {percentual}%
              </span>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10">
            <p className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">Repasse Previsto (Esta Semana)</p>
            <p className="text-4xl font-black tracking-tighter text-[#ff1493]">{formatBRL(valorDev)}</p>
            <p className="text-xs text-emerald-400 font-bold mt-2 flex items-center gap-1.5 bg-emerald-500/10 w-fit px-2 py-1 rounded-md">
              <TrendingUp size={14} /> Faturamento base: {formatBRL(totalReceitas)}
            </p>

            <div className="mt-5 flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="w-2 h-2 rounded-full bg-[#ff1493] mt-1.5 shrink-0 animate-pulse"></div>
              <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                O fechamento ocorre semanalmente. O boleto de comissão será gerado automaticamente todo <strong className="text-white">Domingo às 23:59</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico Exclusivo */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-transparent to-[#ff1493]/5 pointer-events-none opacity-50"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600">
                <Activity size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Evolução dos Repasses</h2>
            </div>
            <button className="text-sm font-bold text-[#ff1493] bg-[#ff1493]/10 hover:bg-[#ff1493]/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
              <Download size={16} /> Relatório Completo
            </button>
          </div>

          {/* Gráfico de Barras Responsivo construído com Tailwind */}
          <div className="flex-1 flex items-end gap-2 sm:gap-6 pt-6 relative z-10">
            {semanas.map((item, idx) => {
              const altura = (item.repasse / maxRepasse) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer">
                  <div className="w-full relative flex items-end justify-center h-48 bg-gray-50 rounded-t-2xl hover:bg-gray-100 transition-colors">
                    {/* Tooltip Hover (fica bonitão quando passa o mouse) */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 bg-gray-900 text-white text-xs font-bold py-2 px-3 rounded-xl pointer-events-none whitespace-nowrap z-20 shadow-xl">
                      {formatBRL(item.repasse)}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                    {/* Barra Animada */}
                    <div 
                      className="w-full sm:w-3/4 bg-gradient-to-t from-[#ff1493] to-[#ff6b6b] rounded-t-xl transition-all duration-700 ease-out relative overflow-hidden group-hover:shadow-[0_0_20px_rgba(255,20,147,0.4)]" 
                      style={{ height: `${altura}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-500 group-hover:text-gray-900 transition-colors">{item.semana}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos Recentes */}
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Handshake size={20} className="text-[#ff1493]" /> 
            Últimas Transações (Cálculo de Parceria)
          </h2>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg">Cálculo Automático</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-5">Cód. Transação</th>
                <th className="px-6 py-5">Serviço/Plano Vinculado</th>
                <th className="px-6 py-5">Valor Bruto</th>
                <th className="px-6 py-5 text-[#ff1493]">Repasse ({percentual}%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transacoes.map((t, idx) => {
                const repasse = (t.valor * percentual) / 100;
                return (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{t.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-600">
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold">{t.plano}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-400">{formatBRL(t.valor)}</td>
                    <td className="px-6 py-4 font-black text-emerald-600">{formatBRL(repasse)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
          <button className="text-sm font-bold text-gray-500 hover:text-[#ff1493] transition-colors">
            Ver Todo o Histórico de Repasses
          </button>
        </div>
      </div>

    </div>
  );
}
