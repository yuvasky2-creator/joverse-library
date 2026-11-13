import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-[0_12px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl text-xs font-semibold animate-slideUp transition-all ${
              isSuccess
                ? "bg-[#18181c]/95 border-emerald-500/40 text-[#f4f4f5] shadow-[0_0_20px_rgba(74,222,128,0.15)]"
                : isError
                ? "bg-[#18181c]/95 border-red-500/40 text-red-400"
                : "bg-[#18181c]/95 border-[rgba(255,255,255,0.15)] text-[#f4f4f5]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {isError && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              <span className="truncate">{toast.message}</span>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-full text-[var(--mid)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
