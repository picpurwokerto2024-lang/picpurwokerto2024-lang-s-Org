import React, { useState, useRef } from 'react';
import { AppState, ClassConfig, FrequencyType, TabType, CustomNavBarItem } from '../types';
import { formatRupiah } from '../services/utils';
import { APP_THEMES, AppThemeOption } from '../services/themes';
import {
  Settings,
  School,
  Coins,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  Smartphone,
  ShieldCheck,
  HelpCircle,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Sliders,
  Plus,
  Minus,
  Layers,
  ExternalLink,
  Sparkles,
  Palette,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface SettingsViewProps {
  state: AppState;
  onUpdateConfig: (updates: Partial<ClassConfig>) => void;
  onExportBackup: () => void;
  onImportBackup: (json: string) => boolean;
  onResetToSample: () => void;
  onClearAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  onUpdateConfig,
  onExportBackup,
  onImportBackup,
  onResetToSample,
  onClearAll,
}) => {
  const [config, setConfig] = useState<ClassConfig>({
    ...state.classConfig,
    adminPin: state.classConfig.adminPin || '1234',
    enabledTabs: state.classConfig.enabledTabs || ['dashboard', 'jimpitan', 'kas', 'siswa', 'celengan', 'laporan'],
    customNavBars: state.classConfig.customNavBars || [],
    themeId: state.classConfig.themeId || 'default',
  });
  const [selectedThemeCategory, setSelectedThemeCategory] = useState<'all' | 'sakura' | 'alam'>('all');
  const [showPin, setShowPin] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New custom bar state
  const [newBarLabel, setNewBarLabel] = useState('');
  const [newBarUrl, setNewBarUrl] = useState('');
  const [newBarIcon, setNewBarIcon] = useState('📌');

  const standardTabsList: { key: TabType; label: string; desc: string; icon: string }[] = [
    { key: 'dashboard', label: 'Bar Beranda', desc: 'Ringkasan kas, statistik, dan grafik keuangan', icon: '📊' },
    { key: 'jimpitan', label: 'Bar Iuran Kas', desc: 'Pencatatan iuran harian & bulanan siswa', icon: '💰' },
    { key: 'kas', label: 'Bar Buku Kas', desc: 'Pencatatan arus kas masuk dan pengeluaran', icon: '📖' },
    { key: 'siswa', label: 'Bar Data Siswa', desc: 'Daftar nama siswa, nomor absen, dan status', icon: '👥' },
    { key: 'celengan', label: 'Bar Target Kas', desc: 'Alokasi target tabungan kelas & celengan', icon: '🎯' },
    { key: 'laporan', label: 'Bar Laporan', desc: 'Format laporan cetak, rekap PDF, dan ekspor', icon: '📑' },
  ];

  const handleToggleTab = (tabKey: TabType) => {
    const currentTabs = config.enabledTabs || ['dashboard', 'jimpitan', 'kas', 'siswa', 'celengan', 'laporan'];
    let updated: TabType[];
    if (currentTabs.includes(tabKey)) {
      if (currentTabs.length <= 1) {
        alert('Minimal harus ada 1 bar tab yang aktif.');
        return;
      }
      updated = currentTabs.filter((k) => k !== tabKey);
    } else {
      updated = [...currentTabs, tabKey];
    }
    setConfig({ ...config, enabledTabs: updated });
  };

  const handleAddCustomBar = () => {
    if (!newBarLabel.trim()) {
      alert('Masukkan nama bar yang ingin ditambahkan.');
      return;
    }
    const newBar: CustomNavBarItem = {
      id: `custom-bar-${Date.now()}`,
      label: newBarLabel.trim(),
      url: newBarUrl.trim() || undefined,
      icon: newBarIcon,
      isActive: true,
      isCustomLink: Boolean(newBarUrl.trim()),
    };
    const updatedCustom = [...(config.customNavBars || []), newBar];
    setConfig({ ...config, customNavBars: updatedCustom });
    setNewBarLabel('');
    setNewBarUrl('');
    setNewBarIcon('📌');
  };

  const handleRemoveCustomBar = (id: string) => {
    const updatedCustom = (config.customNavBars || []).filter((b) => b.id !== id);
    setConfig({ ...config, customNavBars: updatedCustom });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.adminPin || config.adminPin.length < 4) {
      alert('PIN Keamanan harus minimal 4 digit angka.');
      return;
    }
    onUpdateConfig(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = onImportBackup(content);
        if (success) {
          alert('Data kas dan siswa berhasil dipulihkan dari file backup!');
        } else {
          alert('Gagal memulihkan data. Format file tidak sesuai.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* 1. Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-700" />
          <span>Pengaturan Aplikasi & Data Kas</span>
        </h2>
        <p className="text-xs text-slate-500">
          Atur identitas kelas, nominal iuran kas, dan cadangan data
        </p>
      </div>

      {/* 2. Class Identity Form */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <School className="w-4 h-4 text-teal-700" />
          <h3 className="text-xs font-bold text-slate-900">Identitas Sekolah & Kelas</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Kelas / Rombel</label>
            <input
              type="text"
              placeholder="Misal: Kelas VIII - B"
              value={config.className}
              onChange={(e) => setConfig({ ...config, className: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Sekolah / Lembaga</label>
            <input
              type="text"
              placeholder="Misal: SMP Negeri 1 Purwokerto"
              value={config.schoolName}
              onChange={(e) => setConfig({ ...config, schoolName: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tahun Ajaran</label>
            <input
              type="text"
              placeholder="Misal: 2026/2027"
              value={config.academicYear}
              onChange={(e) => setConfig({ ...config, academicYear: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Bendahara Kelas</label>
            <input
              type="text"
              placeholder="Misal: Siti Rahmawati"
              value={config.treasurerName}
              onChange={(e) => setConfig({ ...config, treasurerName: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-700 font-semibold mb-1">Nama Wali Kelas (beserta Gelar)</label>
            <input
              type="text"
              placeholder="Misal: Drs. Bambang Sudarsono, M.Pd."
              value={config.homeroomTeacher}
              onChange={(e) => setConfig({ ...config, homeroomTeacher: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>
        </div>

        {/* Jimpitan Rules */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-2">
            <Coins className="w-4 h-4 text-teal-700" />
            <h3 className="text-xs font-bold text-slate-900">Aturan Iuran Kas Kelas</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tarif Default Iuran Kas (Rp)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                <input
                  type="number"
                  placeholder="10000"
                  value={config.defaultAmount}
                  onChange={(e) => setConfig({ ...config, defaultAmount: Number(e.target.value) })}
                  required
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {[5000, 10000, 15000, 20000, 25000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setConfig({ ...config, defaultAmount: amt })}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-800 text-[11px]"
                  >
                    {formatRupiah(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Frekuensi Iuran Kas</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, frequency: 'monthly' })}
                  className={`py-2 rounded-xl font-bold transition text-center ${
                    config.frequency === 'monthly'
                      ? 'bg-teal-700 text-white shadow-xs ring-2 ring-teal-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, frequency: 'weekly' })}
                  className={`py-2 rounded-xl font-bold transition text-center ${
                    config.frequency === 'weekly'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Mingguan
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, frequency: 'daily' })}
                  className={`py-2 rounded-xl font-bold transition text-center ${
                    config.frequency === 'daily'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Harian
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Kelola Bar Navigasi & Tab (Menambah dan Mengurangi Bar) */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <h3 className="text-xs font-bold text-slate-900">Kelola Bar Menu & Navigasi (Tambah / Kurangi Bar)</h3>
            </div>
            <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full font-bold border border-teal-200">
              Kustomisasi Pengurus
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Pengurus dapat mengaktifkan, menyembunyikan (mengurangi), atau menambahkan bar menu navigasi dan tautan cepat sesuai kebutuhan kelas.
          </p>

          {/* 1. Bar Tab Bawaan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {standardTabsList.map((tab) => {
              const isEnabled = (config.enabledTabs || []).includes(tab.key);
              return (
                <div
                  key={tab.key}
                  onClick={() => handleToggleTab(tab.key)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                    isEnabled
                      ? 'bg-teal-50/50 border-teal-300 text-teal-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{tab.icon}</span>
                    <div>
                      <div className={`font-bold text-xs ${isEnabled ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                        {tab.label}
                      </div>
                      <div className="text-[10px] text-slate-500">{tab.desc}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTab(tab.key);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                      isEnabled
                        ? 'bg-teal-700 text-white hover:bg-teal-800'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {isEnabled ? (
                      <>
                        <Minus className="w-3 h-3" /> Kurangi / Sembunyikan
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" /> Tambahkan
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 2. Daftar Custom Bars Tambahan */}
          {config.customNavBars && config.customNavBars.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="text-[11px] font-bold text-slate-700">Bar Kustom Tambahan:</div>
              <div className="space-y-1.5">
                {config.customNavBars.map((bar) => (
                  <div
                    key={bar.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{bar.icon || '📌'}</span>
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1">
                          <span>{bar.label}</span>
                          {bar.url && <ExternalLink className="w-3 h-3 text-slate-400" />}
                        </div>
                        {bar.url && <div className="text-[10px] text-slate-400 truncate max-w-xs">{bar.url}</div>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCustomBar(bar.id)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus Bar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Form Tambah Bar Baru */}
          <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300 space-y-2.5">
            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-teal-700" />
              <span>Tambah Bar / Menu Tautan Baru</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-600 font-medium text-[10px] mb-0.5">Nama Bar</label>
                <input
                  type="text"
                  placeholder="Misal: Grup WA / Drive Foto"
                  value={newBarLabel}
                  onChange={(e) => setNewBarLabel(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium text-[10px] mb-0.5">Tautan URL (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={newBarUrl}
                  onChange={(e) => setNewBarUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium text-[10px] mb-0.5">Ikon Bar</label>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 flex-1 overflow-x-auto py-0.5">
                    {['📌', '💬', '📁', '📅', '📋', '🔗', '⭐', '📢'].map((ico) => (
                      <button
                        key={ico}
                        type="button"
                        onClick={() => setNewBarIcon(ico)}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition shrink-0 ${
                          newBarIcon === ico ? 'bg-teal-700 text-white shadow-2xs' : 'bg-white border border-slate-200'
                        }`}
                      >
                        {ico}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCustomBar}
                    className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shrink-0 transition"
                  >
                    + Tambah Bar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Theme & Nature / Real Sakura Wallpaper Settings */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-pink-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Tema & Foto Latar Belakang</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700">
                    Sakura & Alam Asli
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pilih tampilan latar belakang aplikasi dengan foto asli alam dan bunga sakura mekar
                </p>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setSelectedThemeCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                  selectedThemeCategory === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setSelectedThemeCategory('sakura')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                  selectedThemeCategory === 'sakura'
                    ? 'bg-pink-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🌸</span>
                <span>Sakura Asli</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedThemeCategory('alam')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                  selectedThemeCategory === 'alam'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🌲</span>
                <span>Foto Alam</span>
              </button>
            </div>
          </div>

          {/* Themes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {APP_THEMES.filter((theme) => {
              if (selectedThemeCategory === 'all') return true;
              return theme.category === selectedThemeCategory;
            }).map((theme) => {
              const isSelected = (config.themeId || 'default') === theme.id;

              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    const newConfig = { ...config, themeId: theme.id };
                    setConfig(newConfig);
                    onUpdateConfig({ themeId: theme.id });
                  }}
                  className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 flex flex-col ${
                    isSelected
                      ? 'border-pink-500 shadow-md ring-2 ring-pink-400/20 bg-pink-50/20'
                      : 'border-slate-200 hover:border-pink-300 bg-white hover:shadow-xs'
                  }`}
                >
                  {/* Thumbnail / Image Preview */}
                  <div className="relative h-28 w-full bg-slate-900 overflow-hidden">
                    {theme.image ? (
                      <img
                        src={theme.image}
                        alt={theme.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 via-teal-900 to-slate-900 flex flex-col items-center justify-center text-white">
                        <span className="text-3xl mb-1">🏛️</span>
                        <span className="text-[11px] font-medium text-slate-300">Klasik Minimalis</span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Tag Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs border border-white/20">
                        {theme.previewThumbnail} {theme.tag}
                      </span>
                    </div>

                    {/* Active Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-pink-600 text-white p-1 rounded-full shadow-md animate-in zoom-in-75">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Theme Name on Thumbnail */}
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <h4 className="text-xs font-bold leading-snug drop-shadow-xs">{theme.name}</h4>
                    </div>
                  </div>

                  {/* Description & Action */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {theme.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                      <span
                        className={`font-bold ${
                          isSelected ? 'text-pink-700' : 'text-slate-400 group-hover:text-pink-600'
                        }`}
                      >
                        {isSelected ? '✓ Tema Aktif Digunakan' : 'Klik untuk Terapkan'}
                      </span>

                      <button
                        type="button"
                        className={`px-2 py-0.5 rounded-md font-bold transition ${
                          isSelected
                            ? 'bg-pink-100 text-pink-800'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-pink-50 group-hover:text-pink-700'
                        }`}
                      >
                        {isSelected ? 'Aktif' : 'Pilih'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security PIN Settings */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-900">Keamanan Akses (PIN Pengurus)</h3>
          </div>

          <p className="text-[11px] text-slate-500 mb-2.5">
            PIN ini diperlukan oleh Admin & Bendahara saat ingin mencatat iuran, menambah pengeluaran/pemasukan kas, mengubah data siswa, dan membuka pengaturan.
          </p>

          <div className="max-w-xs">
            <label className="block text-slate-700 font-semibold mb-1">
              PIN Keamanan (4 - 6 digit angka)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                placeholder="1234"
                value={config.adminPin || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setConfig({ ...config, adminPin: val });
                }}
                required
                className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-800 text-sm tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              PIN default awal adalah <strong>1234</strong>. Pastikan Anda mengingat PIN baru ini.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          {isSaved && (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <Check className="w-4 h-4" /> Tersimpan!
            </span>
          )}
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-xs transition active:scale-95"
          >
            Simpan Pengaturan
          </button>
        </div>
      </form>

      {/* 4. Backup & Data Management */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <h3 className="text-xs font-bold text-slate-900">Cadangan Data & Reset</h3>
        </div>

        <p className="text-slate-600">
          Seluruh catatan kas disimpan di memori lokal peramban perangkat Anda. Anda dapat mengunduh file cadangan (JSON) kapan saja untuk disimpan atau dipindahkan ke HP / laptop lain.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={onExportBackup}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 transition text-slate-800 font-bold"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>Ekspor Cadangan (Download JSON)</span>
          </button>

          <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 transition text-slate-800 font-bold cursor-pointer">
            <Upload className="w-4 h-4 text-teal-700" />
            <span>Pulihkan Data (Unggah JSON)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            Aplikasi ini hanya menyimpan data riil yang diinput oleh Pengurus / Bendahara kelas.
          </span>

          <button
            onClick={() => {
              if (confirm('PERINGATAN: Semua data siswa, iuran, dan transaksi kas akan dikosongkan. Lanjutkan?')) {
                onClearAll();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold transition text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan Seluruh Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
