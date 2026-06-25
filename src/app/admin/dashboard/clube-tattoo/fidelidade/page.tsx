"use client";

import { useEffect, useState } from "react";
import { Award, Edit, Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../../../lib/supabase";

export default function AdminFidelidadePage() {
  const [beneficios, setBeneficios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBeneficios();
  }, []);

  const fetchBeneficios = async () => {
    setLoading(true);
    const { data } = await supabase.from('fidelidade_beneficios').select('*').order('meses', { ascending: true });
    if (data) setBeneficios(data);
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
            <Award className="text-[#ff1493]" size={32} />
            Gestão de Fidelidade
          </h1>
          <p className="text-gray-500 font-medium mt-1">Configure os benefícios desbloqueados por tempo de assinatura.</p>
        </div>
        <button className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-colors">
          <Plus size={18} /> Novo Benefício
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500">Meses</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500">Título do Benefício</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500 hidden sm:table-cell">Descrição</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Carregando benefícios...</td></tr>
              ) : beneficios.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum benefício cadastrado.</td></tr>
              ) : (
                beneficios.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-lg text-sm font-bold border border-pink-200">
                        {b.meses}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-900">{b.titulo}</td>
                    <td className="p-4 text-sm text-gray-500 hidden sm:table-cell">{b.descricao}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button onClick={() => handleEdit(b.id)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors inline-block" title="Editar">
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
