"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, CreditCard, Ticket, Users, LogOut, Settings, Handshake, List, Gift, UserCheck, CheckSquare, Loader2, Menu, X } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/admin");
        return;
      }

      // Verifica se é admin na tabela profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        router.push("/admin");
        return;
      }

      setIsAuthorized(true);
    };

    checkAuth();
  }, [router]);

  const menuItems = [
    { nome: "Dashboard", href: "/admin/dashboard", icone: LayoutDashboard },
    { nome: "Validar Cupom", href: "/admin/dashboard/validar", icone: CheckSquare },
    { nome: "Assinantes", href: "/admin/dashboard/assinantes", icone: UserCheck },
    { nome: "Sorteios", href: "/admin/dashboard/sorteios", icone: Gift },
    { nome: "Planos", href: "/admin/dashboard/planos", icone: List },
    { nome: "Pagamentos", href: "/admin/dashboard/pagamentos", icone: CreditCard },
    { nome: "Cupons", href: "/admin/dashboard/cupons", icone: Ticket },
    { nome: "Clientes", href: "/admin/dashboard/clientes", icone: Users },
    { nome: "Parceria", href: "/admin/dashboard/parceria", icone: Handshake },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin");
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col items-center justify-center font-montserrat">
        <Loader2 className="animate-spin text-[#ff1493] mb-4" size={48} />
        <p className="text-gray-500 font-bold tracking-widest text-sm uppercase animate-pulse">Verificando Credenciais Seguras...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex font-montserrat">
      {/* Sidebar Desktop */}
      <aside className="w-72 bg-white border-r border-gray-100 flex-col hidden md:flex sticky top-0 h-screen shadow-[10px_0_30px_rgba(0,0,0,0.02)]">
        <div className="p-8 pb-6 text-center border-b border-gray-50">
          <div className="w-16 h-16 bg-gradient-to-br from-[#ff1493] to-[#ff4081] rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_10px_20px_rgba(255,20,147,0.2)]">
            <Settings className="text-white" size={32} />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Dyoli Admin</h1>
          <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-widest">Painel de Controle</p>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icone;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive 
                    ? "bg-[#ff1493]/10 text-[#ff1493]" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={20} className={isActive ? "text-[#ff1493]" : "text-gray-400"} />
                {item.nome}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-gray-50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 w-full transition-all duration-200"
          >
            <LogOut size={20} />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Drawer Mobile Background */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Mobile */}
      <aside 
        className={`fixed inset-y-0 left-0 w-[280px] bg-white flex flex-col z-50 shadow-2xl transform transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-8 pb-6 text-center border-b border-gray-50 relative">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
          <div className="w-16 h-16 bg-gradient-to-br from-[#ff1493] to-[#ff4081] rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_10px_20px_rgba(255,20,147,0.2)]">
            <Settings className="text-white" size={32} />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Dyoli Admin</h1>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icone;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive 
                    ? "bg-[#ff1493]/10 text-[#ff1493]" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={20} className={isActive ? "text-[#ff1493]" : "text-gray-400"} />
                {item.nome}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-gray-50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 w-full transition-all duration-200"
          >
            <LogOut size={20} />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Area de Conteúdo */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        {/* Topbar Mobile */}
        <header className="md:hidden bg-white p-4 flex items-center justify-between border-b shadow-sm z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-[#ff1493] to-[#ff4081] rounded-xl flex items-center justify-center shadow-sm">
              <Settings className="text-white" size={20} />
            </div>
            <span className="font-black text-gray-900 truncate">Dyoli Admin</span>
          </div>
          <button onClick={handleLogout} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={20} />
          </button>
        </header>

        {/* Content com scroll interno */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 bg-[#fbfcfd]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
