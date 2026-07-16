"use client";

import { useState, useEffect } from "react";
import { Users, CreditCard, TrendingUp, Activity, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DateRangePicker } from "../../../components/DateRangePicker";

export default function AdminDashboardPage() {
  const [expandirClub, setExpandirClub] = useState(false);
  const [loading, setLoading] = useState(true);

  const [chartData, setChartData] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState<'hoje' | 'semana' | 'personalizado'>('semana');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const [metricas, setMetricas] = useState([
    { titulo: "Clientes Ativos", valor: "0", variacao: "0%", icon: Users, cor: "bg-blue-500" },
    { titulo: "Receita Mensal", valor: "R$ 0,00", variacao: "0%", icon: CreditCard, cor: "bg-emerald-500" },
    { titulo: "Assinaturas Ativas", valor: "0", variacao: "0%", icon: TrendingUp, cor: "bg-[#ff1493]" },
  ]);

  const [totalClub, setTotalClub] = useState(0);
  const [statusPlanos, setStatusPlanos] = useState<any[]>([]);
  const [planoMaisVendido, setPlanoMaisVendido] = useState({ nome: "Nenhum plano (Geral)", porcentagem: "0%", totalAtivos: "0 assinantes" });

  useEffect(() => {
    async function loadDashboard() {
      // 1. Clientes Ativos
      const { count: countClientes } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client');
      
      // 2. Assinaturas Ativas
      const { count: countAssinaturas } = await supabase.from('assinaturas').select('*', { count: 'exact', head: true }).eq('status', 'Ativa');

      // 3. Receita Total (Soma de pagamentos aprovados) + Gráfico de 6 meses
      const { data: pagamentos } = await supabase.from('pagamentos').select('valor, data_pagamento').eq('status', 'Aprovado');
      const receita = pagamentos?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;

      // Montar gráfico com base no filtro
      const hojeDate = new Date();
      let inicio = new Date();
      let fim = new Date();
      
      if (timeFilter === 'hoje') {
        inicio.setHours(0,0,0,0);
        fim.setHours(23,59,59,999);
      } else if (timeFilter === 'semana') {
        inicio.setDate(hojeDate.getDate() - 6);
        inicio.setHours(0,0,0,0);
      } else if (timeFilter === 'personalizado' && startDate && endDate) {
        inicio = new Date(startDate);
        inicio.setHours(0,0,0,0);
        fim = new Date(endDate);
        fim.setHours(23,59,59,999);
      } else {
        // Se personalizado mas sem datas, mostra últimos 7 dias como padrão
        inicio.setDate(hojeDate.getDate() - 6);
        inicio.setHours(0,0,0,0);
      }

      // Filtrar pagamentos
      const pagamentosFiltrados = pagamentos?.filter(p => {
        const pd = new Date(p.data_pagamento);
        return pd >= inicio && pd <= fim;
      }) || [];

      const historico: Record<string, number> = {};
      
      if (timeFilter === 'hoje') {
        // Agrupar por hora
        for (let i = 0; i <= 23; i++) {
          historico[`${i.toString().padStart(2, '0')}:00`] = 0;
        }
        pagamentosFiltrados.forEach(p => {
          const pd = new Date(p.data_pagamento);
          const k = `${pd.getHours().toString().padStart(2, '0')}:00`;
          if (historico[k] !== undefined) historico[k] += Number(p.valor);
        });
      } else {
        // Agrupar por dia
        let curr = new Date(inicio);
        while (curr <= fim) {
          historico[curr.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })] = 0;
          curr.setDate(curr.getDate() + 1);
        }
        pagamentosFiltrados.forEach(p => {
          const pd = new Date(p.data_pagamento);
          const k = pd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          if (historico[k] !== undefined) historico[k] += Number(p.valor);
        });
      }
      
      setChartData(Object.keys(historico).map(k => ({ name: k, receita: historico[k] })));

      setMetricas([
        { titulo: "Clientes Cadastrados", valor: String(countClientes || 0), variacao: "Geral", icon: Users, cor: "bg-blue-500" },
        { titulo: "Receita Total", valor: `R$ ${receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, variacao: "Geral", icon: CreditCard, cor: "bg-emerald-500" },
        { titulo: "Assinaturas Ativas", valor: String(countAssinaturas || 0), variacao: "Atuais", icon: TrendingUp, cor: "bg-[#ff1493]" },
      ]);

      setTotalClub(countAssinaturas || 0);

      // 4. Distribuição de Planos
      const { data: opcoes } = await supabase.from('plano_opcoes').select('*, assinaturas(id, status), planos(nome)');
      if (opcoes) {
        const cores = ["bg-[#ff9a9e]", "bg-[#a1c4fd]", "bg-[#f6d365]", "bg-[#d4fc79]"];
        let melhorPlano = { nome: "Nenhum (0)", ativos: -1 };

        const dist = opcoes.sort((a,b)=>a.valor - b.valor).map((op, idx) => {
          const ativos = op.assinaturas ? op.assinaturas.filter((a:any) => a.status === 'Ativa').length : 0;
          const nomeStr = `${op.planos?.nome} (R$ ${op.valor})`;
          
          if (ativos > melhorPlano.ativos) {
            melhorPlano = { nome: nomeStr, ativos };
          }
          
          return {
            nome: nomeStr,
            ativos: ativos,
            cor: cores[idx % cores.length]
          };
        });
        
        setStatusPlanos(dist);

        if (melhorPlano.ativos > 0 && countAssinaturas) {
          setPlanoMaisVendido({
            nome: melhorPlano.nome,
            porcentagem: `${Math.round((melhorPlano.ativos / countAssinaturas) * 100)}%`,
            totalAtivos: `${melhorPlano.ativos} assinantes`
          });
        }
      }

      setLoading(false);
    }
    loadDashboard();
  }, [timeFilter, startDate, endDate]);

  if (loading) return <div className="p-8 text-center animate-pulse">Carregando métricas...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500 font-medium mt-1">Bem-vindo ao painel de controle do Club de Crédito.</p>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metricas.map((metrica, idx) => {
          const Icon = metrica.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center gap-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className={`${metrica.cor} w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg`}>
                <Icon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-500 font-bold text-sm uppercase tracking-wide">{metrica.titulo}</p>
                <div className="flex items-end gap-3 mt-1">
                  <span className="text-3xl font-black text-gray-900 leading-none tracking-tight">{metrica.valor}</span>
                  <span className="text-emerald-500 font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded-md mb-1">{metrica.variacao}</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/0 to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-full -z-10"></div>
            </div>
          );
        })}
      </div>

      {/* Gráfico de Receita */}
      <div className="bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h2 className="text-xl font-bold text-gray-900">Evolução de Receita</h2>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => setTimeFilter('hoje')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${timeFilter === 'hoje' ? 'bg-[#ff1493] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Hoje
            </button>
            <button 
              onClick={() => setTimeFilter('semana')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${timeFilter === 'semana' ? 'bg-[#ff1493] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Últimos 7 dias
            </button>
            <div className="relative">
              <button 
                onClick={() => {
                  setTimeFilter('personalizado');
                  setShowCalendar(!showCalendar);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${timeFilter === 'personalizado' ? 'bg-[#ff1493] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                <CalendarIcon size={16} /> Personalizado
              </button>

              {showCalendar && timeFilter === 'personalizado' && (
                <div className="absolute right-0 mt-2 p-4 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 flex flex-col gap-3">
                  <DateRangePicker 
                    startDate={startDate} 
                    endDate={endDate} 
                    onStartChange={setStartDate} 
                    onEndChange={setEndDate} 
                  />
                  <button 
                    onClick={() => setShowCalendar(false)}
                    className="w-full mt-2 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm font-bold hover:bg-gray-800 transition-colors"
                  >
                    Aplicar Datas
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 600}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 600}} dx={-10} tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Receita']}
                labelStyle={{ color: '#ff1493', marginBottom: '4px' }}
              />
              <Line type="monotone" dataKey="receita" stroke="#ff1493" strokeWidth={4} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 8, stroke: '#ff1493', strokeWidth: 2, fill: '#fff'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seção Inferior: Planos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Desempenho dos Planos */}
        <div className="bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-100 p-2 rounded-xl">
              <Activity className="text-purple-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Distribuição de Planos</h2>
          </div>
          
          <div className="space-y-4">
            {/* Acordeão do Club de Crédito */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
              <button 
                onClick={() => setExpandirClub(!expandirClub)}
                className="w-full bg-gray-50 hover:bg-gray-100 p-5 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#ff1493] text-white rounded-xl flex items-center justify-center font-black shadow-[0_5px_15px_rgba(255,20,147,0.3)] text-xl">
                    C
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-gray-900 text-lg">Club de Crédito</h3>
                    <p className="text-sm text-gray-500 font-bold">100% da base ativa</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right hidden sm:block">
                    <span className="font-black text-2xl text-gray-900 leading-none block">{totalClub}</span>
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">assinantes</span>
                  </div>
                  <ChevronDown size={24} className={`text-gray-400 transition-transform duration-300 ${expandirClub ? 'rotate-180' : ''}`} />
                </div>
              </button>
              
              <div className={`transition-all duration-500 ease-in-out ${expandirClub ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="p-6 bg-white space-y-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Detalhamento por Opção de Valor:</p>
                  {statusPlanos.map((plano, idx) => {
                    const porcentagem = totalClub > 0 ? Math.round((plano.ativos / totalClub) * 100) : 0;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between items-end mb-2">
                          <span className="font-bold text-gray-700">{plano.nome}</span>
                          <span className="font-bold text-gray-900">{plano.ativos} <span className="text-gray-400 font-medium text-xs">assinantes</span></span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div className={`${plano.cor} h-3 rounded-full relative`} style={{ width: `${porcentagem}%` }}>
                            <div className="absolute top-0 left-0 w-full h-full bg-white/20"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Destaque */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.15)] text-white relative overflow-hidden flex flex-col justify-center">
          {/* Decoração de fundo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#ff1493]/20 to-purple-500/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          
          <div className="relative z-10">
            <span className="inline-block bg-[#ff1493] text-white font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-widest mb-6">
              Plano Mais Vendido
            </span>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight tracking-tight">
              {planoMaisVendido.nome.split(' (')[0]}
              <br/>
              <span className="text-[#ff1493]">{planoMaisVendido.nome.split(' (')[1].replace(')','')}</span>
            </h2>
            <p className="text-xl text-gray-300 font-medium mb-8">
              Representa <strong className="text-white">{planoMaisVendido.porcentagem}</strong> da base atual com <strong className="text-white">{planoMaisVendido.totalAtivos}</strong>.
            </p>
            <button className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl font-bold transition-all">
              Ver Relatório Completo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
