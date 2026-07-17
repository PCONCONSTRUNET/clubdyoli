"use client";

import { useEffect, useState } from "react";
import { Ticket, ArrowLeft, Download, Gift, Globe, QrCode } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function CuponsPage() {
  const [cupons, setCupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    fetchMyCupons();
  }, []);

  const fetchMyCupons = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const currentUserId = session.user.id;
    setUserId(currentUserId);
    
    // 1. Buscar assinaturas ativas do usuário para saber de quais clubes ele faz parte
    const { data: assinaturasData } = await supabase
      .from('assinaturas')
      .select('plano_opcoes(plano_id)')
      .eq('user_id', currentUserId)
      .eq('status', 'Ativa');
      
    const myActivePlanosIds = new Set(
      (assinaturasData || []).map((a: any) => a.plano_opcoes?.plano_id).filter(id => id)
    );

    // 2. Buscar cupons enviados especificamente para o cliente (Exclusivos ou Globais forçados)
    const { data: userCuponsData, error: userCuponsError } = await supabase
      .from('user_cupons')
      .select('cupom_id, usado_em, cupons(*)')
      .eq('user_id', currentUserId);

    let myCupons: any[] = [];
    if (!userCuponsError && userCuponsData) {
      myCupons = userCuponsData.map((uc: any) => {
        if (uc.cupons) {
          uc.cupons.usado_em = uc.usado_em;
        }
        return uc.cupons;
      }).filter(c => c !== null);
    }

    // 3. Buscar cupons Globais disponíveis para todos (ou para os clubes do usuário)
    const { data: globalCuponsData, error: globalCuponsError } = await supabase
      .from('cupons')
      .select('*')
      .eq('is_global', true)
      .eq('status', 'Ativo');

    if (!globalCuponsError && globalCuponsData) {
      const myCupomIds = new Set(myCupons.map(c => c.id));
      for (const gc of globalCuponsData) {
        if (!myCupomIds.has(gc.id)) {
          // Se o cupom global tem um plano específico, o usuário precisa estar nesse plano
          if (!gc.plano_id || myActivePlanosIds.has(gc.plano_id)) {
            myCupons.push(gc);
          }
        }
      }
    }

    // Ordenar: Ativos e não usados primeiro
    myCupons.sort((a, b) => {
      const aExpired = a.validade && a.validade !== "Sem validade" ? new Date(a.validade) < new Date() : false;
      const bExpired = b.validade && b.validade !== "Sem validade" ? new Date(b.validade) < new Date() : false;
      const aUsed = !!a.usado_em;
      const bUsed = !!b.usado_em;
      const aCanUse = a.status === 'Ativo' && !aExpired && !aUsed;
      const bCanUse = b.status === 'Ativo' && !bExpired && !bUsed;

      if (aCanUse && !bCanUse) return -1;
      if (!aCanUse && bCanUse) return 1;
      return 0;
    });

    setCupons(myCupons);
    setLoading(false);
  };

  const formatValidade = (dataIso: string) => {
    if (!dataIso || dataIso === "Sem validade") return "Sem validade definida";
    const d = new Date(dataIso);
    if (isNaN(d.getTime())) return dataIso; // Fallback se ainda tiver texto antigo no BD
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleDownloadPDF = (cupom: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const isPremio = cupom.tipo === 'Premio';
    const mainText = isPremio ? cupom.valor_premio : `${cupom.porcentagem_desconto}% OFF`;
    const subText = isPremio ? 'Resgate de Prêmio' : 'Desconto Especial';
    const validade = cupom.validade && cupom.validade !== "Sem validade" ? new Date(cupom.validade).toLocaleDateString('pt-BR') : 'Sem validade definida';
    const dateToday = new Date().toLocaleDateString('pt-BR');
    const dateCreated = cupom.created_at ? new Date(cupom.created_at).toLocaleDateString('pt-BR') : null;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Voucher - Dyoli Club</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; background: #f8fafc; margin: 0; padding: 40px; display: flex; flex-direction: column; align-items: center; }
            @media print {
              body { padding: 0; background: white; margin: 0; }
              @page { size: landscape; margin: 0; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .no-print { display: none !important; }
            }
            .wrapper { width: 100%; max-width: 800px; padding: 40px; margin-top: 20px; }
            @media print { .wrapper { max-width: 100%; padding: 10mm; margin-top: 0; } }
            
            .ticket { display: flex; width: 100%; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.15); color: white; position: relative; }
            .ticket.desconto { background: linear-gradient(135deg, #ff1493, #ff6b6b); }
            .ticket.premio { background: linear-gradient(135deg, #10b981, #2dd4bf); }
            
            .left { flex: 1; padding: 40px; position: relative; display: flex; flex-direction: column; justify-content: space-between; }
            .right { width: 250px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 40px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 3px dashed rgba(255,255,255,0.4); position: relative; }
            
            .cutout-top, .cutout-bottom { position: absolute; width: 40px; height: 40px; border-radius: 50%; left: -20px; background: #f8fafc; }
            @media print { .cutout-top, .cutout-bottom { background: white; } }
            .cutout-top { top: -20px; }
            .cutout-bottom { bottom: -20px; }
            
            .brand { font-size: 14px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 40px; opacity: 0.9; }
            .title { font-size: 64px; font-weight: 900; line-height: 1; margin: 0 0 10px 0; }
            .subtitle { font-size: 24px; font-weight: 700; opacity: 0.9; margin: 0; }
            
            .info-box { margin-top: 40px; }
            .info-label { font-size: 14px; opacity: 0.8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
            .info-value { font-size: 18px; font-weight: 700; margin-top: 5px; }
            
            .qrcode { width: 140px; height: 140px; background: white; border-radius: 16px; padding: 10px; margin-bottom: 20px; object-fit: contain; }
            .code-box { background: rgba(0,0,0,0.2); padding: 10px 20px; border-radius: 8px; font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 2px; text-align: center; width: 100%; box-sizing: border-box;}
            
            .footer-text { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; line-height: 1.6; font-weight: 500; }

            .close-btn { position: absolute; top: 20px; left: 20px; padding: 10px 20px; background: white; border: 1px solid #e2e8f0; border-radius: 20px; color: #334155; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.05); font-size: 14px; display: flex; align-items: center; gap: 8px; text-decoration: none; z-index: 10; font-family: 'Inter', sans-serif;}
            .close-btn:hover { background: #f8fafc; }
          </style>
        </head>
        <body>
          <button class="close-btn no-print" onclick="window.close()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Voltar
          </button>
          <div class="wrapper">
            <div class="ticket ${isPremio ? 'premio' : 'desconto'}">
              <div class="left">
                <div class="brand">DYOLI CLUB • VOUCHER OFICIAL</div>
                <div>
                  <h1 class="title">${mainText}</h1>
                  <h2 class="subtitle">${subText}</h2>
                </div>
                <div class="info-box">
                  <div class="info-label">Válido até</div>
                  <div class="info-value">${validade}</div>
                </div>
              </div>
              <div class="right">
                <div class="cutout-top"></div>
                <div class="cutout-bottom"></div>
                <img class="qrcode" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${cupom.codigo}|${userId}" alt="QR Code">
                <div class="code-box">${cupom.codigo}</div>
              </div>
            </div>
            <div class="footer-text">
              Apresente este documento impresso ou na tela do seu celular na recepção do estúdio.<br>
              Emitido em ${dateToday} ${dateCreated ? `| Criado/Ativado em ${dateCreated}` : ''}
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-[#ff1493] font-bold animate-pulse">Carregando cupons...</p></div>;
  }

  return (
    <main className="max-w-2xl mx-auto px-6 pt-12 pb-20">
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
          <p className="text-gray-500 font-medium mt-1">Seus descontos e prêmios reais estão aqui</p>
        </div>
      </div>

      {cupons.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-[0_15px_40px_rgba(255,105,180,0.1)] text-center">
          <div className="text-6xl mb-4">🎟️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sua carteira está vazia</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Você ainda não tem nenhum cupom de desconto ou prêmio. Assine um plano ou participe de sorteios para ganhar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cupons.map((cupom, idx) => {
            const isExpired = cupom.validade && cupom.validade !== "Sem validade" ? new Date(cupom.validade) < new Date() : false;
            const isUsed = !!cupom.usado_em;
            const canUse = cupom.status === 'Ativo' && !isExpired && !isUsed;

            return (
              <div 
                key={idx} 
                className={`relative overflow-hidden flex flex-col sm:flex-row rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                  canUse 
                    ? (cupom.tipo === 'Premio' 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_15px_40px_rgba(16,185,129,0.3)]' 
                        : 'bg-gradient-to-r from-[#ff1493] to-[#ff6b6b] shadow-[0_15px_40px_rgba(255,20,147,0.3)]') 
                    : 'bg-gradient-to-r from-gray-300 to-gray-400 opacity-75 grayscale'
                }`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>

                {/* Left Side: Main Info */}
                <div className="relative flex-1 p-6 sm:p-8 flex flex-col justify-between text-white">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      {cupom.is_global && canUse && (
                        <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                          <Globe size={12} /> Presente do Clube
                        </div>
                      )}
                      {!cupom.is_global && canUse && (
                        <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                          <Ticket size={12} /> Exclusivo
                        </div>
                      )}
                    </div>
                    
                    {cupom.tipo === 'Premio' ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <Gift className="text-white/80" size={24} />
                          <span className="text-white/80 font-black text-sm uppercase tracking-widest">PRÊMIO VINCULADO</span>
                        </div>
                        <h3 className="font-black text-3xl sm:text-4xl leading-tight mb-2 drop-shadow-md">{cupom.valor_premio}</h3>
                      </>
                    ) : (
                      <>
                        <span className="font-black text-5xl sm:text-6xl block mb-0 drop-shadow-md tracking-tighter">{cupom.porcentagem_desconto}% OFF</span>
                        <h3 className="font-bold text-white/90 text-xl tracking-wide">Desconto Especial</h3>
                      </>
                    )}
                  </div>

                  <div className="mt-8">
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Válido até</p>
                    <p className={`text-sm font-bold ${isExpired ? "text-red-200" : "text-white"}`}>
                      {isExpired ? "Expirado em:" : ""} {formatValidade(cupom.validade)}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative w-full sm:w-12 flex sm:flex-col items-center justify-center -my-1 sm:my-0 sm:-mx-1 z-10">
                  <div className="absolute left-[-10px] sm:left-1/2 sm:-translate-x-1/2 top-[-10px] w-6 h-6 bg-[#fff8fb] rounded-full shadow-inner"></div>
                  <div className="w-full h-0 sm:w-0 sm:h-full border-t-[3px] sm:border-l-[3px] border-dashed border-white/40 my-2 sm:my-6"></div>
                  <div className="absolute right-[-10px] sm:left-1/2 sm:-translate-x-1/2 bottom-[-10px] w-6 h-6 bg-[#fff8fb] rounded-full shadow-inner"></div>
                </div>

                {/* Right Side: QR Code & Actions */}
                <div className="relative sm:w-56 bg-white/10 backdrop-blur-md p-6 sm:p-8 flex flex-col items-center justify-center text-white border-t sm:border-t-0 sm:border-l border-white/10">
                  <div className="bg-white p-2 rounded-2xl shadow-lg mb-4 transform transition-transform hover:scale-105">
                    {canUse ? (
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${cupom.codigo}|${userId}`} alt="QR Code" className="w-20 h-20 object-contain mix-blend-multiply" />
                    ) : (
                      <QrCode className="text-gray-400 w-20 h-20" strokeWidth={1.5} />
                    )}
                  </div>
                  
                  <div className="bg-black/20 px-4 py-2 rounded-lg mb-4 w-full text-center backdrop-blur-sm">
                    <span className="text-white text-sm font-mono font-bold tracking-widest">{cupom.codigo}</span>
                  </div>

                  {canUse ? (
                    <button 
                      onClick={() => handleDownloadPDF(cupom)}
                      className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 px-4 py-3 rounded-xl font-black shadow-lg transition-all hover:bg-gray-50 hover:scale-105 active:scale-95 text-sm uppercase tracking-wide"
                    >
                      <Download size={16} /> Baixar
                    </button>
                  ) : (
                    <button disabled className="w-full px-4 py-3 rounded-xl font-bold uppercase tracking-wide cursor-not-allowed text-xs text-center bg-black/10 text-white/70 backdrop-blur-sm border border-white/10">
                      {isUsed ? `Usado em ${new Date(cupom.usado_em).toLocaleDateString('pt-BR')}` : 'Inativo / Expirado'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
