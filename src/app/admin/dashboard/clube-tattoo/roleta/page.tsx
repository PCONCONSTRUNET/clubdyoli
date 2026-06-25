"use client";

import { useEffect, useState } from "react";
import { Sparkles, Edit, Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../../../lib/supabase";

export default function AdminRoletaPage() {
  const [premios, setPremios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPremios();
  }, []);

  const fetchPremios = async () => {
    setLoading(true);
    const { data } = await supabase.from('premios_roleta').select('*').order('peso', { ascending: false });
    if (data) setPremios(data);
    setLoading(false);
  };

  const handleEdit = (id: string) => {
    alert("Implementar edição (mock). id: " + id);
  };

  return (
    <div className="p-6 pb-20 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#ff1493] transition-colors mb-6 font-bold text-sm">
        <ArrowLeft size={16} /> Voltar ao Dashboard
      </Link>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Sparkles className="text-[#ff1493]" size={32} />
            Gerenciar Roleta
          </h1>
          <p className="text-gray-500 font-medium mt-1">Configure prêmios e probabilidades do Giro da Sorte.</p>
        </div>
        <button className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-colors">
          <Plus size={18} /> Novo Prêmio
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500">Prêmio / Tipo</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500">Peso (Probabilidade)</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500">Status</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Carregando prêmios...</td></tr>
              ) : premios.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum prêmio cadastrado.</td></tr>
              ) : (
                premios.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{p.nome}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{p.tipo}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-bold border border-gray-200">
                        {p.peso}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-md uppercase ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEdit(p.id)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors inline-block" title="Editar">
                        <Edit size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-500 transition-colors inline-block" title="Excluir">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
