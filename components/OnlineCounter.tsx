
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { presence } from '../services/presenceService';
import { PresenceState } from '../types';

interface OnlineCounterProps {
  isDark?: boolean;
}

const OnlineCounter: React.FC<OnlineCounterProps> = ({ isDark = false }) => {
  // Inicializamos vazio (0) para que os dados reais preencham a tela
  const [state, setState] = useState<PresenceState>({ total: 0, byCountry: {} });
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Conecta ao Singleton que gerencia a sala global 'global-tracking-room'
    const unsubscribe = presence.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  // Exibimos pelo menos 1 (o próprio usuário) enquanto os dados sincronizam
  const displayTotal = Math.max(state.total, state.total > 0 ? state.total : 1);

  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full cursor-help transition-all duration-300 ${
          isDark 
            ? 'bg-zinc-950/40 border border-zinc-800 text-white' 
            : 'bg-white/40 border border-gray-100 text-gray-900 shadow-sm'
        } backdrop-blur-xl hover:scale-105 active:scale-95`}
      >
        <div className="relative flex items-center justify-center">
          <i className="fa-solid fa-user-check text-[10px] opacity-70"></i>
          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
        </div>
        
        <span className="text-[12px] font-black tabular-nums tracking-tighter">
          {displayTotal}
        </span>
      </div>

      {showTooltip && (
        <div className={`absolute top-full right-0 mt-3 w-52 p-4 rounded-[2rem] z-[200] animate-fade-in border shadow-2xl backdrop-blur-2xl ${
          isDark ? 'bg-zinc-950/95 border-zinc-800 text-white' : 'bg-white/95 border-gray-100 text-gray-900'
        }`}>
          <header className="flex items-center justify-between mb-4 px-1">
             <h4 className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30">
              Rede Realtime Global
            </h4>
            <i className="fa-solid fa-tower-broadcast text-[10px] opacity-20"></i>
          </header>
          
          <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-thin">
            {Object.keys(state.byCountry).length === 0 ? (
               <div className="flex flex-col items-center py-4 opacity-30">
                  <i className="fa-solid fa-circle-notch fa-spin text-xs mb-2"></i>
                  <span className="text-[9px] font-black uppercase tracking-widest">Sincronizando...</span>
               </div>
            ) : (
              Object.entries(state.byCountry)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([country, data]) => (
                <div key={country} className="flex items-center justify-between group px-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-3 flex items-center justify-center overflow-hidden rounded-[1px] opacity-60">
                      {data.code === 'UN' ? '🌐' : (
                        <img 
                          src={`https://flagcdn.com/24x18/${data.code.toLowerCase()}.png`} 
                          className="w-full h-full object-cover" 
                          alt={country}
                        />
                      )}
                    </div>
                    <span className={`text-[10px] font-bold tracking-tight ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{country}</span>
                  </div>
                  <span className={`text-[10px] font-black ${isDark ? 'text-blue-500' : 'text-blue-600'}`}>{data.count}</span>
                </div>
              ))
            )}
          </div>
          
          <div className={`mt-4 pt-3 border-t text-[6px] font-black text-center opacity-20 uppercase tracking-[0.3em] ${isDark ? 'border-zinc-900' : 'border-gray-100'}`}>
            Channel: global-tracking-room
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineCounter;
