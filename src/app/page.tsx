"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [modalType, setModalType] = useState<"login" | "cadastro" | null>(null);
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ texto: "", tipo: "" });

  const openModal = (type: "login" | "cadastro") => {
    setModalType(type);
    setMensagem({ texto: "", tipo: "" });
  };
  const closeModal = () => {
    setModalType(null);
    setCpf("");
    setTelefone("");
    setNome("");
    setSenha("");
    setMensagem({ texto: "", tipo: "" });
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(value);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    setTelefone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ texto: "", tipo: "" });

    if (!cpf || !senha) {
      setMensagem({ texto: "Preencha CPF e Senha.", tipo: "erro" });
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      setMensagem({ texto: "CPF inválido.", tipo: "erro" });
      return;
    }

    // Alguns projetos no Supabase validam o domínio do e-mail (se ele existe de verdade)
    // Para evitar o erro "Email address is invalid", usaremos o gmail com um prefixo.
    const emailFalso = `dyoli${cleanCpf}@gmail.com`;
    setLoading(true);

    try {
      if (modalType === 'cadastro') {
        if (!nome) {
          setMensagem({ texto: "Preencha seu Nome.", tipo: "erro" });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: emailFalso,
          password: senha,
          options: {
            data: {
              nome: nome,
              telefone: telefone,
              cpf: cleanCpf,
            }
          }
        });

        if (error) throw error;
        setModalType('login');
        setMensagem({ texto: "Conta criada com sucesso! Agora é só entrar.", tipo: "sucesso" });

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailFalso,
          password: senha,
        });

        if (error) throw error;
        setMensagem({ texto: "Login realizado com sucesso! Redirecionando...", tipo: "sucesso" });
        router.push('/painel');
      }
    } catch (error: any) {
      let errorMsg = error.message;
      if (errorMsg.includes("User already registered")) errorMsg = "CPF já cadastrado.";
      if (errorMsg.includes("Invalid login credentials")) errorMsg = "CPF ou senha incorretos.";
      setMensagem({ texto: errorMsg, tipo: "erro" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="responsive-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
        position: "relative",
      }}
    >
      <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, marginTop: "15vh" }}>
        
        {/* Texto removido pois já faz parte da imagem de fundo */}

        {/* Botões Principais */}
        <div style={{ display: "flex", gap: 20, flexDirection: 'column', width: '100%', maxWidth: 320 }}>
          <button
            onClick={() => openModal('login')}
            className="w-full font-montserrat bg-[#ff4081] tattoo-pattern text-white px-8 py-4 rounded-full font-semibold tracking-wider text-sm shadow-[0_8px_20px_-6px_rgba(255,64,129,0.6)] hover:bg-[#e91e63] hover:-translate-y-1 transition-all duration-300"
          >
            Acessar Minha Conta
          </button>
          
          <button
            onClick={() => openModal('cadastro')}
            className="w-full font-montserrat bg-[#ff4081] tattoo-pattern text-white px-8 py-4 rounded-full font-semibold tracking-wider text-sm shadow-[0_8px_20px_-6px_rgba(255,64,129,0.6)] hover:bg-[#e91e63] hover:-translate-y-1 transition-all duration-300"
          >
            Fazer Parte do Club
          </button>
        </div>
      </div>

      {/* Modal Overlay com Glassmorphism */}
      {modalType && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          zIndex: 100,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 105, 180, 0.4)",
            borderRadius: 24,
            padding: "40px 30px",
            width: "100%",
            maxWidth: 400,
            position: "relative",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.3)"
          }}>
            <button 
              onClick={closeModal}
              style={{
                position: "absolute", top: 15, right: 20,
                background: "none", border: "none", color: "#ff1493",
                fontSize: 28, cursor: "pointer"
              }}
            >
              &times;
            </button>
            
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <img 
                src="/mascote_dyoli.png" 
                alt="Mascote Dyoli" 
                style={{ height: 120, margin: "0 auto 15px auto", objectFit: "contain" }}
              />
              <h2 style={{ color: "#ff1493", fontSize: 24, fontWeight: 800 }}>
                {modalType === 'login' ? 'Bem-vinda de volta' : 'Criar sua conta'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {mensagem.texto && (
                <div style={{
                  padding: 10,
                  borderRadius: 8,
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "#fff",
                  backgroundColor: mensagem.tipo === "erro" ? "#e74c3c" : "#2ecc71"
                }}>
                  {mensagem.texto}
                </div>
              )}

              {modalType === 'cadastro' && (
                <input 
                  type="text" 
                  placeholder="Nome Completo"
                  className="dyoli-input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              )}
              <input 
                type="text" 
                placeholder="CPF"
                className="dyoli-input"
                value={cpf}
                onChange={handleCpfChange}
                maxLength={14}
              />
              {modalType === 'cadastro' && (
                <input 
                  type="tel" 
                  placeholder="Telefone"
                  className="dyoli-input"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  maxLength={15}
                />
              )}
              <input 
                type="password" 
                placeholder="Senha"
                className="dyoli-input"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />

              <button 
                type="submit"
                disabled={loading}
                className="w-full font-montserrat bg-[#ff4081] tattoo-pattern text-white px-8 py-4 rounded-full font-semibold tracking-wider text-sm shadow-[0_8px_20px_-6px_rgba(255,64,129,0.6)] hover:bg-[#e91e63] hover:-translate-y-1 transition-all duration-300 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Aguarde...' : (modalType === 'login' ? 'Entrar no Clube' : 'Concluir Cadastro')}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
