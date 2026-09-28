import React from 'react';
import { Eye, X, Smartphone, Users } from 'lucide-react';
import { VisitorPresence } from '../types';
import { timeAgoIndo } from '../services/utils';

interface VisitorArrivalToastProps {
  toast: {
    id: string;
    visitor: VisitorPresence;
    timestamp: Date;
  } | null;
  onDismiss: () => void;
}

export const VisitorArrivalToast: React.FC<VisitorArrivalToastProps> = ({
  toast,
  onDismiss,
}) => {
  if (!toast) return null;

  const { visitor } = toast;

  return (
    <div className="fixed top-14 sm:top-16 right-3 sm:right-6 z-50 max-w-sm w-full animate-in slide-in-from-top-3 duration-300 pointer-events-auto print:hidden">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-start gap-3">
        {/* Animated Green Pulse Indicator */}
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-emerald-300">Wali Murid Membuka Aplikasi</span>
            <span className="text-[10px] text-slate-400">• Baru saja</span>
          </div>
          <p className="text-xs text-slate-200 mt-0.5 leading-snug">
            Ada orang tua / wali murid yang sedang membuka & memantau kas kelas.
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-emerald-200/80 bg-white/10 px-2 py-0.5 rounded-lg w-fit">
            <Smartphone className="w-3 h-3" />
            <span className="truncate">{visitor.device}</span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
