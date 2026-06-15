"use client";

import { useState, useEffect } from "react";
import { Calendar, Filter, Download, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

export default function AdminPagamentosPage() {
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPagamentos() {
      const { data, error } = await supabase
        .from('pagamentos')
        .select(`
          id, valor, status, data_pagamento,
          profiles (nome),
          assinaturas (plano_opcoes (valor, planos (nome)))
        `)
        .order('data_pagamento', { ascending: false });

      if (data && !error) {
        const formated = data.map((p: any) => {
          const ass = p.assinaturas;
          const dataObj = new Date(p.data_pagamento);
          return {
            id: p.id.split('-')[0], // Mostrar só o começo do UUID
            cliente: p.profiles?.nome || "Desconhecido",
            plano: ass ? `${ass.plano_opcoes?.planos?.nome} (R$ ${ass.plano_opcoes?.valor})` : "Avulso / Nenhum",
            valor: `R$ ${p.valor}`,
            data: dataObj.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', year: 'numeric'}),
            hora: dataObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
            status: p.status
          };
        });
        setPagamentos(formated);
      }
      setLoading(false);
    }
    fetchPagamentos();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pagamentos</h1>
          <p className="text-gray-500 font-medium mt-1">Controle de recebimentos e histórico financeiro.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-bold text-sm">Hoje</button>
            <button className="px-4 py-2 text-gray-500 hover:text-gray-900 rounded-lg font-bold text-sm">7 Dias</button>
            <button className="px-4 py-2 text-gray-500 hover:text-gray-900 rounded-lg font-bold text-sm">Mês</button>
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors">
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar por cliente ou ID..." 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493]"
              />
              <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-5">ID / Data</th>
                <th className="px-6 py-5">Cliente</th>
                <th className="px-6 py-5">Plano Associado</th>
                <th className="px-6 py-5">Valor</th>
                <th className="px-6 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagamentos.map((pagamento) => (
                <tr key={pagamento.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 mb-1">{pagamento.id}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} /> {pagamento.data}
                      <Clock size={12} className="ml-2" /> {pagamento.hora}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800">{pagamento.cliente}</td>
                  <td className="px-6 py-4 font-medium text-gray-600">{pagamento.plano}</td>
                  <td className="px-6 py-4 font-black text-gray-900">{pagamento.valor}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      pagamento.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' :
                      pagamento.status === 'Pendente' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {pagamento.status === 'Aprovado' ? <ArrowUpRight size={14} /> : 
                       pagamento.status === 'Recusado' ? <ArrowDownRight size={14} /> : 
                       <Clock size={14} />}
                      {pagamento.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50">
          <span>Mostrando 5 de 1.248 pagamentos</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded-md bg-white disabled:opacity-50" disabled>Ant</button>
            <button className="px-3 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50">Próx</button>
          </div>
        </div>
      </div>
    </div>
  );
}
