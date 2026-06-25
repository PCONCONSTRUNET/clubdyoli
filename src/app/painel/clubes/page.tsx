"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ClubesPage() {
  const router = useRouter();

  return (
    <main className="max-w-2xl mx-auto px-6 pt-12 pb-20">
      <Link href="/painel" className="inline-flex items-center gap-2 text-[#ff1493] font-bold mb-8 hover:opacity-80 transition-opacity">
        <ArrowLeft size={20} />
        Voltar
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Nossos <span className="text-[#ff1493]">Clubes</span></h1>
        <p className="text-gray-500 font-medium mt-2">Escolha o clube perfeito para você</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* Banner Clube Tattoo */}
        <div
          onClick={() => router.push('/painel/planos?clube=tattoo')}
          className="w-full cursor-pointer hover:-translate-y-1 transition-all duration-300 active:scale-95"
        >
          <img
            src="/banner_clube_tattoo.png"
            alt="Clube Tattoo"
            className="w-full h-auto rounded-[20px] shadow-[0_15px_40px_rgba(255,105,180,0.25)]"
          />
        </div>

        {/* Banner Club de Crédito */}
        <div
          onClick={() => router.push('/painel/planos?clube=credito')}
          className="w-full cursor-pointer hover:-translate-y-1 transition-all duration-300 active:scale-95"
        >
          <img
            src="/banner_clube_credito.png"
            alt="Club de Crédito"
            className="w-full h-auto rounded-[20px] shadow-[0_15px_40px_rgba(255,105,180,0.2)]"
          />
        </div>

      </div>
    </main>
  );
}
