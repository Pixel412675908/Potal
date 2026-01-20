
// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { UserSettings } from '../types';

/**
 * Interface defining the props for the Settings component.
 */
interface SettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  isDark?: boolean;
}

// Listas Brutas fornecidas (com possíveis duplicatas)
const RAW_MOBILE_URLS = [
  'https://i.postimg.cc/N0089BC6/file-000000004ef471f59bdaff00be7c8e96.png',
  'https://i.postimg.cc/xTvJSwyS/file-00000000e3e071f580b07086d02b9a0d.png',
  'https://i.postimg.cc/GmRMLnWj/format-auto-w-640-(3).png',
  'https://i.postimg.cc/7Y3VQQ57/format-auto-w-640-(2).png',
  'https://i.postimg.cc/65XVRLM5/format-auto-w-640-(1).png',
  'https://i.postimg.cc/rp3xpSd0/format-auto-w-640-(9).jpg',
  'https://i.postimg.cc/9XGZWwc0/format-auto-w-640-(8).jpg',
  'https://i.postimg.cc/ydCx5ngv/format-auto-w-640-(7).jpg',
  'https://i.postimg.cc/qBjBXpLS/format-auto-w-640-(6).jpg',
  'https://i.postimg.cc/Fzq2WCzM/format-auto-w-640-(5).jpg',
  'https://i.postimg.cc/RFp8hp7G/format-auto-w-640.png',
  'https://i.postimg.cc/NFrNMsGC/format-auto-w-640-(4).jpg',
  'https://i.postimg.cc/GmQ1rQ5q/format-auto-w-640-(3).jpg',
  'https://i.postimg.cc/fRM6HdRm/format-auto-w-640-(2).jpg',
  'https://i.postimg.cc/0jpBn5gD/format-auto-w-640-(1).jpg',
  'https://i.postimg.cc/x8y6HsHg/format-auto-w-640.jpg',
  'https://i.postimg.cc/N0H7mJvR/Die-Gletscherkalamit-t.jpg',
  'https://i.postimg.cc/kXYxZ3n5/RDT-20251223-0007579150136775411238591.jpg',
  'https://i.postimg.cc/4NycpLzf/Schockwelle-und-Stahl.jpg',
  'https://i.postimg.cc/cHdgCXx6/Schatten-der-Rache-(1).png',
  'https://i.postimg.cc/m2KPCbLy/Echos-des-Zusammenbruchs.jpg',
  'https://i.postimg.cc/T38PhC0F/Neon-Brawler.png',
  'https://i.postimg.cc/tgkRSyb4/Phoenix-10-Create-a-stylized-artistic-music-album-cover-illust-2.jpg'
];

const RAW_DESKTOP_URLS = [
  'https://i.postimg.cc/MTTBT5T7/bywater-town-by-earl-lan-v0-2ahq6zb9yvcg1.jpg',
  'https://i.postimg.cc/05ztXdng/wallhaven-xeerpv.jpg',
  'https://i.postimg.cc/T3NfxJzh/thumb-350-1404348.webp',
  'https://i.postimg.cc/Nfpw8xfb/thumb-350-1404436.webp',
  'https://i.postimg.cc/76gF53WN/thumb-350-1403907.webp',
  'https://i.postimg.cc/CK8t2CSL/thumb-350-589031.webp',
  'https://i.postimg.cc/Y2RPTCKh/thumb-350-394511.webp',
  'https://i.postimg.cc/vTZ0G5F8/thumb-350-752070.webp',
  'https://i.postimg.cc/jj6cNMRS/thumb-350-516677.webp',
  'https://i.postimg.cc/sDBJKjVd/thumb-350-1319322.webp',
  'https://i.postimg.cc/Y9q6FkXW/thumb-350-1358788.webp',
  'https://i.postimg.cc/htLT3h6L/thumb-350-1371030.webp',
  // Novos links Desktop adicionados
  'https://i.postimg.cc/6qJT9dmp/RDT-20260111-1315358708516399458776848.png',
  'https://i.postimg.cc/DzSzLC99/thumb-350-1323165.webp',
  'https://i.postimg.cc/C5sMS98H/thumb-350-1354199.webp',
  'https://i.postimg.cc/NMhQTQ7R/thumb-350-973967.webp',
  'https://i.postimg.cc/HW9TcDJB/thumb-350-1396560.webp',
  'https://i.postimg.cc/5yscPJvL/thumb-350-508247.webp',
  'https://i.postimg.cc/2SPs92bS/thumb-350-1124786.webp',
  'https://i.postimg.cc/zvtMCjYZ/thumb-350-1344443.webp',
  'https://i.postimg.cc/YqTDtjpW/thumb-350-735121.webp',
  'https://i.postimg.cc/BvBm5g2d/thumb-350-600528.webp',
  'https://i.postimg.cc/7hfXkrdc/thumb-350-1364877.webp'
];

// Limpeza de duplicatas usando Set
const UNIQUE_WALLPAPERS = [
  ...Array.from(new Set(RAW_MOBILE_URLS)).map((url, idx) => ({
    id: `m-${idx}`,
    name: `Mobile ${idx + 1}`,
    type: 'mobile',
    url
  })),
  ...Array.from(new Set(RAW_DESKTOP_URLS)).map((url, idx) => ({
    id: `d-${idx}`,
    name: `Desktop ${idx + 1}`,
    type: 'desktop',
    url
  }))
];

const WallpaperCard = ({ wp, settings, isDark, onApply, onDownload }) => {
  const isSelected = settings.wallpaperUrl === wp.url;

  return (
    <div className={`group flex flex-col rounded-[2.5rem] overflow-hidden border transition-all hover:scale-[1.02] ${
      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100 shadow-sm'
    }`}>
      <div className={`w-full overflow-hidden relative bg-black/20 ${wp.type === 'mobile' ? 'aspect-[9/16]' : 'aspect-video'}`}>
        <img 
          src={wp.url} 
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 opacity-100`} 
          alt={wp.name} 
          loading="lazy" 
        />
        
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full glass-dark text-[8px] font-black uppercase tracking-widest text-white flex items-center gap-2 z-10 shadow-xl">
          <i className={`fa-solid fa-${wp.type === 'mobile' ? 'mobile-screen' : 'laptop'}`}></i>
          {wp.type}
        </div>

        {isSelected && (
          <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center backdrop-blur-[2px] z-20">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-2xl animate-fade-in">
              <i className="fa-solid fa-check"></i>
            </div>
          </div>
        )}
      </div>

      <div className="p-5">
        <h4 className={`text-[11px] font-black uppercase tracking-wider mb-4 truncate ${isDark ? 'text-zinc-200' : 'text-gray-700'}`}>
          {wp.name}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button"
            onClick={() => onApply(wp.url, wp.type)}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl transition-all active:scale-95 text-[9px] font-black uppercase tracking-widest ${
              isSelected 
                ? 'bg-blue-600 text-white' 
                : (isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900')
            }`}
          >
            <i className="fa-solid fa-circle-check"></i>
            Aplicar
          </button>

          <button 
            type="button"
            onClick={() => onDownload(wp.url, wp.name)}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl transition-all active:scale-95 ${
              isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <i className="fa-solid fa-download"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

const Settings: React.FC<SettingsProps> = ({ settings, setSettings, isDark = false }) => {
  const [filter, setFilter] = useState<'all' | 'mobile' | 'desktop'>('all');

  const handleColorChange = (hex: string) => {
    setSettings(prev => ({ ...prev, accentColor: hex }));
  };

  const applyWallpaper = (url: string, format: 'mobile' | 'desktop') => {
    setSettings(prev => ({ 
      ...prev, 
      wallpaperUrl: url, 
      devicePreference: format 
    }));
  };

  const downloadWallpaper = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredWallpapers = useMemo(() => {
    if (filter === 'all') return UNIQUE_WALLPAPERS;
    return UNIQUE_WALLPAPERS.filter(wp => wp.type === filter);
  }, [filter]);

  return (
    <div className={`p-6 md:p-10 max-w-5xl mx-auto animate-fade-in pb-48 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <header className="mb-14">
        <h2 className="text-4xl font-black mb-3 tracking-tighter">Aparência</h2>
        <p className={`font-bold text-xs uppercase tracking-[0.2em] ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>Configurações de Hardware e Interface</p>
      </header>

      <div className="space-y-20">
        <section>
          <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-10 flex items-center gap-3 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
            <i className="fa-solid fa-palette" style={{ color: settings.accentColor }}></i> Esquema de Cores
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Sutis</p>
              <div className="flex flex-wrap gap-4">
                {['#64748b', '#71717a', '#475569'].map(hex => (
                  <button key={hex} type="button" onClick={() => handleColorChange(hex)} className={`w-12 h-12 rounded-full border-4 transition-all ${settings.accentColor === hex ? 'border-blue-500' : 'border-transparent'}`} style={{ backgroundColor: hex }} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Vibrantes</p>
              <div className="flex flex-wrap gap-4">
                {['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'].map(hex => (
                  <button key={hex} type="button" onClick={() => handleColorChange(hex)} className={`w-12 h-12 rounded-full border-4 transition-all ${settings.accentColor === hex ? 'border-white shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: hex }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
             <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
              <i className="fa-solid fa-images"></i> Galeria Oficial
            </h3>
            
            <div className={`flex p-1 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-100 border-gray-200 shadow-inner'}`}>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'mobile', label: 'Mobile' },
                { id: 'desktop', label: 'Desktop' }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id as any)}
                  className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    filter === btn.id 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWallpapers.map(wp => (
              <WallpaperCard 
                key={wp.id} 
                wp={wp} 
                settings={settings} 
                isDark={isDark} 
                onApply={applyWallpaper} 
                onDownload={downloadWallpaper}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
