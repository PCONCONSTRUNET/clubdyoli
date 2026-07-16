"use client";

import { useState } from "react";
import {
  X,
  CreditCard,
  QrCode,
  User,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  Lock,
  Loader2,
} from "lucide-react";

interface Plano {
  id: string;
  nome: string;
  preco: string;
  desconto?: string;
  cor?: string;
}

interface CheckoutModalProps {
  plano: Plano | null;
  onClose: () => void;
  onConfirm: (plano: Plano, dados: DadosCheckout) => Promise<void>;
}

export interface DadosCheckout {
  cpf: string;
  nome: string;
  email: string;
  telefone: string;
  metodoPagamento: "cartao" | "pix";
  // Cartão
  numeroCartao?: string;
  nomeCartao?: string;
  validade?: string;
  cvv?: string;
}

function formatCpf(value: string) {
  let v = value.replace(/\D/g, "").slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return v;
}

function formatTelefone(value: string) {
  let v = value.replace(/\D/g, "").slice(0, 11);
  v = v.replace(/^(\d{2})(\d)/, "($1) $2");
  v = v.replace(/(\d{5})(\d{4})$/, "$1-$2");
  return v;
}

function formatCartao(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})/g, "$1 ")
    .trim();
}

function formatValidade(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 4)
    .replace(/(\d{2})(\d)/, "$1/$2");
}

export default function CheckoutModal({
  plano,
  onClose,
  onConfirm,
}: CheckoutModalProps) {
  const [step, setStep] = useState<"dados" | "pagamento" | "confirmando">(
    "dados"
  );
  const [loading, setLoading] = useState(false);

  // Dados pessoais
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  // Pagamento
  const [metodo, setMetodo] = useState<"cartao" | "pix">("pix");
  const [numeroCartao, setNumeroCartao] = useState("");
  const [nomeCartao, setNomeCartao] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");

  const [erro, setErro] = useState("");

  if (!plano) return null;

  const validarDados = () => {
    if (!cpf || cpf.replace(/\D/g, "").length !== 11)
      return "CPF inválido.";
    if (!nome.trim() || nome.trim().length < 3)
      return "Informe seu nome completo.";
    if (!email.trim() || !email.includes("@"))
      return "E-mail inválido.";
    if (!telefone || telefone.replace(/\D/g, "").length < 10)
      return "Telefone inválido.";
    return "";
  };

  const validarPagamento = () => {
    if (metodo === "cartao") {
      if (!numeroCartao || numeroCartao.replace(/\D/g, "").length !== 16)
        return "Número do cartão inválido.";
      if (!nomeCartao.trim()) return "Informe o nome no cartão.";
      if (!validade || validade.length < 5) return "Validade inválida.";
      if (!cvv || cvv.length < 3) return "CVV inválido.";
    }
    return "";
  };

  const handleDadosSubmit = () => {
    const err = validarDados();
    if (err) { setErro(err); return; }
    setErro("");
    setStep("pagamento");
  };

  const handlePagamentoSubmit = async () => {
    const err = validarPagamento();
    if (err) { setErro(err); return; }
    setErro("");
    setLoading(true);
    setStep("confirmando");

    await onConfirm(plano, {
      cpf: cpf.replace(/\D/g, ""),
      nome,
      email,
      telefone,
      metodoPagamento: metodo,
      numeroCartao: metodo === "cartao" ? numeroCartao : undefined,
      nomeCartao: metodo === "cartao" ? nomeCartao : undefined,
      validade: metodo === "cartao" ? validade : undefined,
      cvv: metodo === "cartao" ? cvv : undefined,
    });

    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(10px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #fff0f7 0%, #ffffff 60%)",
          borderRadius: 28,
          width: "100%",
          maxWidth: 460,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow:
            "0 30px 80px rgba(255,20,147,0.2), 0 8px 30px rgba(0,0,0,0.12)",
          position: "relative",
          border: "1px solid rgba(255,20,147,0.15)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #ff1493 0%, #ff6eb4 100%)",
            borderRadius: "28px 28px 0 0",
            padding: "24px 28px 20px",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(255,255,255,0.25)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <X size={16} />
          </button>

          <div style={{ color: "#fff" }}>
            <p style={{ fontSize: 12, opacity: 0.85, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
              Assinatura
            </p>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 2 }}>
              {plano.nome}
            </h2>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>R$</span>
              <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>
                {plano.preco.split(",")[0]}
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, opacity: 0.85 }}>
                ,{plano.preco.split(",")[1]}
              </span>
              <span style={{ fontSize: 13, opacity: 0.75, marginLeft: 4 }}>/mês</span>
            </div>
          </div>

          {/* Steps indicator */}
          <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
            {["dados", "pagamento"].map((s, i) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 4,
                  background:
                    step === "confirmando" || (step === "pagamento" && i === 0) || (step === "dados" && i === -1)
                      ? "rgba(255,255,255,0.9)"
                      : step === "pagamento" && i === 0
                      ? "rgba(255,255,255,0.9)"
                      : step === "dados" && i === 0
                      ? "rgba(255,255,255,0.9)"
                      : "rgba(255,255,255,0.35)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {[
              { key: "dados", label: "Seus dados" },
              { key: "pagamento", label: "Pagamento" },
            ].map((s, i) => (
              <p
                key={s.key}
                style={{
                  flex: 1,
                  fontSize: 10,
                  fontWeight: 600,
                  color:
                    step === s.key || (step === "confirmando" && i === 1) || (step === "pagamento" && i === 0)
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.5)",
                  textAlign: i === 0 ? "left" : "right",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </p>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px 28px" }}>
          {erro && (
            <div
              style={{
                background: "#fff0f0",
                border: "1px solid #fca5a5",
                color: "#dc2626",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 18,
              }}
            >
              ⚠️ {erro}
            </div>
          )}

          {/* === STEP: DADOS === */}
          {step === "dados" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e", marginBottom: 2 }}>
                Suas informações
              </h3>

              {/* CPF */}
              <div>
                <label style={labelStyle}>CPF *</label>
                <div style={inputWrapStyle}>
                  <ShieldCheck size={16} color="#ff1493" />
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    maxLength={14}
                  />
                </div>
              </div>

              {/* Nome */}
              <div>
                <label style={labelStyle}>Nome Completo *</label>
                <div style={inputWrapStyle}>
                  <User size={16} color="#ff1493" />
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder="Seu nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>E-mail *</label>
                <div style={inputWrapStyle}>
                  <Mail size={16} color="#ff1493" />
                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label style={labelStyle}>WhatsApp / Telefone *</label>
                <div style={inputWrapStyle}>
                  <Phone size={16} color="#ff1493" />
                  <input
                    style={inputStyle}
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                    maxLength={15}
                  />
                </div>
              </div>

              <button onClick={handleDadosSubmit} style={btnPrimaryStyle}>
                Continuar para pagamento
                <ChevronRight size={18} />
              </button>

              <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
                <Lock size={10} style={{ display: "inline", marginRight: 4 }} />
                Seus dados são protegidos e criptografados.
              </p>
            </div>
          )}

          {/* === STEP: PAGAMENTO === */}
          {step === "pagamento" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e", marginBottom: 2 }}>
                Como deseja pagar?
              </h3>

              {/* Toggle métodos */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                {(["pix", "cartao"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMetodo(m); setErro(""); }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: "14px 10px",
                      borderRadius: 14,
                      border: metodo === m
                        ? "2px solid #ff1493"
                        : "2px solid #e5e7eb",
                      background: metodo === m ? "#fff0f7" : "#f9fafb",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontWeight: 700,
                      fontSize: 13,
                      color: metodo === m ? "#ff1493" : "#6b7280",
                    }}
                  >
                    {m === "pix" ? <QrCode size={22} /> : <CreditCard size={22} />}
                    {m === "pix" ? "PIX" : "Cartão"}
                  </button>
                ))}
              </div>

              {/* PIX */}
              {metodo === "pix" && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 16,
                    padding: "20px",
                    textAlign: "center",
                  }}
                >
                  <QrCode size={64} color="#16a34a" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontWeight: 700, color: "#15803d", fontSize: 15, marginBottom: 6 }}>
                    Pague via PIX
                  </p>
                  <p style={{ fontSize: 13, color: "#4b7a5c" }}>
                    Após confirmar, você receberá o QR Code e a chave PIX para realizar o pagamento.
                  </p>
                  <div
                    style={{
                      marginTop: 14,
                      padding: "10px 16px",
                      background: "#dcfce7",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#166534",
                    }}
                  >
                    ✅ Confirmação em até 5 minutos
                  </div>
                </div>
              )}

              {/* CARTÃO */}
              {metodo === "cartao" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Número do Cartão *</label>
                    <div style={inputWrapStyle}>
                      <CreditCard size={16} color="#ff1493" />
                      <input
                        style={inputStyle}
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={numeroCartao}
                        onChange={(e) => setNumeroCartao(formatCartao(e.target.value))}
                        maxLength={19}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Nome no Cartão *</label>
                    <div style={inputWrapStyle}>
                      <User size={16} color="#ff1493" />
                      <input
                        style={inputStyle}
                        type="text"
                        placeholder="Como está no cartão"
                        value={nomeCartao}
                        onChange={(e) => setNomeCartao(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Validade *</label>
                      <div style={inputWrapStyle}>
                        <input
                          style={{ ...inputStyle, paddingLeft: 0 }}
                          type="text"
                          placeholder="MM/AA"
                          value={validade}
                          onChange={(e) => setValidade(formatValidade(e.target.value))}
                          maxLength={5}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>CVV *</label>
                      <div style={inputWrapStyle}>
                        <input
                          style={{ ...inputStyle, paddingLeft: 0 }}
                          type="text"
                          placeholder="000"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumo do pedido */}
              <div
                style={{
                  background: "#f9fafb",
                  borderRadius: 14,
                  padding: "14px 16px",
                  border: "1px solid #e5e7eb",
                  marginTop: 4,
                }}
              >
                <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Resumo
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, color: "#374151", fontWeight: 600 }}>{plano.nome}</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "#ff1493" }}>
                    R$ {plano.preco}/mês
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                  CPF: {cpf} · Cobrança mensal recorrente
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => { setStep("dados"); setErro(""); }}
                  style={btnSecondaryStyle}
                >
                  Voltar
                </button>
                <button
                  onClick={handlePagamentoSubmit}
                  style={{ ...btnPrimaryStyle, flex: 2 }}
                >
                  Confirmar assinatura
                  <ShieldCheck size={16} />
                </button>
              </div>

              <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
                <Lock size={10} style={{ display: "inline", marginRight: 4 }} />
                Pagamento seguro · Cancele quando quiser
              </p>
            </div>
          )}

          {/* === STEP: CONFIRMANDO === */}
          {step === "confirmando" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 0",
                gap: 16,
              }}
            >
              <Loader2
                size={48}
                color="#ff1493"
                style={{ animation: "spin 1s linear infinite" }}
              />
              <p style={{ fontSize: 17, fontWeight: 800, color: "#1a1a2e" }}>
                Processando assinatura...
              </p>
              <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
                Aguarde enquanto confirmamos seu pedido. Isso pode levar alguns segundos.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Inline styles reutilizáveis
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#374151",
  marginBottom: 6,
  letterSpacing: 0.3,
};

const inputWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "#fff",
  border: "1.5px solid #e5e7eb",
  borderRadius: 12,
  padding: "12px 14px",
  transition: "border-color 0.2s",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  outline: "none",
  fontSize: 14,
  color: "#1f2937",
  background: "transparent",
  fontWeight: 500,
};

const btnPrimaryStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  background: "linear-gradient(135deg, #ff1493 0%, #ff6eb4 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  padding: "15px 20px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(255,20,147,0.3)",
  transition: "transform 0.2s, box-shadow 0.2s",
  marginTop: 4,
};

const btnSecondaryStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f3f4f6",
  color: "#374151",
  border: "none",
  borderRadius: 14,
  padding: "15px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  transition: "background 0.2s",
  marginTop: 4,
};
