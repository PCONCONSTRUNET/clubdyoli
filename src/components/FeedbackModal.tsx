"use client";

import { X, AlertCircle, CheckCircle2 } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  type: "error" | "success";
  title: string;
  message: string;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, type, title, message, onClose }: FeedbackModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl w-full max-w-[95vw] sm:max-w-sm flex flex-col overflow-y-auto max-h-[90vh] animate-in zoom-in-95 border border-white/50">
        <div className="p-6 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === 'error' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'}`}>
            {type === 'error' ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-500 text-sm">{message}</p>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-[32px]">
          <button 
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-bold text-white transition-colors shadow-md ${type === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

// Utilitário para traduzir erros comuns do Supabase
export function translateError(errorMsg: string): string {
  if (!errorMsg) return "Ocorreu um erro desconhecido.";
  
  if (errorMsg.includes('cupons_codigo_key')) {
    return "Esse código de cupom já existe. Por favor, escolha outro.";
  }
  if (errorMsg.includes('duplicate key value')) {
    return "Um registro com essa mesma informação já existe no banco de dados.";
  }
  if (errorMsg.includes('auth/user-not-found')) {
    return "Usuário não encontrado.";
  }
  
  return errorMsg; // Se não houver tradução específica, mostra o erro original
}
