
// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { CATEGORIES, INITIAL_LINKS } from '../constants';
import { LinkItem, TabType } from '../types';

interface DashboardProps {
  onLinkClick: (link: LinkItem) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  views: Record<string, number>;
  showFavoritesOnly: boolean;
  isDark?: boolean;
  onNavigate?: (tab: TabType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onLinkClick, 
  onToggleFavorite,
  favorites = [],
  views = {},
  showFavoritesOnly = false,
  isDark = false,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const filteredLinks = useMemo(() => {
    return INITIAL_LINKS.filter(link => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        link.name.toLowerCase().includes(term) || 
        link.description.toLowerCase().includes(term);
      const matchesCategory = activeCategory === 'all' || link.category === activeCategory;
      const matchesFavorites = !showFavoritesOnly || favorites.includes(link.id);
      
      return matchesSearch && matchesCategory && matchesFavorites;
    });
  }, [searchTerm, activeCategory, showFavoritesOnly, favorites]);

  const handleCardInteraction = (link: LinkItem) => {
    onLinkClick(link);
    if (!link.isDownload) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatViews = (n: number) => {
    return n.toLocaleString('pt-BR');
  };

  const getHypeEmoji = (n: number) => {
    if (n >= 8000) return '👑';
    if (n >= 5000) return '🚀';
    if (n >= 2000) return '🔥';
    return '👁️';
  };

  const getHostname = (url: string) => {
    try {
      if (url.startsWith('/')) return window.location.hostname;
      return new URL(url).hostname;
    } catch (e) {
      return 'portal';
    }
  };

  return (
    <div className={`p-4 md:p-10 max-w-7xl mx-auto animate-fade-in mb-40 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      
      {/* HEADER DE BUSCA E NAVEGAÇÃO */}
      <div className="flex flex-col md:flex-row gap-6 mb-16 items-center">
        <div className="flex gap-4 items-center">
          <div className="relative z-[100]">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-14 h-14 flex items-center justify-center rounded-2xl shadow-xl transition-all active:scale-90 ${
                isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'
              }`}
            >
              <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars-staggered'}`}></i>
            </button>
            {isMenuOpen && (
              <div className={`absolute top-16 left-0 w-64 rounded-[2rem] p-4 shadow-2xl border z-[110] animate-fade-in ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-100'}`}>
                <button onClick={() => { setActiveCategory('all'); setIsMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeCategory === 'all' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>Todos os Recursos</button>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setIsMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-colors ${activeCategory === cat.id ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
                    <i className={`fa-solid fa-${cat.icon} w-4`}></i> {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 relative w-full">
          <i className="fa-solid fa-search absolute left-0 top-1/2 -translate-y-1/2 text-xs opacity-20"></i>
          <input 
            type="text" 
            placeholder={showFavoritesOnly ? "Pesquisar nos favoritos..." : "O que você procura hoje?"} 
            className={`w-full pl-8 pr-4 py-4 bg-transparent border-b outline-none font-bold text-lg transition-all ${isDark ? 'border-zinc-800 focus:border-white' : 'border-gray-200 focus:border-black'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TÍTULO DA SEÇÃO ATUAL */}
      <div className="mb-10 px-2">
         <h2 className="text-3xl font-black tracking-tighter italic uppercase">
           {showFavoritesOnly ? 'Meus Favoritos' : (CATEGORIES.find(c => c.id === activeCategory)?.name || 'Recursos Gerais')}
         </h2>
         <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-1">Portal OS V14 Blindado</p>
      </div>

      {/* GRID DE CARDS 3D */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
        {filteredLinks.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-20 font-black uppercase tracking-widest text-xs">
            Nenhum recurso encontrado nesta categoria
          </div>
        ) : filteredLinks.map(link => {
          const hostname = getHostname(link.url);
          const isFavorited = favorites.includes(link.id);
          const currentViews = (views[link.id] || link.baseViews);

          return (
            <div 
              key={link.id}
              className={`
                flex flex-col relative rounded-[2.5rem] p-6 md:p-8 cursor-pointer select-none
                transition-all duration-300 ease-out min-h-[320px] group overflow-hidden
                bg-white/5 border border-white/10
                hover:scale-[1.08] hover:z-10 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]
                ${isDark ? 'hover:bg-zinc-900' : 'hover:bg-white/10'}
              `}
              onClick={() => handleCardInteraction(link)}
            >
              {/* Overlay de Favoritos */}
              <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                 <button
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(link.id); }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/5 transition-all active:scale-90"
                >
                  <i className={`fa-solid fa-star text-[10px] ${isFavorited ? 'text-yellow-400' : 'text-white/20'}`}></i>
                </button>
              </div>

              {/* Logo Centralizada conforme V14 design */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 mb-6 flex items-center justify-center relative">
                  <div className={`absolute inset-0 rounded-full blur-3xl opacity-10 group-hover:opacity-30 transition-opacity bg-blue-500`}></div>
                  <img 
                    src={`https://logo.clearbit.com/${hostname}`}
                    alt={link.name}
                    className={`max-w-full max-h-full object-contain relative z-10 transition-transform duration-500 group-hover:rotate-6`}
                    onError={(e) => { e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${link.url}&sz=128`; }}
                  />
                </div>
                
                <h3 className={`text-xl font-black text-center mb-1 tracking-tight leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{link.name}</h3>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 text-center opacity-60">
                  {link.subCategory || (CATEGORIES.find(c => c.id === link.category)?.name.split(' ')[0] || 'Recurso')}
                </p>
              </div>

              {/* Rodapé do Card */}
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-1.5">
                   <span className="text-[10px]">{getHypeEmoji(currentViews)}</span>
                   <span className="text-[9px] font-black opacity-40">{formatViews(currentViews)}</span>
                </div>
                <i className="fa-solid fa-arrow-right-long text-[10px] opacity-40"></i>
              </div>

              {/* Decoração Visual */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-600/20 transition-all"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
