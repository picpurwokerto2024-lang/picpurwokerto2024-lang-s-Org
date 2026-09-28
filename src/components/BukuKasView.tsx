import React, { useState, useMemo } from 'react';
import { AppState, Transaction, TransactionType, ExpenseCategory, IncomeCategory } from '../types';
import { formatRupiah, formatDateIndo, getCategoryLabel, getTodayDateStr } from '../services/utils';
import {
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Search,
  SlidersHorizontal,
  Image as ImageIcon,
  Trash2,
  Edit2,
  Calendar,
  X,
  Upload,
  Receipt,
  FileText,
  Building,
} from 'lucide-react';

interface BukuKasViewProps {
  state: AppState;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  initialOpenModal?: 'income' | 'expense' | null;
  onCloseInitialModal?: () => void;
}

export const BukuKasView: React.FC<BukuKasViewProps> = ({
  state,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  initialOpenModal = null,
  onCloseInitialModal,
}) => {
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(!!initialOpenModal);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  // Form fields
  const [formType, setFormType] = useState<TransactionType>(initialOpenModal || 'expense');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>('perlengkapan');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formDate, setFormDate] = useState(getTodayDateStr());
  const [formRecipient, setFormRecipient] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formReceiptImage, setFormReceiptImage] = useState<string | undefined>(undefined);

  // Zoom Receipt
  const [zoomedReceipt, setZoomedReceipt] = useState<string | null>(null);

  // Sync if initialOpenModal changes
  React.useEffect(() => {
    if (initialOpenModal) {
      setFormType(initialOpenModal);
      setFormCategory(initialOpenModal === 'income' ? 'donasi' : 'perlengkapan');
      setIsModalOpen(true);
      if (onCloseInitialModal) onCloseInitialModal();
    }
  }, [initialOpenModal, onCloseInitialModal]);

  // Available categories
  const expenseCategories: { key: ExpenseCategory; label: string }[] = [
    { key: 'perlengkapan', label: '✏️ Perlengkapan Kelas' },
    { key: 'fotokopi_tugas', label: '📄 Fotokopi & Modul' },
    { key: 'sosial_jenguk', label: '❤️ Sosial & Jenguk Teman' },
    { key: 'kegiatan_lomba', label: '🏆 Kegiatan & Lomba' },
    { key: 'kebersihan', label: '🧹 Kebersihan & Piket' },
    { key: 'konsumsi', label: '🍱 Konsumsi Rapat/Acara' },
    { key: 'lainnya', label: '📌 Lain-lain' },
  ];

  const incomeCategories: { key: IncomeCategory; label: string }[] = [
    { key: 'donasi', label: '🤲 Donasi / Sukarela' },
    { key: 'saldo_awal', label: '🏦 Saldo Awal' },
    { key: 'penjualan_bazar', label: '🛒 Bazar & Usaha Kelas' },
    { key: 'lainnya', label: '📌 Pemasukan Lain' },
  ];

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return state.transactions.filter((tx) => {
      if (activeTypeTab === 'income' && tx.type !== 'income') return false;
      if (activeTypeTab === 'expense' && tx.type !== 'expense') return false;
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = tx.title.toLowerCase().includes(query);
        const matchDesc = tx.description?.toLowerCase().includes(query);
        const matchSource = tx.recipientOrSource?.toLowerCase().includes(query);
        return matchTitle || matchDesc || matchSource;
      }

      return true;
    });
  }, [state.transactions, activeTypeTab, selectedCategory, searchQuery]);

  // Summary of filtered
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const openAddModal = (type: TransactionType) => {
    setEditingTx(null);
    setFormType(type);
    setFormCategory(type === 'income' ? 'donasi' : 'perlengkapan');
    setFormTitle('');
    setFormAmount('');
    setFormDate(getTodayDateStr());
    setFormRecipient('');
    setFormDescription('');
    setFormReceiptImage(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormCategory(tx.category);
    setFormTitle(tx.title);
    setFormAmount(tx.amount);
    setFormDate(tx.date);
    setFormRecipient(tx.recipientOrSource || '');
    setFormDescription(tx.description || '');
    setFormReceiptImage(tx.receiptImage);
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAmount || Number(formAmount) <= 0) {
      alert('Mohon isi judul transaksi dan nominal yang valid.');
      return;
    }

    if (editingTx) {
      onUpdateTransaction(editingTx.id, {
        type: formType,
        category: formCategory as any,
        title: formTitle.trim(),
        amount: Number(formAmount),
        date: formDate,
        recipientOrSource: formRecipient.trim() || undefined,
        description: formDescription.trim() || undefined,
        receiptImage: formReceiptImage,
      });
    } else {
      onAddTransaction({
        type: formType,
        category: formCategory as any,
        title: formTitle.trim(),
        amount: Number(formAmount),
        date: formDate,
        recipientOrSource: formRecipient.trim() || undefined,
        description: formDescription.trim() || undefined,
        receiptImage: formReceiptImage,
        recordedBy: state.classConfig.treasurerName.split(' ')[0],
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-700" />
            <span>Buku Kas & Transaksi Kelas</span>
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan pengeluaran, nota bukti fisik, dan pemasukan non-iuran
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openAddModal('expense')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
          >
            <TrendingDown className="w-4 h-4" />
            <span>+ Catat Pengeluaran</span>
          </button>

          <button
            onClick={() => openAddModal('income')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Pemasukan Lain</span>
          </button>
        </div>
      </div>

      {/* 2. Type Tabs & Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div
          onClick={() => setActiveTypeTab('all')}
          className={`p-3 rounded-2xl border cursor-pointer transition ${
            activeTypeTab === 'all'
              ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500">Semua Catatan</span>
          <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
            {summary.count} Transaksi
          </div>
        </div>

        <div
          onClick={() => setActiveTypeTab('expense')}
          className={`p-3 rounded-2xl border cursor-pointer transition ${
            activeTypeTab === 'expense'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700">Total Pengeluaran</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-sm sm:text-base font-bold text-rose-600 mt-0.5">
            {formatRupiah(summary.expense)}
          </div>
        </div>

        <div
          onClick={() => setActiveTypeTab('income')}
          className={`col-span-2 sm:col-span-1 p-3 rounded-2xl border cursor-pointer transition ${
            activeTypeTab === 'income'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700">Pemasukan Non-Iuran</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-sm sm:text-base font-bold text-emerald-600 mt-0.5">
            {formatRupiah(summary.income)}
          </div>
        </div>
      </div>

      {/* 3. Search & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi (spidol, fotokopi, toko, donasi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          />
        </div>

        {/* Category Dropdown Filter */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-xs text-slate-500 hidden sm:inline">Kategori:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          >
            <option value="all">Semua Kategori</option>
            <optgroup label="Pengeluaran">
              {expenseCategories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Pemasukan">
              {incomeCategories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* 4. Transactions List */}
      <div className="space-y-2.5">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 px-4 text-center bg-white rounded-2xl border border-slate-200 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3 text-2xl">
              📖
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Buku Kas Masih Kosong</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              Belum ada pencatatan kas masuk atau pengeluaran. Klik tombol <strong>+ Pemasukan Kas</strong> atau <strong>- Pengeluaran Kas</strong> di atas untuk mulai mencatat.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const cat = getCategoryLabel(tx.category);
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left details */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 border mt-0.5 ${
                      isIncome
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {cat.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {tx.title}
                      </h4>
                      <span className={`px-2 py-0.2 rounded-md text-[10px] font-semibold border ${cat.color}`}>
                        {cat.label}
                      </span>
                    </div>

                    {tx.description && (
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{tx.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDateIndo(tx.date)}
                      </span>
                      {tx.recipientOrSource && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          {tx.recipientOrSource}
                        </span>
                      )}
                      {tx.recordedBy && <span>Oleh: {tx.recordedBy}</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div
                      className={`text-sm sm:text-base font-extrabold ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                    </div>
                    {tx.receiptImage ? (
                      <button
                        onClick={() => setZoomedReceipt(tx.receiptImage!)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Lihat Nota Bukti</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">Tanpa lampiran nota</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(tx)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Transaksi"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus transaksi "${tx.title}"?`)) {
                          onDeleteTransaction(tx.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Add / Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTx ? 'Edit Catatan Transaksi' : formType === 'income' ? 'Catat Pemasukan Kas' : 'Catat Pengeluaran Kas'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="my-3 space-y-3 text-xs overflow-y-auto pr-1 flex-1">
              {/* Type Switcher */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('expense');
                      setFormCategory('perlengkapan');
                    }}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                      formType === 'expense'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>Pengeluaran</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('income');
                      setFormCategory('donasi');
                    }}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                      formType === 'income'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Pemasukan</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Uraian / Judul Transaksi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: Beli spidol & penghapus whiteboard..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/30 font-medium"
                />
              </div>

              {/* Amount & Date in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nominal (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                  />
                </div>
              </div>

              {/* Category & Recipient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/30 font-medium"
                  >
                    {formType === 'expense'
                      ? expenseCategories.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))
                      : incomeCategories.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {formType === 'expense' ? 'Toko / Penerima Dana' : 'Sumber Dana'}
                  </label>
                  <input
                    type="text"
                    placeholder={formType === 'expense' ? 'Misal: Toko Buku Togamas' : 'Misal: Donatur alumni / bazar'}
                    value={formRecipient}
                    onChange={(e) => setFormRecipient(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Keterangan Rinci (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Rincian barang yang dibeli atau catatan pertanggungjawaban..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/30 text-xs"
                />
              </div>

              {/* Receipt Image Upload */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Foto Nota / Kwitansi / Struk (Bukti Fisik)
                </label>
                {formReceiptImage ? (
                  <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={formReceiptImage}
                        alt="Preview Nota"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs text-slate-700 font-medium">Nota terlampir</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormReceiptImage(undefined)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 cursor-pointer transition">
                    <Upload className="w-5 h-5 text-teal-600 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">Unggah Foto Nota</span>
                    <span className="text-[10px] text-slate-400">Kamera atau galeri perangkat (JPG, PNG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-white font-semibold text-xs shadow-xs transition ${
                    formType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-teal-700 hover:bg-teal-800'
                  }`}
                >
                  {editingTx ? 'Simpan Perubahan' : 'Catat ke Buku Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Zoom Receipt Modal */}
      {zoomedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4"
          onClick={() => setZoomedReceipt(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-2xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-slate-900">Lampiran Bukti Nota Kas</h4>
              <button
                onClick={() => setZoomedReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 max-h-[75vh] flex items-center justify-center">
              <img
                src={zoomedReceipt}
                alt="Bukti Nota"
                className="w-full h-auto object-contain max-h-[75vh]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
