"use client";

import { useEffect, useState } from "react";
import { User, ArrowLeft, CreditCard, History, Award, CheckCircle, Ticket, Gift, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Wallet } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function PerfilPage() {
  const [nome, setNome] = useState("Carregando...");
  const [cpf, setCpf] = useState("Carregando...");
  const [telefone, setTelefone] = useState("Carregando...");
  const [activeTab, setActiveTab] = useState("dados"); // 'dados', 'assinatura', 'historico', 'clube'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [creditos, setCreditos] = useState(0);
  const [giros, setGiros] = useState(0);
  const [isClubeTattoo, setIsClubeTattoo] = useState(false);
  const [fidelidadeMeses, setFidelidadeMeses] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (session.user.user_metadata) {
          setNome(session.user.user_metadata.nome || "Não informado");
          setCpf(session.user.user_metadata.cpf || "Não informado");
          setTelefone(session.user.user_metadata.telefone || "Não informado");
        }
        
        // Fetch extended profile data
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setCreditos(profile.creditos_acumulados || 0);
          setGiros(profile.giros_disponiveis || 0);
          setIsClubeTattoo(profile.is_clube_tattoo || false);
        }
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

      {/* Container Principal com Sidebar */}
      <div className="flex flex-col md:flex-row gap-6 items-start relative">
        
        {/* Mobile Sidebar Overlay */}
        <div 
          className={`fixed inset-0 bg-black/40 z-40 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Mobile Toggle Button (Fixed on left edge) */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden fixed top-1/3 left-0 z-40 bg-white/90 backdrop-blur-sm border-y border-r border-pink-200 text-[#ff1493] py-4 pr-1.5 pl-0.5 rounded-r-xl shadow-[2px_4px_12px_rgba(255,20,147,0.15)] flex items-center justify-center transition-all opacity-70 hover:opacity-100 hover:pr-2.5"
          >
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        )}

        {/* Sidebar */}
        <div 
          className={`fixed md:relative top-0 left-0 h-full md:h-auto z-50 md:z-0 transition-all duration-300 ease-in-out flex-shrink-0 bg-white md:bg-transparent shadow-2xl md:shadow-none w-[280px] md:w-64
            ${isSidebarOpen ? 'translate-x-0 md:opacity-100' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'}`}
        >
          {/* Mobile Sidebar Header */}
          <div className="flex justify-between items-center p-6 md:hidden border-b border-pink-50 mb-4 bg-pink-50/50">
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2"><User className="text-[#ff1493]"/> Menu</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="text-[#ff1493] bg-white p-2 rounded-full shadow-sm">
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-2 min-w-[250px] bg-transparent md:bg-white/40 md:backdrop-blur-md px-6 pb-6 md:p-4 rounded-3xl md:border md:border-pink-50 md:shadow-sm">
            <button 
              onClick={() => { setActiveTab("dados"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'dados' ? 'bg-[#ff1493] text-white shadow-md shadow-pink-500/20' : 'bg-white text-gray-500 hover:bg-pink-50 border border-transparent hover:border-pink-100'}`}
            >
              <User size={18} /> Meus Dados
            </button>
            <button 
              onClick={() => { setActiveTab("assinatura"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'assinatura' ? 'bg-[#ff1493] text-white shadow-md shadow-pink-500/20' : 'bg-white text-gray-500 hover:bg-pink-50 border border-transparent hover:border-pink-100'}`}
            >
              <CreditCard size={18} /> Assinatura
            </button>
            <button 
              onClick={() => { setActiveTab("carteira"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'carteira' ? 'bg-[#ff1493] text-white shadow-md shadow-pink-500/20' : 'bg-white text-gray-500 hover:bg-pink-50 border border-transparent hover:border-pink-100'}`}
            >
              <Wallet size={18} /> Minha Carteira
            </button>
            <button 
              onClick={() => { setActiveTab("historico"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'historico' ? 'bg-[#ff1493] text-white shadow-md shadow-pink-500/20' : 'bg-white text-gray-500 hover:bg-pink-50 border border-transparent hover:border-pink-100'}`}
            >
              <History size={18} /> Histórico
            </button>
            {isClubeTattoo && (
              <button 
                onClick={() => { setActiveTab("clube"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'clube' ? 'bg-[#ff1493] text-white shadow-md shadow-pink-500/20' : 'bg-white text-gray-500 hover:bg-pink-50 border border-transparent hover:border-pink-100'}`}
              >
                <Award size={18} /> Clube Tattoo
              </button>
            )}
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 w-full min-w-0 relative transition-all duration-300">
          
          {/* Desktop Toggle Arrow */}
          <div className="hidden md:block absolute top-8 -left-4 z-20">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center justify-center w-8 h-8 bg-white border border-pink-200 shadow-md rounded-full text-[#ff1493] hover:bg-pink-50 hover:scale-110 transition-all"
              title={isSidebarOpen ? "Ocultar Menu" : "Mostrar Menu"}
            >
              {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-white/60 shadow-[0_15px_40px_rgba(255,105,180,0.1)] min-h-[400px]">
        
        {/* ABA: DADOS E CARTEIRA */}
        {activeTab === "dados" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Carteira Compacta no Topo */}
            <div className="bg-pink-50/50 border border-pink-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="bg-white p-3 rounded-full shadow-sm text-[#ff1493] mb-3">
                <Wallet size={28} />
              </span>
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Crédito Acumulado</h3>
              <p className="text-4xl font-black text-gray-900 mb-2">
                R$ {creditos.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-gray-500 text-[11px] max-w-[200px] leading-snug">
                Seu saldo em haver, acumulado no período de assinatura, para usar no estúdio.
              </p>
            </div>

            {/* Dados Pessoais Compactos */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
              <h4 className="font-bold text-gray-800 text-sm mb-4">Meus Dados</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <label className="block text-[10px] font-bold text-[#ff1493] uppercase tracking-wider mb-1">Nome Completo</label>
                  <div className="text-gray-800 font-medium text-sm">{nome}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <label className="block text-[10px] font-bold text-[#ff1493] uppercase tracking-wider mb-1">CPF</label>
                  <div className="text-gray-800 font-medium text-sm">{cpf}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 sm:col-span-2">
                  <label className="block text-[10px] font-bold text-[#ff1493] uppercase tracking-wider mb-1">Telefone / WhatsApp</label>
                  <div className="text-gray-800 font-medium text-sm">{telefone}</div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ABA: CARTEIRA COMPLETA */}
        {activeTab === "carteira" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Valor Acumulado */}
            <div className="bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="bg-white p-4 rounded-full shadow-sm text-[#ff1493] mb-4">
                <Wallet size={40} />
              </span>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Crédito Acumulado</h3>
              <p className="text-5xl font-black text-gray-900 mb-2">
                R$ {creditos.toFixed(2).replace('.', ',')}
              </p>
            </div>

            {/* Explicação */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
               <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-[#ff1493]"/> Como usar sua carteira?</h4>
               <ul className="text-sm text-gray-600 space-y-4">
                 <li className="flex items-start gap-3">
                   <span className="text-[#ff1493] font-black text-lg">•</span>
                   <span><strong>Acúmulo automático:</strong> Todo o valor pago na sua mensalidade é revertido em créditos na sua carteira.</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <span className="text-[#ff1493] font-black text-lg">•</span>
                   <span><strong>Utilização:</strong> Use seus créditos acumulados para abater o valor de tatuagens, piercings ou produtos físicos no estúdio.</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <span className="text-[#ff1493] font-black text-lg">•</span>
                   <span><strong>Validade:</strong> Seus créditos não expiram desde que a sua assinatura permaneça ativa.</span>
                 </li>
               </ul>
            </div>

            {/* Transações (Histórico de onde vieram os créditos) */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><History size={18} className="text-[#ff1493]"/> Origem dos Créditos</h4>
              <ul className="space-y-3">
                <li className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full text-green-600"><CheckCircle size={16}/></div>
                    <div>
                      <strong className="text-sm text-gray-700 block">Mensalidade Paga - VIP Dyoli</strong>
                      <span className="text-xs text-gray-400">10 Jun 2026</span>
                    </div>
                  </div>
                  <span className="font-bold text-green-600 text-sm">+ R$ 54,90</span>
                </li>
                <li className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full text-green-600"><CheckCircle size={16}/></div>
                    <div>
                      <strong className="text-sm text-gray-700 block">Mensalidade Paga - VIP Dyoli</strong>
                      <span className="text-xs text-gray-400">10 Mai 2026</span>
                    </div>
                  </div>
                  <span className="font-bold text-green-600 text-sm">+ R$ 54,90</span>
                </li>
              </ul>
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

        {/* ABA: CLUBE TATTOO */}
        {activeTab === "clube" && isClubeTattoo && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-2xl p-6">
              <h3 className="text-2xl font-black text-[#ff1493] flex items-center gap-2 mb-4">
                ⭐ Benefícios Exclusivos
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100">
                  <span className="block text-xs font-bold text-gray-500 uppercase">Créditos Acumulados</span>
                  <span className="block text-2xl font-black text-gray-800 mt-1">R$ {creditos.toFixed(2).replace('.', ',')}</span>
                  <Link href="/painel/creditos" className="text-xs font-bold text-[#ff1493] hover:underline mt-2 inline-block">Ver histórico →</Link>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100">
                  <span className="block text-xs font-bold text-gray-500 uppercase">Giros Disponíveis</span>
                  <span className="block text-2xl font-black text-gray-800 mt-1">{giros}</span>
                  <Link href="/painel/giro" className="text-xs font-bold text-[#ff1493] hover:underline mt-2 inline-block">Tentar a sorte →</Link>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100 col-span-2">
                  <span className="block text-xs font-bold text-gray-500 uppercase">Fidelidade</span>
                  <div className="flex justify-between items-center mt-2">
                    <span className="block text-lg font-black text-gray-800">{fidelidadeMeses} meses consecutivos</span>
                    <Link href="/painel/fidelidade" className="text-xs font-bold text-white bg-[#ff1493] px-3 py-1.5 rounded-full hover:bg-pink-600 transition-colors">Ver benefícios</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

          </div>
        </div>
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
