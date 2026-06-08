"use client";

import { Ticket, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

export default function CuponsPage() {
  const handleDownloadPDF = (titulo: string, tipo: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Dyoli Club - ${titulo}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center; padding: 50px; background-color: #fff8fb; color: #333; }
            .container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(255,20,147,0.1); max-w: 500px; margin: 0 auto; border: 1px solid #ffb6c1; }
            h1 { color: #ff1493; letter-spacing: 2px; margin-bottom: 5px; }
            .badge { background: #ff1493; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; display: inline-block; margin-bottom: 20px; }
            .ticket { border: 2px dashed #ff1493; padding: 30px; margin: 20px 0; border-radius: 15px; background: #fff0f5; }
            .ticket h2 { font-size: 36px; margin: 0; color: #ff1493; }
            p { color: #666; line-height: 1.5; }
            .footer { margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>DYOLI CLUB</h1>
            <div class="badge">VOUCHER OFICIAL</div>
            <p>Este documento é válido como comprovante de <strong>${tipo}</strong>.</p>
            
            <div class="ticket">
              <h2>${titulo}</h2>
            </div>
            
            <p>Apresente este PDF no estúdio no dia do seu atendimento ou envie o arquivo pelo nosso WhatsApp para utilizá-lo.</p>
            
            <div class="footer">
              Data de emissão: ${new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <main className="max-w-2xl mx-auto px-6 pt-12">
      <Link href="/painel" className="inline-flex items-center gap-2 text-[#ff1493] font-bold mb-6 hover:opacity-80 transition-opacity">
        <ArrowLeft size={20} />
        Voltar
      </Link>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 w-16 h-16 rounded-full flex items-center justify-center shadow-sm">
          <Ticket className="text-[#ff1493]" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Meus Cupons</h1>
          <p className="text-gray-500 font-medium">Seus descontos reais estão aqui</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Cupom Exemplo */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-pink-100 shadow-[0_8px_30px_rgba(255,20,147,0.05)] flex items-center justify-between">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#fff8fb] rounded-r-full border-r border-y border-pink-100"></div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#fff8fb] rounded-l-full border-l border-y border-pink-100"></div>
          
          <div className="pl-4">
            <span className="text-[#ff1493] font-black text-2xl block mb-1">15% OFF</span>
            <h3 className="font-bold text-gray-800">Primeira Sessão</h3>
            <p className="text-gray-400 text-xs">Válido até 31/12</p>
          </div>
          
          <button 
            onClick={() => handleDownloadPDF('15% OFF - Primeira Sessão', 'Cupom de Desconto')}
            className="flex items-center gap-1 bg-[#ff4081] text-white px-4 py-2 rounded-full font-bold shadow-md shadow-pink-500/20 hover:bg-[#e91e63] transition-colors text-sm"
          >
            <Download size={14} /> Baixar PDF
          </button>
        </div>

        {/* Cupom Exemplo 2 */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-pink-100 shadow-[0_8px_30px_rgba(255,20,147,0.05)] flex items-center justify-between opacity-60">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#fff8fb] rounded-r-full border-r border-y border-pink-100"></div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#fff8fb] rounded-l-full border-l border-y border-pink-100"></div>
          
          <div className="pl-4">
            <span className="text-gray-400 font-black text-2xl block mb-1">FRETE GRÁTIS</span>
            <h3 className="font-bold text-gray-500">Na lojinha Dyoli</h3>
            <p className="text-gray-400 text-xs">Expirado</p>
          </div>
          
          <button className="bg-gray-200 text-gray-400 px-5 py-2 rounded-full font-bold cursor-not-allowed text-sm">
            Usar
          </button>
        </div>
      </div>
    </main>
  );
}
