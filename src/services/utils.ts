export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayNameIndo(dayIndex: number): string {
  const names = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return names[dayIndex % 7];
}

export function getCategoryLabel(category: string): { label: string; color: string; icon: string } {
  switch (category) {
    case 'jimpitan':
      return { label: 'Iuran Kas Siswa', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: '🪙' };
    case 'donasi':
      return { label: 'Donasi / Sukarela', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: '🤲' };
    case 'saldo_awal':
      return { label: 'Saldo Awal', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', icon: '🏦' };
    case 'penjualan_bazar':
      return { label: 'Bazar & Usaha Kelas', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: '🛒' };
    case 'perlengkapan':
      return { label: 'Perlengkapan Kelas', color: 'text-cyan-700 bg-cyan-50 border-cyan-200', icon: '✏️' };
    case 'fotokopi_tugas':
      return { label: 'Fotokopi & Modul', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: '📄' };
    case 'sosial_jenguk':
      return { label: 'Sosial & Jenguk Teman', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: '❤️' };
    case 'kegiatan_lomba':
      return { label: 'Kegiatan & Lomba', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: '🏆' };
    case 'kebersihan':
      return { label: 'Kebersihan & Piket', color: 'text-teal-700 bg-teal-50 border-teal-200', icon: '🧹' };
    case 'konsumsi':
      return { label: 'Konsumsi Rapat/Acara', color: 'text-orange-700 bg-orange-50 border-orange-200', icon: '🍱' };
    default:
      return { label: 'Lain-lain', color: 'text-slate-700 bg-slate-100 border-slate-200', icon: '📌' };
  }
}

export function exportToCSV(filename: string, rows: string[][]): void {
  const processRow = (row: string[]) => {
    return row.map(val => {
      let finalVal = val ? val.toString().replace(/"/g, '""') : '';
      if (finalVal.search(/("|,|\n)/g) >= 0) finalVal = `"${finalVal}"`;
      return finalVal;
    }).join(',');
  };

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(processRow).join('\r\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatTimeIndo(isoStr: string): string {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

export function timeAgoIndo(dateInput: string | Date | number): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput).getTime() : typeof dateInput === 'number' ? dateInput : dateInput.getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - date) / 1000));

  if (diffSec < 15) return 'Baru saja';
  if (diffSec < 60) return `${diffSec} detik lalu`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}
