import sakuraSpringBloom from '../assets/images/sakura_spring_bloom_1790435192890.jpg';
import fujiSakuraLandscape from '../assets/images/fuji_sakura_landscape_1790435206426.jpg';
import emeraldMountainForest from '../assets/images/emerald_mountain_forest_1790435220115.jpg';
import sereneLakeNature from '../assets/images/serene_lake_nature_1790435230737.jpg';
import sakuraMacroBloom from '../assets/images/sakura_macro_bloom_1790435243144.jpg';

export interface AppThemeOption {
  id: string;
  name: string;
  category: 'sakura' | 'alam' | 'default';
  description: string;
  image?: string;
  previewThumbnail: string;
  tag: string;
  accentColor: string;
  overlayClass: string;
  bgFilter: string;
}

export const APP_THEMES: AppThemeOption[] = [
  {
    id: 'sakura_real_spring',
    name: 'Bunga Sakura Asli (Musim Semi)',
    category: 'sakura',
    description: 'Foto asli pohon bunga sakura Jepang yang mekar lebat di musim semi dengan kelopak merah muda alami yang cerah.',
    image: sakuraSpringBloom,
    previewThumbnail: '🌸',
    tag: 'Sakura Asli',
    accentColor: 'from-pink-600 to-rose-700',
    overlayClass: 'bg-slate-900/15 backdrop-blur-[2px]',
    bgFilter: 'brightness-105 contrast-100',
  },
  {
    id: 'fuji_sakura_landscape',
    name: 'Gunung Fuji & Bunga Sakura',
    category: 'sakura',
    description: 'Pemandangan panorama Gunung Fuji yang megah dibingkai dahan bunga sakura asli di tepi danau.',
    image: fujiSakuraLandscape,
    previewThumbnail: '🗻',
    tag: 'Sakura & Alam',
    accentColor: 'from-rose-600 to-indigo-700',
    overlayClass: 'bg-slate-900/20 backdrop-blur-[2px]',
    bgFilter: 'brightness-100 contrast-105',
  },
  {
    id: 'sakura_macro_bloom',
    name: 'Kelopak Sakura Asli (Embun Pagi)',
    category: 'sakura',
    description: 'Foto makro bunga sakura asli yang sangat detail dengan bulir embun pagi dan latar bokeh alami.',
    image: sakuraMacroBloom,
    previewThumbnail: '💮',
    tag: 'Sakura Makro',
    accentColor: 'from-rose-500 to-pink-700',
    overlayClass: 'bg-rose-950/15 backdrop-blur-[2px]',
    bgFilter: 'brightness-105 contrast-100',
  },
  {
    id: 'emerald_mountain_forest',
    name: 'Hutan Pinus & Alam Pegunungan',
    category: 'alam',
    description: 'Foto panorama alam hutan pinus hijau asri dengan sinar matahari pagi yang menyejukkan.',
    image: emeraldMountainForest,
    previewThumbnail: '🌲',
    tag: 'Foto Alam',
    accentColor: 'from-emerald-700 to-teal-800',
    overlayClass: 'bg-slate-950/20 backdrop-blur-[2px]',
    bgFilter: 'brightness-95 contrast-105',
  },
  {
    id: 'serene_lake_nature',
    name: 'Danau Alam & Lembah Sejuk',
    category: 'alam',
    description: 'Foto alam danau pegunungan berair biru toska jernih dengan suasana tenang dan damai.',
    image: sereneLakeNature,
    previewThumbnail: '🏞️',
    tag: 'Foto Alam',
    accentColor: 'from-cyan-700 to-teal-800',
    overlayClass: 'bg-slate-900/15 backdrop-blur-[2px]',
    bgFilter: 'brightness-100 contrast-100',
  },
  {
    id: 'default',
    name: 'Klasik Bersih (Standar)',
    category: 'default',
    description: 'Tampilan standar minimalis elegan dengan nuansa slate dan teal sekolah modern tanpa gambar latar.',
    previewThumbnail: '🎨',
    tag: 'Standar',
    accentColor: 'from-teal-700 to-emerald-700',
    overlayClass: 'bg-slate-100/80',
    bgFilter: 'none',
  },
];

export function getThemeById(themeId?: string): AppThemeOption {
  if (!themeId) return APP_THEMES[0];
  const found = APP_THEMES.find((t) => t.id === themeId);
  return found || APP_THEMES[0];
}
