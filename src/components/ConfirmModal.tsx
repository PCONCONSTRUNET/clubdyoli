import { AlertTriangle, Info, AlertCircle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  type = "info",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: <AlertTriangle size={32} className="text-red-500" />,
      bgIcon: "bg-red-50",
      btnConfirm: "bg-red-500 hover:bg-red-600 text-white shadow-[0_8px_20px_-6px_rgba(239,68,68,0.5)]",
    },
    warning: {
      icon: <AlertCircle size={32} className="text-amber-500" />,
      bgIcon: "bg-amber-50",
      btnConfirm: "bg-amber-500 hover:bg-amber-600 text-white shadow-[0_8px_20px_-6px_rgba(245,158,11,0.5)]",
    },
    info: {
      icon: <Info size={32} className="text-[#ff1493]" />,
      bgIcon: "bg-pink-50",
      btnConfirm: "bg-[#ff1493] hover:bg-[#e91e63] text-white shadow-[0_8px_20px_-6px_rgba(255,20,147,0.5)]",
    },
  };

  const currentStyle = typeStyles[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl w-full max-w-[95vw] sm:max-w-sm flex flex-col overflow-y-auto max-h-[90vh] animate-in zoom-in-95 border border-white/50">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 bg-white/50 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="p-8 pb-6 flex flex-col items-center text-center mt-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${currentStyle.bgIcon}`}>
            {currentStyle.icon}
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-500 font-medium text-sm leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-6 pt-2 flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className={`w-full py-3.5 rounded-xl font-bold transition-all active:scale-95 ${currentStyle.btnConfirm}`}
          >
            {confirmText}
          </button>
          <button 
            onClick={onCancel}
            className="w-full py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
