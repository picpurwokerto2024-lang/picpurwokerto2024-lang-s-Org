import React, { useState, useMemo } from 'react';
import { AppState, Student, Gender } from '../types';
import { formatRupiah, formatDateIndo } from '../services/utils';
import { createStudentReminderMessage, openWhatsAppDirect } from '../services/whatsapp';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Search,
  MessageCircle,
  Trash2,
  Edit2,
  X,
  History,
  Phone,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface SiswaViewProps {
  state: AppState;
  studentMetrics: Map<
    string,
    { totalPaid: number; paidCount: number; unpaidCount: number; unpaidTotal: number; lastPaidDate?: string }
  >;
  onAddStudent: (student: Omit<Student, 'id' | 'avatarColor'>) => void;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onBulkImport: (names: string[]) => void;
}

export const SiswaView: React.FC<SiswaViewProps> = ({
  state,
  studentMetrics,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBulkImport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'L' | 'P'>('all');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formNo, setFormNo] = useState('');
  const [formGender, setFormGender] = useState<Gender>('L');
  const [formPhone, setFormPhone] = useState('');
  const [formParent, setFormParent] = useState('');
  const [bulkText, setBulkText] = useState('');

  const defaultAmt = state.classConfig.defaultAmount || 2000;

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return state.students.filter((s) => {
      if (filterGender !== 'all' && s.gender !== filterGender) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.studentNumber.includes(q);
      }
      return true;
    });
  }, [state.students, filterGender, searchQuery]);

  // Roster stats
  const rosterStats = useMemo(() => {
    const total = state.students.length;
    const countL = state.students.filter((s) => s.gender === 'L').length;
    const countP = state.students.filter((s) => s.gender === 'P').length;
    return { total, countL, countP };
  }, [state.students]);

  const openAdd = () => {
    setEditingStudent(null);
    setFormName('');
    setFormNo(String(state.students.length + 1).padStart(2, '0'));
    setFormGender('L');
    setFormPhone('');
    setFormParent('');
    setIsAddModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditingStudent(s);
    setFormName(s.name);
    setFormNo(s.studentNumber);
    setFormGender(s.gender);
    setFormPhone(s.phone || '');
    setFormParent(s.parentName || '');
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingStudent) {
      onUpdateStudent(editingStudent.id, {
        name: formName.trim(),
        studentNumber: formNo.trim(),
        gender: formGender,
        phone: formPhone.trim() || undefined,
        parentName: formParent.trim() || undefined,
      });
    } else {
      onAddStudent({
        name: formName.trim(),
        studentNumber: formNo.trim() || String(state.students.length + 1).padStart(2, '0'),
        gender: formGender,
        phone: formPhone.trim() || undefined,
        parentName: formParent.trim() || undefined,
        isActive: true,
      });
    }
    setIsAddModalOpen(false);
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length > 0) {
      onBulkImport(lines);
      setBulkText('');
      setIsBulkModalOpen(false);
    }
  };

  const handleSendReminder = (student: Student) => {
    const metric = studentMetrics.get(student.id);
    const unpaidCount = metric?.unpaidCount || 1;
    const unpaidTotal = unpaidCount * defaultAmt;
    const msg = createStudentReminderMessage(student, unpaidCount, unpaidTotal, state);
    openWhatsAppDirect(student.phone, msg);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-700" />
            <span>Daftar Siswa / Anggota Kelas</span>
          </h2>
          <p className="text-xs text-slate-500">
            Total {rosterStats.total} Siswa ({rosterStats.countL} Laki-laki, {rosterStats.countP} Perempuan)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            title="Tempel daftar nama banyak siswa sekaligus"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-700" />
            <span>Impor Massal</span>
          </button>

          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Gender Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama siswa atau no absen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          />
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl self-end sm:self-auto">
          <button
            onClick={() => setFilterGender('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              filterGender === 'all' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({rosterStats.total})
          </button>
          <button
            onClick={() => setFilterGender('L')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              filterGender === 'L' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Laki-laki ({rosterStats.countL})
          </button>
          <button
            onClick={() => setFilterGender('P')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              filterGender === 'P' ? 'bg-pink-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Perempuan ({rosterStats.countP})
          </button>
        </div>
      </div>

      {/* 3. Students Roster Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-12 px-4 text-center bg-white rounded-2xl border border-slate-200 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3 text-2xl">
              👥
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Belum Ada Data Siswa</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              Data demo telah dihapus. Silakan klik tombol <strong>+ Tambah Siswa</strong> atau <strong>Impor Massal</strong> di atas untuk memasukkan nama siswa kelas Anda.
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const metric = studentMetrics.get(student.id);
            const totalPaid = metric?.totalPaid || 0;
            const paidCount = metric?.paidCount || 0;
            const unpaidCount = metric?.unpaidCount || 0;

            return (
              <div
                key={student.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition flex flex-col justify-between"
              >
                {/* Top Info */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 ${student.avatarColor}`}
                      >
                        {student.studentNumber}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {student.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span
                            className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                              student.gender === 'L'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-pink-50 text-pink-700'
                            }`}
                          >
                            {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </span>
                          {student.parentName && <span>• Wali: {student.parentName}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(student)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        title="Edit Data Siswa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus siswa "${student.name}" dan riwayat kasnya?`)) {
                            onDeleteStudent(student.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Stats Mini Pill */}
                  <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500">Total Iuran Masuk</span>
                      <div className="font-bold text-teal-800 text-xs mt-0.5">
                        {formatRupiah(totalPaid)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Kehadiran Kas</span>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">
                        {paidCount}x Bayar
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setHistoryStudent(student)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-teal-800"
                  >
                    <History className="w-3.5 h-3.5 text-teal-600" />
                    <span>Riwayat Kas</span>
                  </button>

                  <button
                    onClick={() => handleSendReminder(student)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition"
                    title="Kirim Catatan Kas / Tagihan ke WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="my-3 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">No. Absen</label>
                  <input
                    type="text"
                    placeholder="01"
                    value={formNo}
                    onChange={(e) => setFormNo(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-center font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Jenis Kelamin</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setFormGender('L')}
                      className={`py-2 rounded-xl font-bold transition ${
                        formGender === 'L'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Laki-laki
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormGender('P')}
                      className={`py-2 rounded-xl font-bold transition ${
                        formGender === 'P'
                          ? 'bg-pink-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Perempuan
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  placeholder="Misal: Ahmad Fauzi Pratama"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nomor WhatsApp Siswa / Wali (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="081234567890 / 628..."
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nama Orang Tua / Wali (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Bpk. Hendra"
                  value={formParent}
                  onChange={(e) => setFormParent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Bulk Import Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Impor Daftar Nama Siswa Massal</h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="my-3 space-y-3 text-xs">
              <p className="text-slate-600">
                Tempel daftar nama siswa (1 baris untuk 1 nama). Sistem akan otomatis membuatkan profil dan nomor urut absen.
              </p>

              <textarea
                rows={7}
                placeholder="Ahmad Fauzi&#10;Budi Santoso&#10;Citra Lestari&#10;Dewi Anggraeni"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                required
                className="w-full p-3 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/30 font-sans"
              />

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs"
                >
                  Impor Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Student History Modal */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs ${historyStudent.avatarColor}`}
                >
                  {historyStudent.studentNumber}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{historyStudent.name}</h3>
                  <p className="text-[11px] text-slate-500">Riwayat Setoran Iuran Kas</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of records */}
            <div className="my-3 flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {state.jimpitanRecords
                .filter((r) => r.studentId === historyStudent.id && r.status === 'paid')
                .sort((a, b) => b.date.localeCompare(a.date)).length === 0 ? (
                <div className="py-8 text-center text-slate-400">Belum ada riwayat pembayaran iuran.</div>
              ) : (
                state.jimpitanRecords
                  .filter((r) => r.studentId === historyStudent.id && r.status === 'paid')
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{formatDateIndo(rec.date)}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>Metode: {rec.paymentMethod.toUpperCase()}</span>
                          {rec.note && <span>• {rec.note}</span>}
                        </div>
                      </div>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {formatRupiah(rec.amount)}
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setHistoryStudent(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
