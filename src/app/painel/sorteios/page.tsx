import { Gift, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SorteiosPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 pt-12">
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
          <p className="text-gray-500 font-medium">Participe e ganhe prêmios exclusivos</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-[0_15px_40px_rgba(255,105,180,0.1)] text-center">
        <div className="text-6xl mb-4">🎁</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Nenhum sorteio ativo</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">Fique ligada! Em breve lançaremos novos sorteios incríveis para as assinantes do Dyoli Club.</p>
        <button className="bg-gray-100 text-gray-400 px-6 py-3 rounded-full font-bold cursor-not-allowed">
          Aguarde novidades
        </button>
      </div>
    </main>
  );
}
