import React, { useState } from 'react';
import {
  Users,
  Eye,
  Activity,
  Smartphone,
  Laptop,
  CheckCircle2,
  Clock,
  X,
  Sparkles,
  Info,
  Radio,
} from 'lucide-react';
import { VisitorStats, VisitorPresence } from '../types';
import { timeAgoIndo, formatTimeIndo } from '../services/utils';

interface VisitorPresenceIndicatorProps {
  stats: VisitorStats;
  isAdminUnlocked: boolean;
  myVisitorId: string;
}

export const VisitorPresenceIndicator: React.FC<VisitorPresenceIndicatorProps> = ({
  stats,
  isAdminUnlocked,
  myVisitorId,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    onlineWaliMuridCount,
    onlineTotalCount,
    todayVisitCount,
    lastWaliMuridOpenedAt,
    activeVisitors,
    recentVisitors,
  } = stats;

  const displayCount = onlineWaliMuridCount > 0 ? onlineWaliMuridCount : Math.max(1, onlineTotalCount);
  const isWaliOnline = onlineWaliMuridCount > 0;

  const getDeviceIcon = (deviceStr: string) => {
    if (deviceStr.toLowerCase().includes('hp') || deviceStr.toLowerCase().includes('iphone') || deviceStr.toLowerCase().includes('android')) {
      return <Smartphone className="w-3.5 h-3.5 text-teal-600" />;
    }
    return <Laptop className="w-3.5 h-3.5 text-blue-600" />;
  };

  return (
    <>
      {/* Live Badge Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group relative flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-semibold border transition shadow-2xs active:scale-95 ${
          isWaliOnline
            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/20 animate-pulse'
            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
        }`}
        title="Klik untuk melihat indikator & statistik wali murid yang sedang membuka aplikasi ini"
      >
        {/* Animated Live Pulse Dot */}
        <span className="relative flex h-2 w-2">
          {isWaliOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isWaliOnline ? 'bg-emerald-500' : 'bg-teal-500'
            }`}
          ></span>
        </span>

        <Eye className={`w-3.5 h-3.5 ${isWaliOnline ? 'text-emerald-600' : 'text-slate-500'}`} />

        <span className="hidden xs:inline">
          {isWaliOnline ? (
            <span>
              <strong className="font-bold text-emerald-900">{onlineWaliMuridCount}</strong> Wali Murid Online
            </span>
          ) : (
            <span>
              <strong className="font-bold text-slate-900">{displayCount}</strong> Online
            </span>
          )}
        </span>
        <span className="xs:hidden font-bold">{displayCount}</span>
      </button>

      {/* Modal Detail Aktivitas & Akses Wali Murid */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Indikator Akses Wali Murid</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pantauan real-time wali murid & orang tua yang membuka aplikasi PWA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Stats Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Card 1: Sedang Membuka Saat Ini */}
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200 rounded-xl">
                <div className="flex items-center justify-between text-emerald-800 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Sedang Buka</span>
                  <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                </div>
                <div className="text-2xl font-black text-emerald-950">
                  {onlineWaliMuridCount}
                  <span className="text-xs font-medium text-emerald-700 ml-1">Wali Murid</span>
                </div>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  {onlineWaliMuridCount > 0
                    ? '🟢 Ada wali murid aktif saat ini'
                    : 'Belum ada wali murid aktif'}
                </p>
              </div>

              {/* Card 2: Total Pengguna Aktif */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-slate-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Online</span>
                  <Users className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {displayCount}
                  <span className="text-xs font-medium text-slate-500 ml-1">Sesi</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Termasuk pengurus & wali murid
                </p>
              </div>

              {/* Card 3: Terakhir Dibuka */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-amber-800 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Buka Terakhir</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-sm font-bold text-amber-950 truncate">
                  {lastWaliMuridOpenedAt ? timeAgoIndo(lastWaliMuridOpenedAt) : 'Hari Ini'}
                </div>
                <p className="text-[10px] text-amber-700 mt-0.5 truncate">
                  {lastWaliMuridOpenedAt ? formatTimeIndo(lastWaliMuridOpenedAt) : 'Menunggu kunjungan'}
                </p>
              </div>
            </div>

            {/* Explanation Note */}
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-start gap-2.5 text-xs text-teal-900">
              <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-teal-950">Transparansi Real-Time:</strong>
                <p className="text-[11px] text-teal-800 mt-0.5 leading-relaxed">
                  Setiap kali wali murid atau orang tua membuka tautan atau aplikasi PWA ini di ponsel mereka, indikator ini otomatis menyala hijau dan memberitahukan secara langsung.
                </p>
              </div>
            </div>

            {/* Daftar Sesi & Aktivitas Akses */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Daftar Sesi Terdeteksi</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({activeVisitors.length} Sesi Aktif)
                  </span>
                </h4>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                {activeVisitors.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Belum ada sesi tercatat. Saat orang tua membuka aplikasi, mereka akan muncul di sini.
                  </div>
                ) : (
                  activeVisitors.map((visitor, idx) => {
                    const isMe = visitor.visitorId === myVisitorId;
                    const isWali = visitor.role === 'wali_murid';

                    return (
                      <div
                        key={visitor.visitorId || idx}
                        className={`p-3 flex items-center justify-between gap-2 transition ${
                          isMe ? 'bg-teal-50/50' : 'hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isWali
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {getDeviceIcon(visitor.device)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {isWali ? 'Wali Murid / Orang Tua' : 'Pengurus / Bendahara'}
                              </span>
                              {isMe && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-600 text-white">
                                  Perangkat Anda
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">
                              {visitor.device} • Dibuka: {formatTimeIndo(visitor.openedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Aktif ({timeAgoIndo(visitor.lastSeen)})</span>
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Riwayat Kunjungan Hari Ini */}
            {recentVisitors.length > activeVisitors.length && (
              <div className="space-y-1.5 pt-1">
                <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Riwayat Kunjungan Sebelumnya Hari Ini
                </h5>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white text-xs">
                  {recentVisitors
                    .filter((v) => !activeVisitors.some((av) => av.visitorId === v.visitorId))
                    .slice(0, 5)
                    .map((visitor, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700 truncate">
                            {visitor.role === 'wali_murid' ? 'Wali Murid' : 'Pengurus'} ({visitor.device})
                          </span>
                        </div>
                        <span className="text-slate-400 shrink-0">{timeAgoIndo(visitor.lastSeen)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Footer Close Button */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
              >
                Tutup Pantauan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
