"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Gift, Ticket, User } from "lucide-react";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Início", path: "/painel", icon: Home },
    { name: "Sorteios", path: "/painel/sorteios", icon: Gift },
    { name: "Cupons", path: "/painel/cupons", icon: Ticket },
    { name: "Perfil", path: "/painel/perfil", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#fff8fb] font-montserrat pb-24 md:pb-8 relative">
      {children}

      {/* Rodapé Mobile (Menu Fixo) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-pink-100 z-50 px-6 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center max-w-sm mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive ? "text-[#ff1493]" : "text-gray-400 hover:text-[#ff1493]"
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
