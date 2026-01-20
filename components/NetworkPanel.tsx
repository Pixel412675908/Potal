
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { INITIAL_LINKS } from '../constants';

interface NetworkPanelProps {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
  networkFilter: 'all' | 'available' | 'secure';
  setNetworkFilter: (filter: 'all' | 'available' | 'secure') => void;
  blockedIds: string[];
  setBlockedIds: (ids: string[]) => void;
}

const NetworkPanel: React.FC<NetworkPanelProps> = ({ 
  isDark, isOpen, onClose, networkFilter, setNetworkFilter, blockedIds, setBlockedIds 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [ping, setPing] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    if (isOpen) measurePing();

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, [isOpen]);

  const measurePing = async () => {
    const start = performance.now();
    try {
      // Usando o favicon do Google para medir latência (asset pequeno e confiável)
      await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
      setPing(Math.round(performance.now() - start));
    } catch {
      setPing(null);
    }
  };

  const scanAccessibility = async () => {
    setIsScanning(true);
    setScanProgress(0);
    const newBlocked = [];
    const total = INITIAL_LINKS.length;

    for (let i = 0; i < total; i++) {
      const link = INITIAL_LINKS[i];
      const hostname = new URL(link.url).hostname;
      
      const isAvailable = await new Promise((resolve) => {
        const img = new Image();
        const timeout = setTimeout(() => {
          img.src = ""; // Cancela o carregamento
          resolve(false);
        }, 3500); // Timeout de 3.5s para considerar bloqueado/lento

        img.onload = () => {
          clearTimeout(timeout);
          resolve(true);
        };
        img.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
        // Tenta carregar o logo via Clearbit ou Favicon do domínio
        img.src = `https://logo.clearbit.com/${hostname}?t=${Date.now()}`;
      });

      if (!isAvailable) {
        newBlocked.push(link.id);
      }
      setScanProgress(Math.round(((i + 1) / total) * 100));
    }

    setBlockedIds(newBlocked);
    setIsScanning(false);
    alert(`Varredura completa!\n\n${total - newBlocked.length} sites acessíveis.\n${newBlocked.length} sites com possíveis bloqueios.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-md rounded-[2.5rem] border shadow-2xl overflow-hidden transition-all ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-100 text-gray-900'
      }`}>
        <header className={`p-8 border-b ${isDark ? 'border-zinc-900 bg-zinc-900/50' : 'border-gray-50 bg-gray-50/50'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-black tracking-tighter">Central de Rede</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Saúde da Conexão e Filtros</p>
            </div>
            <button onClick={onClose} className="opacity-20 hover:opacity-100 transition-opacity"><i className="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <div className={`px-4 py-2 rounded-2xl flex items-center gap-3 border ${
              isOnline ? 'border-green-500/20 bg-green-500/5 text-green-500' : 'border-red-500/20 bg-red-500/5 text-red-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            {isOnline && ping && (
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
                Ping: <span className={ping > 150 ? 'text-amber-500' : 'text-green-500'}>{ping}ms</span>
              </div>
            )}
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* BOTÃO DE SCAN */}
          <section>
            <button 
              onClick={scanAccessibility}
              disabled={isScanning || !isOnline}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-[11px] uppercase tracking-widest relative overflow-hidden ${
                isScanning ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg'
              }`}
            >
              {isScanning && (
                <div className="absolute left-0 bottom-0 h-1 bg-blue-400 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
              )}
              <i className={`fa-solid ${isScanning ? 'fa-spinner fa-spin' : 'fa-network-wired'}`}></i>
              {isScanning ? `Escaneando... ${scanProgress}%` : 'Escanear Acessibilidade'}
            </button>
            <p className="text-[9px] font-bold text-center mt-3 opacity-30 leading-relaxed px-4">
              Verifica se DNS e Firewall permitem acesso aos serviços.
            </p>
          </section>

          {/* CONTROLES DE FILTRO */}
          <section className="space-y-4">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 mb-2">Configurações de Exibição</h4>
            
            <div className="flex flex-col gap-2">
              {[
                { id: 'all', label: 'Ver Todos', icon: 'border-all' },
                { id: 'available', label: 'Ocultar Bloqueados', icon: 'eye-slash', count: blockedIds.length },
                { id: 'secure', label: 'Apenas HTTPS', icon: 'lock' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setNetworkFilter(item.id as any)}
                  className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    networkFilter === item.id 
                      ? 'border-blue-600 bg-blue-600/10 text-blue-500 shadow-sm' 
                      : (isDark ? 'border-zinc-800 text-zinc-500 hover:border-zinc-700' : 'border-gray-100 text-gray-500 hover:border-gray-200')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i className={`fa-solid fa-${item.icon} text-xs`}></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 font-black">-{item.count}</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>

        <footer className={`p-6 text-center border-t ${isDark ? 'border-zinc-900 text-zinc-600' : 'border-gray-50 text-gray-400'}`}>
          <p className="text-[8px] font-black uppercase tracking-[0.2em]">Portal OS Network Guard v1.0</p>
        </footer>
      </div>
    </div>
  );
};

export default NetworkPanel;
