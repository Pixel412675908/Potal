
import React, { useState, useEffect } from 'react';
import { TabType, UserSettings } from '../types';

interface HomeProps {
  settings: UserSettings;
  setActiveTab: (tab: TabType) => void;
}

const Home: React.FC<HomeProps> = ({ settings, setActiveTab }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center overflow-hidden bg-transparent pointer-events-none">
      {/* Relógio Centralizado no Topo - Sem qualquer filtro de desfoque */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 select-none text-white text-center drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] animate-fade-in pointer-events-auto">
        <h1 className="text-6xl md:text-8xl font-light tracking-tighter leading-none mb-2">
          {formatTime(time)}
        </h1>
        <p className="text-[12px] md:text-[14px] font-black tracking-[0.5em] uppercase opacity-90">
          {formatDate(time)}
        </p>
      </div>
    </div>
  );
};

export default Home;
