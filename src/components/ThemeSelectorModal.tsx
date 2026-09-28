import React, { useState } from 'react';
import { Palette, X, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { APP_THEMES, AppThemeOption } from '../services/themes';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId?: string;
  onSelectTheme: (themeId: string) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentThemeId = 'sakura_real_spring',
  onSelectTheme,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'sakura' | 'alam' | 'default'>('all');

  if (!isOpen) return null;

  const filteredThemes = APP_THEMES.filter((theme) => {
    if (selectedCategory === 'all') return true;
    return theme.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-4 sm:p-6 shadow-2xl border border-slate-200 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span>Pilih Tema & Gambar Latar</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800">
                  🌸 Foto Asli
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Pilih suasana tema foto alam atau bunga sakura asli di aplikasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Tema
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('sakura')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'sakura'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🌸</span>
            <span>Sakura Asli ({APP_THEMES.filter((t) => t.category === 'sakura').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('alam')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'alam'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🌲</span>
            <span>Foto Alam ({APP_THEMES.filter((t) => t.category === 'alam').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('default')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'default'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🎨</span>
            <span>Standar</span>
          </button>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {filteredThemes.map((theme) => {
            const isSelected = currentThemeId === theme.id;

            return (
              <div
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                }}
                className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 flex flex-col ${
                  isSelected
                    ? 'border-pink-500 shadow-lg ring-2 ring-pink-400/30 bg-pink-50/30'
                    : 'border-slate-200 hover:border-pink-300 bg-white hover:shadow-md'
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="relative h-36 w-full bg-slate-950 overflow-hidden">
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
                      <span className="text-xs font-medium text-slate-300">Klasik Minimalis Bersih</span>
                    </div>
                  )}

                  {/* Dark Gradient Overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                  {/* Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur-md border border-white/20">
                      {theme.previewThumbnail} {theme.tag}
                    </span>
                  </div>

                  {/* Selected Tick Indicator */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 bg-pink-600 text-white p-1 rounded-full shadow-md animate-in zoom-in-75 ring-2 ring-white">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  {/* Title on image */}
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <h4 className="text-sm font-bold leading-snug drop-shadow-md">{theme.name}</h4>
                  </div>
                </div>

                {/* Description & Button */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {theme.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-pink-700' : 'text-slate-400 group-hover:text-pink-600'
                      }`}
                    >
                      {isSelected ? '✓ Tema Aktif Digunakan' : 'Ketuk untuk Menerapkan'}
                    </span>

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                        isSelected
                          ? 'bg-pink-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-pink-50 group-hover:text-pink-700'
                      }`}
                    >
                      {isSelected ? 'Terpasang' : 'Terapkan'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            💡 Tema tersimpan di perangkat Anda dan otomatis tampil di ponsel & komputer.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
