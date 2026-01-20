
// @ts-nocheck
import React, { useState, useEffect } from 'react';

interface WifiDiagnosisPanelProps {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
}

// LOCK: PORTAL DE LINKS E WALLPAPERS PRESERVADOS

const WifiDiagnosisPanel: React.FC<WifiDiagnosisPanelProps> = ({ 
  isDark, isOpen, onClose 
}) => {
  const [ipInfo, setIpInfo] = useState({ 
    ip: 'Detectando...', 
    city: 'Detectando...', 
    country_name: 'Brasil', 
    org: 'Localizando Provedor...',
    country_code: 'BR' 
  });
  const [error, setError] = useState(false);

  // Detecção dinâmica de dispositivo para VPN V16 Final
  const getVpnInfo = () => {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      return { 
        os: 'Smartphone / Tablet', 
        name: 'VPN JUMP JUMP', 
        link: 'https://play.google.com/store/apps/details?id=com.jumpjump.vpn',
        description: 'Burlar restrições de rede móvel e operadoras locais.',
        icon: 'fa-mobile-screen-button'
      };
    }
    
    return { 
      os: 'PC / Laptop / Desktop', 
      name: 'TOUCH VPN (Anti-Block)', 
      link: 'https://chromewebstore.google.com/detail/touch-vpn-free-unlimited/bihmplhobchoageojclhkgablbkocmob',
      description: 'Capaz de burlar firewalls de empresas e faculdades.',
      icon: 'fa-chrome'
    };
  };

  const vpn = getVpnInfo();

  useEffect(() => {
    if (isOpen) {
      setError(false);
      // Tentativa de fetch com modo CORS e tratamento de erro de Sandbox
      fetch('https://ipapi.co/json/', { mode: 'cors' })
        .then(r => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then(data => {
          setIpInfo({
            ip: data.ip || 'Indisponível',
            city: data.city || 'Desconhecida',
            country_name: data.country_name || 'Brasil',
            org: data.org || data.asn || 'Provedor Oculto',
            country_code: data.country_code || 'BR'
          });
        })
        .catch(() => {
          setError(true);
          setIpInfo({ 
            ip: 'Sandbox Ativa', 
            org: 'Proteção de Sandbox Ativa', 
            city: 'Localização Protegida', 
            country_name: 'Brasil', 
            country_code: 'BR' 
          });
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-lg rounded-[3rem] border shadow-2xl overflow-hidden flex flex-col h-[600px] ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-100 text-gray-900'
      }`}>
        
        {/* HEADER */}
        <header className="p-8 pb-4 shrink-0 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black tracking-tighter uppercase italic">Rede & Segurança</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Portal OS Network Guard v16</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all active:scale-90 border border-white/10">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* IDENTIDADE DE REDE REAL (ISP / CITY / IP) */}
          <section className={`p-6 rounded-[2.5rem] border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-100'}`}>
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 mb-4">Configuração de Rede Atual</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Operadora (ISP)</p>
                  <p className="text-lg font-black tracking-tighter truncate max-w-[200px]">{ipInfo.org}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Endereço IP</p>
                  <p className={`text-xs font-mono font-bold ${error ? 'text-amber-500' : 'text-blue-500'}`}>{ipInfo.ip}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Localização (City / Country)</p>
                <div className="flex items-center gap-2">
                  <img 
                    src={`https://flagcdn.com/16x12/${ipInfo.country_code?.toLowerCase() || 'br'}.png`} 
                    className="w-4 h-3 rounded-[1px] object-cover" 
                    alt="flag"
                  />
                  <p className="text-sm font-bold">{ipInfo.city}, {ipInfo.country_name}</p>
                </div>
              </div>
            </div>
          </section>

          {/* SOLUÇÃO VPN DINÂMICA (JUMP JUMP VS TOUCH VPN) */}
          <section className="space-y-4">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 ml-4">Módulo Anti-Bloqueio (VPN)</h4>
            <a 
              href={vpn.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative block w-full p-8 rounded-[2.5rem] bg-blue-600 hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20 active:scale-[0.98] overflow-hidden"
            >
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-3xl text-white">
                  <i className={`fa-solid ${vpn.icon}`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-1">{vpn.os}</p>
                  <h4 className="text-xl font-black text-white leading-none mb-2">{vpn.name}</h4>
                  <p className="text-[9px] font-bold text-white/80 leading-tight uppercase tracking-widest">{vpn.description}</p>
                </div>
                <div className="shrink-0">
                  <i className="fa-solid fa-chevron-right text-xl text-white opacity-40 group-hover:translate-x-1 transition-transform"></i>
                </div>
              </div>
              
              {/* Overlay Decorativo */}
              <div className="absolute -bottom-6 -right-6 p-2 opacity-10">
                <i className="fa-solid fa-user-shield text-9xl rotate-12"></i>
              </div>
            </a>
            
            <div className={`p-4 rounded-2xl flex items-start gap-3 border ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-amber-50 border-amber-100'}`}>
               <i className={`fa-solid fa-circle-info text-xs mt-0.5 ${isDark ? 'text-zinc-500' : 'text-amber-500'}`}></i>
               <p className={`text-[9px] font-bold leading-relaxed uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-amber-600'}`}>
                 A VPN permite contornar bloqueios de firewall e DNS em redes restritas (escolas, faculdades ou empresas).
               </p>
            </div>
          </section>
        </div>

        <footer className={`p-8 text-center border-t border-white/5 shrink-0 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
          <p className="text-[8px] font-black uppercase tracking-[0.4em]">Proteção Real-Time • {new Date().toLocaleDateString('pt-BR')} • {new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p>
        </footer>
      </div>
    </div>
  );
};

export default WifiDiagnosisPanel;
