import { Star, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BeneficiosPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 pt-12">
      <Link href="/painel" className="inline-flex items-center gap-2 text-[#ff1493] font-bold mb-6 hover:opacity-80 transition-opacity">
        <ArrowLeft size={20} />
        Voltar
      </Link>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 w-16 h-16 rounded-full flex items-center justify-center shadow-sm">
          <Star className="text-[#ff1493]" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Benefícios</h1>
          <p className="text-gray-500 font-medium">As vantagens de ser VIP</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-[0_15px_40px_rgba(255,105,180,0.1)]">
        <h2 className="text-xl font-bold text-[#ff1493] mb-4">Bem-vinda aos benefícios do seu Club de Créditos</h2>
        
        <ul className="space-y-4">
          <li className="flex gap-3">
            <div className="text-[#ff4081] mt-1">✨</div>
            <div>
              <strong className="text-gray-800 block">Atendimento Prioritário</strong>
              <p className="text-gray-500 text-sm">Passe na frente na hora de agendar suas sessões.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <div className="text-[#ff4081] mt-1">✨</div>
            <div>
              <strong className="text-gray-800 block">Descontos em Produtos</strong>
              <p className="text-gray-500 text-sm">15% off em todos os produtos da nossa lojinha.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <div className="text-[#ff4081] mt-1">✨</div>
            <div>
              <strong className="text-gray-800 block">Acesso ao Grupo VIP</strong>
              <p className="text-gray-500 text-sm">Comunidade exclusiva com dicas e novidades em primeira mão.</p>
            </div>
          </li>
        </ul>
      </div>
    </main>
  );
}
