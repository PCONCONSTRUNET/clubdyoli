"use client";

import { useEffect, useState } from "react";
import { User, ArrowLeft, CreditCard, History, Award, CheckCircle, Ticket, Gift } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function PerfilPage() {
  const [nome, setNome] = useState("Carregando...");
  const [cpf, setCpf] = useState("Carregando...");
  const [telefone, setTelefone] = useState("Carregando...");
  const [activeTab, setActiveTab] = useState("dados"); // 'dados', 'assinatura', 'historico'
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata) {
        setNome(session.user.user_metadata.nome || "Não informado");
        setCpf(session.user.user_metadata.cpf || "Não informado");
        setTelefone(session.user.user_metadata.telefone || "Não informado");
      }
    };
    loadProfile();
  }, []);

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
              Emitido para: ${nome}<br>
              CPF: ${cpf}<br>
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
    <main className="max-w-2xl mx-auto px-6 pt-12 pb-12">
      <Link href="/painel" className="inline-flex items-center gap-2 text-[#ff1493] font-bold mb-6 hover:opacity-80 transition-opacity">
        <ArrowLeft size={20} />
        Voltar
      </Link>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 w-16 h-16 rounded-full flex items-center justify-center shadow-sm shrink-0">
          <User className="text-[#ff1493]" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Meu Perfil</h1>
          <p className="text-gray-500 font-medium">Gerencie sua conta e assinatura VIP</p>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        <button 
          onClick={() => setActiveTab("dados")}
          className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === 'dados' ? 'bg-[#ff1493] text-white shadow-md' : 'bg-white text-gray-500 border border-pink-100 hover:bg-pink-50'}`}
        >
          Meus Dados
        </button>
        <button 
          onClick={() => setActiveTab("assinatura")}
          className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'assinatura' ? 'bg-[#ff1493] text-white shadow-md' : 'bg-white text-gray-500 border border-pink-100 hover:bg-pink-50'}`}
        >
          <CreditCard size={16} /> Assinatura
        </button>
        <button 
          onClick={() => setActiveTab("historico")}
          className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'historico' ? 'bg-[#ff1493] text-white shadow-md' : 'bg-white text-gray-500 border border-pink-100 hover:bg-pink-50'}`}
        >
          <History size={16} /> Histórico
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-white/60 shadow-[0_15px_40px_rgba(255,105,180,0.1)]">
        
        {/* ABA: DADOS */}
        {activeTab === "dados" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <label className="block text-xs font-bold text-[#ff1493] uppercase tracking-wider mb-1">Nome Completo</label>
              <div className="text-gray-800 font-medium text-lg bg-pink-50/50 p-3 rounded-xl border border-pink-100">{nome}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#ff1493] uppercase tracking-wider mb-1">CPF</label>
              <div className="text-gray-800 font-medium text-lg bg-pink-50/50 p-3 rounded-xl border border-pink-100">{cpf}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#ff1493] uppercase tracking-wider mb-1">Telefone / WhatsApp</label>
              <div className="text-gray-800 font-medium text-lg bg-pink-50/50 p-3 rounded-xl border border-pink-100">{telefone}</div>
            </div>
          </div>
        )}

        {/* ABA: ASSINATURA E TRANSAÇÕES */}
        {activeTab === "assinatura" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Status do Plano */}
            <div className="bg-gradient-to-r from-pink-50 to-white border border-pink-100 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-green-500 bg-green-100 px-2 py-1 rounded-md uppercase flex items-center gap-1 w-max mb-2">
                    <CheckCircle size={12} /> Ativa
                  </span>
                  <h3 className="text-xl font-extrabold text-gray-800">Plano VIP Dyoli</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#ff1493]">R$54,90</span>
                  <span className="text-gray-400 text-xs block">/mês</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">Sua próxima cobrança será no dia <strong>10/07/2026</strong> no cartão com final <strong>4321</strong>.</p>
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="text-sm font-bold text-gray-500 hover:text-[#ff1493] underline underline-offset-2 transition-colors"
              >
                Gerenciar pagamento
              </button>
            </div>

            {/* Transações */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard size={18} className="text-[#ff1493]"/> Histórico de Pagamentos</h4>
              <ul className="space-y-3">
                <li className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div>
                    <strong className="text-sm text-gray-700 block">Assinatura Mensal</strong>
                    <span className="text-xs text-gray-400">10 Jun 2026</span>
                  </div>
                  <span className="font-bold text-green-600 text-sm">Pago</span>
                </li>
                <li className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div>
                    <strong className="text-sm text-gray-700 block">Assinatura Mensal</strong>
                    <span className="text-xs text-gray-400">10 Mai 2026</span>
                  </div>
                  <span className="font-bold text-green-600 text-sm">Pago</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ABA: HISTÓRICO DE PRÊMIOS/CUPONS */}
        {activeTab === "historico" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Cupons Ativos */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Ticket size={18} className="text-[#ff1493]"/> Meus Cupons Ativos</h4>
              <div className="grid gap-3">
                <div className="bg-gradient-to-r from-[#ff1493] to-[#ff4081] text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between shadow-md gap-4">
                  <div>
                    <span className="font-black text-xl block">15% OFF</span>
                    <span className="text-xs opacity-80">Válido até 31/12</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors">Copiar Código</button>
                    <button 
                      onClick={() => handleDownloadPDF('Cupom: 15% OFF (Primeira Sessão)', 'Desconto')}
                      className="bg-white text-[#ff1493] text-xs font-bold px-3 py-1.5 rounded-full hover:bg-pink-50 transition-colors shadow-sm"
                    >
                      Baixar PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sorteios e Prêmios */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Gift size={18} className="text-[#ff1493]"/> Prêmios Ganhos</h4>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="bg-amber-100 p-2 rounded-lg text-amber-500 h-max">
                    <Award size={24} />
                  </div>
                  <div>
                    <strong className="text-amber-700 block text-lg">Kit Skincare Especial</strong>
                    <p className="text-amber-600/80 text-sm mb-2">Sorteio de Dia das Mães (Mai/2026)</p>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">Entregue</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDownloadPDF('Prêmio: Kit Skincare Especial', 'Sorteio Ganho')}
                  className="bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-amber-600 transition-colors shadow-sm whitespace-nowrap self-start"
                >
                  Imprimir Comprovante
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Modal de Gerenciar Pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            {/* Botão Fechar */}
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#ff1493] transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-50"
            >
              ✕
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-extrabold text-gray-900">Atualizar Cartão</h3>
              <p className="text-gray-500 text-sm">Insira os dados do novo cartão de crédito para a sua assinatura VIP.</p>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Cartão atualizado com sucesso! (Simulação)"); setShowPaymentModal(false); }}>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Número do Cartão</label>
                <input 
                  type="text" 
                  placeholder="0000 0000 0000 0000" 
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff1493]/30 focus:border-[#ff1493] transition-all font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Validade</label>
                  <input 
                    type="text" 
                    placeholder="MM/AA" 
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff1493]/30 focus:border-[#ff1493] transition-all font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">CVV</label>
                  <input 
                    type="text" 
                    placeholder="123" 
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff1493]/30 focus:border-[#ff1493] transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nome no Cartão</label>
                <input 
                  type="text" 
                  placeholder="Nome impresso" 
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff1493]/30 focus:border-[#ff1493] transition-all"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#ff4081] text-white py-3 mt-4 rounded-full font-bold shadow-lg shadow-pink-500/30 hover:-translate-y-0.5 hover:bg-[#e91e63] transition-all duration-300"
              >
                Salvar Novo Cartão
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
