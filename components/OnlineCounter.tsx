
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { presence } from '../services/presenceService';
import { PresenceState } from '../types';

interface OnlineCounterProps {
  isDark?: boolean;
}

const OnlineCounter: React.FC<OnlineCounterProps> = ({ isDark = false }) => {
  const [state, setState] = useState<PresenceState>({ total: 0, byCountry: {} });
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Subscreve ao Singleton global que gerencia o Supabase
    const unsubscribe = presence.subscribe((newState) => {
      // Só atualiza se houver uma mudança real ou se o total for > 0 para evitar o "drop para 0" visual durante syncs rápidos
      setState(newState);
    });
    return unsubscribe;
  }, []);

  // O total exibido nunca deve ser menor que 1 para o usuário atual (feedback visual de que a conexão está ativa)
  const displayTotal = Math.max(state.total, 1);

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
          isDark ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-gray-100 text-gray-900'
        }`}>
          <header className="flex items-center justify-between mb-4 px-1">
             <h4 className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30">
              Usuários Online (Realtime)
            </h4>
            <i className="fa-solid fa-circle-nodes text-[10px] opacity-20"></i>
          </header>
          
          <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-thin">
            {Object.keys(state.byCountry).length === 0 ? (
               <div className="text-[10px] font-bold opacity-20 text-center py-2 italic">Aguardando dados...</div>
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
          
          <div className={`mt-4 pt-3 border-t text-[6px] font-black text-center opacity-20 uppercase tracking-[0.3em] ${isDark ? 'border-zinc-900 text-white' : 'border-gray-100'}`}>
            Network Node: {localStorage.getItem('portal_device_id')?.slice(-6)}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineCounter;
