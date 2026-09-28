import React, { useState, useEffect } from 'react';
import { ClassConfig, VisitorStats } from '../types';
import {
  Calendar,
  School,
  UserCheck,
  Lock,
  Unlock,
  RefreshCw,
  Share2,
  Download,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  QrCode,
  X,
  Info,
  ShieldCheck,
  Palette,
} from 'lucide-react';
import { formatDateIndo } from '../services/utils';
import { VisitorPresenceIndicator } from './VisitorPresenceIndicator';

interface HeaderProps {
  classConfig?: ClassConfig;
  isAdminUnlocked: boolean;
  onLockAdmin: () => void;
  onRequestUnlock: () => void;
  onOpenSettings: () => void;
  syncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
  onManualSync?: () => void;
  visitorStats?: VisitorStats;
  myVisitorId?: string;
  onOpenThemeModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  classConfig,
  isAdminUnlocked,
  onLockAdmin,
  onRequestUnlock,
  onOpenSettings,
  syncStatus = 'synced',
  onManualSync,
  visitorStats,
  myVisitorId = '',
  onOpenThemeModal,
}) => {
  const todayStr = formatDateIndo(new Date().toISOString().split('T')[0]);
  const classNameDisplay = classConfig?.className || 'Kas Kelas';
  const schoolNameDisplay = classConfig?.schoolName || 'Kas Sekolah Mandiri';
  const treasurerShort = classConfig?.treasurerName ? classConfig.treasurerName.split(' ')[0] : 'Bendahara';

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentAppUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    const shareData = {
      title: `${classNameDisplay} - ${schoolNameDisplay}`,
      text: `Buka aplikasi pembukuan & transparansi iuran kas ${classNameDisplay} (${schoolNameDisplay}):`,
      url: currentAppUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled or share failed, fallback to modal
        setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handleShareWhatsApp = () => {
    const message = `📢 *Tautan Aplikasi Kas Kelas & Transparansi Keuangan*\n🏫 *${classNameDisplay}* - ${schoolNameDisplay}\n\nSilakan buka tautan berikut untuk memantau saldo kas, status iuran, dan laporan keuangan kelas secara online:\n🔗 ${currentAppUrl}\n\n_Sistem Pembukuan Kas Sekolah_`;
    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentAppUrl
  )}`;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2">
          {/* Left: Brand & Class Info */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-teal-800 to-teal-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <span className="text-base sm:text-lg select-none" role="img" aria-label="Iuran Kas Sekolah">
                🏺
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate tracking-tight">
                  {classNameDisplay}
                </h1>

                {/* Real-Time Sync Indicator */}
                <button
                  onClick={onManualSync}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border transition ${
                    syncStatus === 'synced'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : syncStatus === 'syncing'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                  title="Status Sinkronisasi Cloud Real-Time (Klik untuk sinkronkan)"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      syncStatus === 'synced'
                        ? 'bg-emerald-500'
                        : syncStatus === 'syncing'
                        ? 'bg-blue-500 animate-spin'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span className="hidden xs:inline">
                    {syncStatus === 'synced'
                      ? 'Live Sync'
                      : syncStatus === 'syncing'
                      ? 'Menyinkronkan...'
                      : 'Lokal (Offline)'}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 truncate">
                <span className="truncate flex items-center gap-1">
                  <School className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{schoolNameDisplay}</span>
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-slate-500">
                  <UserCheck className="w-3 h-3 text-slate-400" />
                  {treasurerShort}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions (Indikator Akses Wali Murid, Pilih Tema, Bagikan Link, Instal App, Muat Ulang, Login/Mode Toggle) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Live Visitor / Wali Murid Presence Indicator */}
            {visitorStats && (
              <VisitorPresenceIndicator
                stats={visitorStats}
                isAdminUnlocked={isAdminUnlocked}
                myVisitorId={myVisitorId}
              />
            )}

            {/* Tombol Pilih Tema Foto Alam & Sakura Asli (Tampil di HP & Komputer) */}
            {onOpenThemeModal && (
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-200/90 text-xs font-bold transition shadow-2xs active:scale-95"
                title="Pilih Tema Foto Alam & Bunga Sakura Asli"
              >
                <Palette className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                <span className="hidden sm:inline">Tema</span>
                <span className="hidden xs:inline sm:hidden">🌸</span>
              </button>
            )}

            {/* 1. Tombol Bagikan Link (Di Semua Mode) */}
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/90 text-xs font-bold transition shadow-2xs active:scale-95"
              title="Bagikan tautan aplikasi Kas Kelas ke WhatsApp / Wali Murid"
            >
              <Share2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="hidden sm:inline">Bagikan</span>
              <span className="hidden xs:inline sm:hidden">Share</span>
            </button>

            {/* 2. Tombol Instal App (Di Semua Mode) */}
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold transition shadow-xs active:scale-95 border border-emerald-500/30"
              title="Pasang aplikasi di layar utama HP / Komputer (PWA)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
              <span className="hidden sm:inline">Instal App</span>
              <span className="hidden xs:inline sm:hidden">Instal</span>
            </button>

            {/* Date Display (Desktop) */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">
              <Calendar className="w-3 h-3 text-teal-600" />
              <span>{todayStr}</span>
            </div>

            {/* Instant Reload / Refresh App Button */}
            <button
              onClick={async () => {
                try {
                  if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    for (const reg of regs) {
                      await reg.unregister();
                    }
                  }
                  if ('caches' in window) {
                    const keys = await caches.keys();
                    for (const key of keys) {
                      await caches.delete(key);
                    }
                  }
                } catch {
                  // ignore
                }
                window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
              }}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition border border-slate-200"
              title="Muat Ulang / Perbarui Aplikasi Versi Terbaru"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 hover:text-teal-700 hover:rotate-180 transition-transform duration-500" />
            </button>

            {/* Admin PIN Lock Status Toggle */}
            {isAdminUnlocked ? (
              <button
                onClick={onLockAdmin}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition shadow-xs active:scale-95"
                title="Klik untuk mengunci ke Mode Wali Murid / Tamu"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Mode Pengurus</span>
                <span className="text-[10px] bg-emerald-200/80 px-1.5 py-0.2 rounded-md font-mono">Kunci</span>
              </button>
            ) : (
              <button
                onClick={onRequestUnlock}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs active:scale-95"
                title="Masukkan PIN untuk membuka akses edit Bendahara & Admin"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden xs:inline">Login</span>
                <span>Pengurus</span>
              </button>
            )}

            {isAdminUnlocked && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 sm:p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition border border-slate-200"
                title="Pengaturan Kas & PIN Kelas"
              >
                <span className="text-sm sm:text-base leading-none">⚙️</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modal Bagikan Link (Share Modal) */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bagikan Tautan Kas Kelas</h3>
                  <p className="text-[11px] text-slate-500">Akses mudah untuk Wali Murid & Pengurus</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code & Direct Scan */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                <img
                  src={qrCodeUrl}
                  alt="QR Code Kas Sekolah"
                  className="w-36 h-36 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2 text-center">
                Scan QR Code ini menggunakan kamera HP untuk langsung membuka aplikasi.
              </p>
            </div>

            {/* URL Display with Copy Button */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700">Tautan Aplikasi:</label>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <input
                  type="text"
                  readOnly
                  value={currentAppUrl}
                  className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-800 outline-none truncate select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs shrink-0 ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
              >
                <span>💬 Bagikan via WA</span>
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${classNameDisplay} - ${schoolNameDisplay}`,
                      text: `Buka pembukuan kas kelas ${classNameDisplay}:`,
                      url: currentAppUrl,
                    });
                  } else {
                    handleCopyLink();
                  }
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-300" />
                <span>Opsi Berbagi HP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Petunjuk Instal Aplikasi (PWA Install Modal) */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pasang Aplikasi Kas Sekolah</h3>
                  <p className="text-[11px] text-slate-500">Gunakan di layar utama HP tanpa buka browser</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              {isInstalled ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Aplikasi Kas Sekolah sudah terpasang di perangkat ini!</span>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1.5">
                    <p className="font-bold text-teal-900 flex items-center gap-1.5">
                      <span>📱</span>
                      <span>Untuk Pengguna Android (Google Chrome):</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-teal-800 text-[11px] pl-1">
                      <li>
                        Ketuk tombol titik tiga <strong>(⋮)</strong> di sudut kanan atas browser Chrome.
                      </li>
                      <li>
                        Pilih menu <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                      </li>
                      <li>Ikon aplikasi Kas Sekolah akan langsung muncul di menu HP Anda.</li>
                    </ol>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>🍎</span>
                      <span>Untuk Pengguna iPhone / iPad (Safari):</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] pl-1">
                      <li>
                        Ketuk tombol <strong>Bagikan / Share (ikon kotak tanda panah atas ⎋)</strong> di bilah bawah Safari.
                      </li>
                      <li>
                        Gulir ke bawah dan pilih <strong>"Add to Home Screen" (Tambahkan ke Layar Utama)</strong>.
                      </li>
                      <li>Ketuk <strong>Add (Tambah)</strong> di pojok kanan atas.</li>
                    </ol>
                  </div>
                </>
              )}

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900 text-[11px]">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Aplikasi ini ringan, hemat memori, dan mendukung mode offline saat koneksi internet lambat.
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setShowInstallModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
              >
                Tutup Petunjuk
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


