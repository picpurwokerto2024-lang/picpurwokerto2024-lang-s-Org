import React, { useState } from 'react';
import { AppState, SavingsGoal } from '../types';
import { formatRupiah, formatDateShort } from '../services/utils';
import {
  Target,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Coins,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SavingsGoalViewProps {
  state: AppState;
  totals: {
    balance: number;
    allocatedSavings: number;
    unallocatedCash: number;
  };
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  onUpdateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  onDeleteGoal: (id: string) => void;
}

export const SavingsGoalView: React.FC<SavingsGoalViewProps> = ({
  state,
  totals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [selectedGoalForAllocation, setSelectedGoalForAllocation] = useState<SavingsGoal | null>(null);

  // Form
  const [formTitle, setFormTitle] = useState('');
  const [formTarget, setFormTarget] = useState<number | ''>('');
  const [formAllocated, setFormAllocated] = useState<number | ''>(0);
  const [formDeadline, setFormDeadline] = useState('');
  const [formIcon, setFormIcon] = useState('🎯');
  const [formNotes, setFormNotes] = useState('');

  // Allocation form
  const [allocateAmount, setAllocateAmount] = useState<number | ''>('');
  const [allocateAction, setAllocateAction] = useState<'deposit' | 'withdraw'>('deposit');

  const icons = ['🎯', '🌴', '❄️', '🎁', '🏆', '🍿', '💡', '📚', '🧹', '🎨', '🎪'];

  const openAdd = () => {
    setEditingGoal(null);
    setFormTitle('');
    setFormTarget('');
    setFormAllocated(0);
    setFormDeadline('');
    setFormIcon('🎯');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditingGoal(g);
    setFormTitle(g.title);
    setFormTarget(g.targetAmount);
    setFormAllocated(g.currentAllocatedAmount);
    setFormDeadline(g.deadline || '');
    setFormIcon(g.icon);
    setFormNotes(g.notes || '');
    setIsModalOpen(true);
  };

  const openAllocation = (g: SavingsGoal) => {
    setSelectedGoalForAllocation(g);
    setAllocateAmount('');
    setAllocateAction('deposit');
    setIsAllocateModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formTarget || Number(formTarget) <= 0) return;

    if (editingGoal) {
      onUpdateGoal(editingGoal.id, {
        title: formTitle.trim(),
        targetAmount: Number(formTarget),
        currentAllocatedAmount: Number(formAllocated) || 0,
        deadline: formDeadline || undefined,
        icon: formIcon,
        notes: formNotes.trim() || undefined,
      });
    } else {
      onAddGoal({
        title: formTitle.trim(),
        targetAmount: Number(formTarget),
        currentAllocatedAmount: Number(formAllocated) || 0,
        deadline: formDeadline || undefined,
        icon: formIcon,
        notes: formNotes.trim() || undefined,
        isCompleted: (Number(formAllocated) || 0) >= Number(formTarget),
      });
    }

    setIsModalOpen(false);
  };

  const handleProcessAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForAllocation || !allocateAmount || Number(allocateAmount) <= 0) return;

    const amt = Number(allocateAmount);
    let newAlloc = selectedGoalForAllocation.currentAllocatedAmount;

    if (allocateAction === 'deposit') {
      if (amt > totals.unallocatedCash) {
        alert(`Saldo kas bebas yang tersedia hanya ${formatRupiah(totals.unallocatedCash)}.`);
        return;
      }
      newAlloc += amt;
    } else {
      if (amt > newAlloc) {
        alert('Nominal penarikan melebihi dana yang telah dialokasikan.');
        return;
      }
      newAlloc -= amt;
    }

    onUpdateGoal(selectedGoalForAllocation.id, {
      currentAllocatedAmount: newAlloc,
    });

    if (newAlloc >= selectedGoalForAllocation.targetAmount) {
      try {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
      } catch (e) {
        // ignore
      }
    }

    setIsAllocateModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-700" />
            <span>Celengan & Target Tabungan Kelas</span>
          </h2>
          <p className="text-xs text-slate-500">
            Alokasikan sebagian saldo kas untuk rencana bersama (piknik, kado, fasilitas kelas)
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Buat Target Baru</span>
        </button>
      </div>

      {/* 2. Allocation Cash Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Saldo Kas Nyata</span>
          <div className="text-base font-bold text-slate-900 mt-0.5">
            {formatRupiah(totals.balance)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 shadow-xs">
          <span className="text-[11px] font-semibold text-teal-700">Dialokasikan ke Target</span>
          <div className="text-base font-bold text-teal-800 mt-0.5">
            {formatRupiah(totals.allocatedSavings)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700">Saldo Bebas Operasional</span>
          <div className="text-base font-bold text-emerald-800 mt-0.5">
            {formatRupiah(totals.unallocatedCash)}
          </div>
        </div>
      </div>

      {/* 3. Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.savingsGoals.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
            Belum ada celengan target yang dibuat. Klik tombol di atas untuk membuat target impian kelas!
          </div>
        ) : (
          state.savingsGoals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAllocatedAmount / goal.targetAmount) * 100));
            const isDone = pct >= 100;

            return (
              <div
                key={goal.id}
                className={`p-4 rounded-2xl bg-white border transition-all shadow-xs flex flex-col justify-between ${
                  isDone ? 'border-emerald-300 ring-1 ring-emerald-500/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0">
                        {goal.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{goal.title}</h4>
                          {isDone && (
                            <span className="p-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        {goal.deadline && (
                          <p className="text-[11px] text-slate-400">
                            Target tercapai: {formatDateShort(goal.deadline)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(goal)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus target celengan "${goal.title}"?`)) {
                            onDeleteGoal(goal.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {goal.notes && (
                    <p className="text-xs text-slate-600 mt-2.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {goal.notes}
                    </p>
                  )}

                  {/* Progress Bar & Amount */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between items-baseline text-xs">
                      <div>
                        <span className="font-extrabold text-teal-900 text-sm">
                          {formatRupiah(goal.currentAllocatedAmount)}
                        </span>
                        <span className="text-slate-400 text-[11px]"> / {formatRupiah(goal.targetAmount)}</span>
                      </div>
                      <span
                        className={`font-bold text-xs ${
                          isDone ? 'text-emerald-600 font-extrabold' : 'text-teal-700'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isDone ? 'bg-emerald-500' : 'bg-teal-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Allocation Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-500">
                    {isDone ? '🎉 Target Tercapai!' : `Kurang ${formatRupiah(goal.targetAmount - goal.currentAllocatedAmount)}`}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {goal.currentAllocatedAmount > 0 && (
                      <button
                        title="Kurangi Saldo Bar"
                        onClick={() => {
                          setSelectedGoalForAllocation(goal);
                          setAllocateAction('withdraw');
                          setAllocateAmount('');
                          setIsAllocateModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200"
                      >
                        - Kurangi Dana
                      </button>
                    )}

                    <button
                      title="Tambah Saldo Bar"
                      onClick={() => {
                        setSelectedGoalForAllocation(goal);
                        setAllocateAction('deposit');
                        setAllocateAmount('');
                        setIsAllocateModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition border border-teal-200"
                    >
                      <Coins className="w-3.5 h-3.5 text-teal-600" />
                      <span>+ Tambah Dana</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Add / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingGoal ? 'Edit Target Celengan' : 'Buat Target Celengan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="my-3 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pilih Ikon</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {icons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setFormIcon(ic)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition ${
                        formIcon === ic
                          ? 'bg-teal-100 border-2 border-teal-600 scale-105'
                          : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Target Tabungan</label>
                <input
                  type="text"
                  placeholder="Misal: Piknik & Bakar Jagung Kelas"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    placeholder="500000"
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 font-bold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Tanggal Selesai (Opsional)</label>
                <input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Keperluan atau rincian alokasi target..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Allocation Modal (Deposit / Withdraw from Main Cash) */}
      {isAllocateModalOpen && selectedGoalForAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedGoalForAllocation.icon}</span>
                <h3 className="text-sm font-bold text-slate-900">{selectedGoalForAllocation.title}</h3>
              </div>
              <button
                onClick={() => setIsAllocateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessAllocation} className="my-3 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAllocateAction('deposit')}
                  className={`py-2 rounded-xl font-bold transition ${
                    allocateAction === 'deposit'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  + Setor ke Celengan
                </button>

                <button
                  type="button"
                  onClick={() => setAllocateAction('withdraw')}
                  className={`py-2 rounded-xl font-bold transition ${
                    allocateAction === 'withdraw'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  - Ambil / Pakai
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    placeholder="50000"
                    value={allocateAmount}
                    onChange={(e) => setAllocateAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 font-bold text-sm"
                  />
                </div>
                {allocateAction === 'deposit' && (
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Saldo kas bebas tersedia: <strong>{formatRupiah(totals.unallocatedCash)}</strong>
                  </span>
                )}
                {allocateAction === 'withdraw' && (
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Dana di celengan saat ini: <strong>{formatRupiah(selectedGoalForAllocation.currentAllocatedAmount)}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs"
                >
                  Proses Alokasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
