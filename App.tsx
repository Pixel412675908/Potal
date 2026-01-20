
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { TabType, LinkItem, UserSettings, HistoryEntry } from './types';
import { INITIAL_LINKS } from './constants';
import { storage } from './services/storageService';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import AIStudio from './components/AIStudio';
import Settings from './components/Settings';
import OnlineCounter from './components/OnlineCounter';
import WifiDiagnosisPanel from './components/WifiDiagnosisPanel';

// Wallpapers Padrão
const DEFAULT_DESKTOP_WP = 'https://i.postimg.cc/MTTBT5T7/bywater-town-by-earl-lan-v0-2ahq6zb9yvcg1.jpg';
const DEFAULT_MOBILE_WP = 'https://i.postimg.cc/N0089BC6/file-000000004ef471f59bdaff00be7c8e96.png';

// LOCK: PORTAL DE LINKS E SIDEBAR PRESERVADOS

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const savedTab = localStorage.getItem('portal_active_tab');
    return (savedTab as TabType) || 'home';
  });
  
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isWifiPanelOpen, setIsWifiPanelOpen] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('portal_settings');
    const defaultSettings: UserSettings = { 
      theme: 'dark', 
      accentColor: '#2563eb', 
      wallpaperUrl: '', 
      devicePreference: 'desktop', 
      uploadedWallpapers: [] 
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      } catch (e) { return defaultSettings; }
    }
    return defaultSettings;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('portal_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [views, setViews] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('portal_views');
    if (saved) return JSON.parse(saved);
    const initialViews: Record<string, number> = {};
    INITIAL_LINKS.forEach(link => { initialViews[link.id] = link.baseViews; });
    return initialViews;
  });

  // Estado para o Histórico Inteligente (Persistência Automática)
  const [historyLinks, setHistoryLinks] = useState<LinkItem[]>(() => {
    const saved = localStorage.getItem('portal_history');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const isDark = settings.theme === 'dark';

  useEffect(() => {
    const isFirstRun = !localStorage.getItem('portal_settings');
    const isMobile = window.innerWidth < 768;
    
    if (isFirstRun || !settings.wallpaperUrl || settings.wallpaperUrl === 'null') {
      const defaultWP = isMobile ? DEFAULT_MOBILE_WP : DEFAULT_DESKTOP_WP;
      setSettings(prev => ({
        ...prev,
        devicePreference: isMobile ? 'mobile' : 'desktop',
        wallpaperUrl: defaultWP
      }));
    }
  }, []);

  useEffect(() => {
    const cleanWallpapers = (settings.uploadedWallpapers || []).map(wp => ({ ...wp, url: wp.url.startsWith('data:') ? '' : wp.url }));
    localStorage.setItem('portal_settings', JSON.stringify({ ...settings, uploadedWallpapers: cleanWallpapers }));
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
    document.body.className = isDark ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900';
  }, [settings, isDark]);

  useEffect(() => localStorage.setItem('portal_active_tab', activeTab), [activeTab]);
  
  // Sincronização automática do Histórico Inteligente com LocalStorage
  useEffect(() => {
    localStorage.setItem('portal_history', JSON.stringify(historyLinks));
  }, [historyLinks]);

  const toggleFavorite = (linkId: string) => { setFavorites(prev => prev.includes(linkId) ? prev.filter(id => id !== linkId) : [...prev, linkId]); };
  
  const handleLinkClick = (link: LinkItem) => { 
    // Atualizar visualizações
    setViews(prev => ({ ...prev, [link.id]: (prev[link.id] || link.baseViews) + 1 })); 
    
    // Atualizar histórico inteligente (Mover para o topo, remover duplicatas, limitar a 8)
    setHistoryLinks(prev => {
      const filtered = prev.filter(item => item.id !== link.id);
      const updated = [link, ...filtered].slice(0, 8);
      return updated;
    });
  };

  const navigateTo = (tab: TabType) => { setActiveTab(tab); setIsNavOpen(false); if (tab !== 'dashboard') setShowFavoritesOnly(false); };

  const toggleTheme = () => {
    setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  const showWallpaper = activeTab === 'home';

  return (
    <div className={`min-h-screen w-full flex flex-col transition-all duration-700 relative overflow-x-hidden ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      
      <div 
        className="fixed inset-0 z-0 bg-no-repeat bg-cover bg-center bg-fixed transition-opacity duration-1000"
        style={{ backgroundImage: showWallpaper && settings.wallpaperUrl ? `url('${settings.wallpaperUrl}')` : 'none', opacity: showWallpaper ? 1 : 0 }} 
      />

      <div className={`fixed inset-0 pointer-events-none transition-all duration-700 z-[5] ${showWallpaper ? (isDark ? 'bg-black/20' : 'bg-white/10') : (isDark ? 'bg-[#050505]' : 'bg-gray-50')}`} />
      
      <div className="fixed top-6 right-8 z-[110]">
        <OnlineCounter isDark={isDark} />
      </div>

      <WifiDiagnosisPanel isDark={isDark} isOpen={isWifiPanelOpen} onClose={() => setIsWifiPanelOpen(false)} />

      <main className={`flex-grow relative z-10 w-full`}>
        {activeTab === 'home' && <Home settings={settings} setActiveTab={navigateTo} />}
        {activeTab === 'dashboard' && <Dashboard onLinkClick={handleLinkClick} isDark={isDark} favorites={favorites} views={views} onToggleFavorite={toggleFavorite} showFavoritesOnly={showFavoritesOnly} onNavigate={navigateTo} />}
        {activeTab === 'studio' && <AIStudio isDark={isDark} />}
        {activeTab === 'settings' && <Settings settings={settings} setSettings={setSettings} isDark={isDark} />}
      </main>

      {/* Overlay do Menu Lateral */}
      {isNavOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[140]" onClick={() => setIsNavOpen(false)} />}

      {/* SIDEBAR EXPANSÍVEL COM HISTÓRICO INTEGRADO */}
      <div className={`fixed right-0 top-0 h-full z-[150] flex items-center transition-all duration-500 ease-in-out ${isNavOpen ? 'translate-x-0' : 'translate-x-[calc(100%-32px)]'}`}>
        
        {/* Botão de Gatilho (Tab) */}
        <button 
          onClick={() => setIsNavOpen(!isNavOpen)} 
          className="w-8 h-20 rounded-l-[1rem] flex items-center justify-center text-white shadow-2xl relative z-[160]" 
          style={{ backgroundColor: settings.accentColor }}
        >
          <i className={`fa-solid fa-chevron-${isNavOpen ? 'right' : 'left'} text-[10px]`}></i>
        </button>

        {/* CONTEÚDO DA SIDEBAR */}
        <div className={`h-full w-[280px] md:w-[320px] shadow-2xl flex flex-col p-6 overflow-hidden backdrop-blur-2xl ${isDark ? 'bg-zinc-950/95 border-l border-zinc-800 text-white' : 'bg-white/95 border-l border-gray-100 text-gray-900'}`}>
          
          {/* HEADER NAVEGAÇÃO */}
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black italic tracking-tighter uppercase">Menu</h3>
            <div className="flex gap-2">
               <button onClick={toggleTheme} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                 <i className={`fa-solid fa-${isDark ? 'sun' : 'moon'} text-xs`}></i>
               </button>
            </div>
          </div>

          {/* BOTÕES DE ACESSO RÁPIDO */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {[
              { id: 'home', icon: 'house', title: 'Home' },
              { id: 'dashboard', icon: 'table-cells-large', title: 'Recursos' },
              { id: 'favorites', icon: 'star', title: 'Favoritos' },
              { id: 'settings', icon: 'sliders', title: 'Aparência' },
            ].map(item => (
              <button 
                key={item.id} 
                onClick={() => { 
                  if (item.id === 'favorites') { navigateTo('dashboard'); setShowFavoritesOnly(true); } 
                  else navigateTo(item.id); 
                }} 
                className={`flex flex-col items-center justify-center p-4 rounded-3xl transition-all active:scale-95 group border ${
                  activeTab === item.id 
                    ? 'border-transparent text-white shadow-lg' 
                    : (isDark ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-white' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-900')
                }`}
                style={{ backgroundColor: activeTab === item.id ? settings.accentColor : '' }}
              >
                <i className={`fa-solid fa-${item.icon} mb-2 text-sm transition-transform group-hover:scale-110`}></i>
                <span className="text-[8px] font-black uppercase tracking-widest">{item.title}</span>
              </button>
            ))}
          </div>

          {/* MÓDULO DE SEGURANÇA (Network Sentinel) */}
          <button 
            onClick={() => { setIsWifiPanelOpen(true); setIsNavOpen(false); }}
            className={`w-full py-5 rounded-[2rem] flex items-center justify-center gap-3 mb-10 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 bg-blue-600 text-white hover:bg-blue-500`}
          >
            <i className="fa-solid fa-wifi"></i>
            Segurança & VPN
          </button>

          {/* SEÇÃO DE HISTÓRICO INTELIGENTE (RECENTES) */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4 px-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left"></i> Recentes
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {historyLinks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-20 text-center">
                  <i className="fa-solid fa-history text-2xl mb-2"></i>
                  <p className="text-[8px] font-black uppercase tracking-widest">Nenhum registro</p>
                </div>
              ) : (
                historyLinks.map(link => (
                  <div 
                    key={`hist-${link.id}`}
                    onClick={() => { handleLinkClick(link); window.open(link.url, '_blank'); }}
                    className={`flex items-center gap-4 p-4 rounded-3xl border cursor-pointer transition-all hover:scale-[1.05] active:scale-95 group ${
                      isDark ? 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 overflow-hidden shrink-0">
                      <img 
                        src={`https://logo.clearbit.com/${new URL(link.url).hostname}`}
                        alt={link.name}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${link.url}&sz=32`; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black truncate leading-none mb-1 uppercase tracking-tight">{link.name}</p>
                      <p className="text-[7px] font-black uppercase tracking-widest opacity-30">{link.category}</p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RODAPÉ SIDEBAR */}
          <footer className="mt-6 pt-6 border-t border-white/5 text-center">
             <p className="text-[7px] font-black uppercase tracking-[0.5em] opacity-20">Network Sentinel v16</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default App;
