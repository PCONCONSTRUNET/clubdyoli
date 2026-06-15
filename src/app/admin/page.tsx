"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ texto: "", tipo: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ texto: "", tipo: "" });

    if (!email || !senha) {
      setMensagem({ texto: "Preencha e-mail e senha.", tipo: "erro" });
      return;
    }

    setLoading(true);

    try {
      // Login via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Verificar se a conta tem permissão de admin na tabela profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          await supabase.auth.signOut();
          setMensagem({ texto: "Acesso negado. Você não é administrador.", tipo: "erro" });
          setLoading(false);
          return;
        }

        setMensagem({ texto: "Login autorizado. Redirecionando...", tipo: "sucesso" });
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 1000);
      }
    } catch (error: any) {
      let errorMsg = error.message;
      if (errorMsg.includes("Invalid login credentials")) errorMsg = "E-mail ou senha incorretos.";
      setMensagem({ texto: errorMsg, tipo: "erro" });
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
        backgroundColor: "#1a1a1a", // Escuro caso a imagem não carregue
      }}
    >
      <div style={{
        background: "rgba(10, 10, 10, 0.85)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 20, 147, 0.2)",
        borderRadius: 24,
        padding: "40px 30px",
        width: "100%",
        maxWidth: 400,
        position: "relative",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
      }}>
        
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div className="w-16 h-16 bg-gradient-to-br from-[#ff1493] to-[#ff4081] rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_10px_20px_rgba(255,20,147,0.3)]">
            <Lock className="text-white" size={32} />
          </div>
          <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>
            Painel Admin
          </h2>
          <p className="text-gray-400 text-sm mt-1">Acesso restrito à diretoria</p>
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

          <div className="relative">
            <input 
              type="email" 
              placeholder="E-mail corporativo"
              className="w-full bg-black/40 border border-white/10 text-white px-5 py-4 rounded-xl focus:outline-none focus:border-[#ff1493] transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <input 
              type="password" 
              placeholder="Senha de acesso"
              className="w-full bg-black/40 border border-white/10 text-white px-5 py-4 rounded-xl focus:outline-none focus:border-[#ff1493] transition-colors"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#ff1493] to-[#ff4081] text-white px-8 py-4 rounded-xl font-bold tracking-wider shadow-[0_8px_20px_-6px_rgba(255,64,129,0.6)] hover:shadow-[0_15px_30px_-6px_rgba(255,64,129,0.8)] transition-all mt-4 disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </main>
  );
}
