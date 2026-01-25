
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { activityService, ActivityEntry } from '../services/activityService';

interface LiveActivityFeedProps {
  isDark: boolean;
}

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ isDark }) => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    // 1. Carregar atividades recentes (Histórico Real)
    activityService.getRecentActivities(3).then(data => {
      setActivities(data);
    });

    // 2. Ouvir novas atividades (Realtime)
    const channel = activityService.subscribeToFeed((newActivity) => {
      setActivities(prev => [newActivity, ...prev].slice(0, 3));
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (activities.length === 0) return null;

  return (
    <div className="flex flex-col items-end gap-2 pointer-events-none">
      {activities.map((activity, idx) => (
        <div 
          key={activity.id || idx}
          className={`
            flex items-center gap-3 px-4 py-2 rounded-full border shadow-lg animate-fade-in
            ${idx === 0 ? 'opacity-100 scale-100' : idx === 1 ? 'opacity-50 scale-95' : 'opacity-20 scale-90'}
            ${isDark 
              ? 'bg-zinc-950/60 border-zinc-800 text-white' 
              : 'bg-white/80 border-gray-100 text-gray-900'}
            backdrop-blur-xl transition-all duration-700
          `}
        >
          <img 
            src={`https://flagcdn.com/24x18/${activity.country_code.toLowerCase()}.png`} 
            className="w-4 h-3 rounded-[2px] object-cover opacity-80" 
            alt={activity.country}
          />
          <p className="text-[10px] font-black tracking-tight whitespace-nowrap">
            <span className="opacity-40 font-bold uppercase mr-1">Usuário do {activity.country}</span>
            <span className="text-blue-500 uppercase italic">entrou em {activity.action_name}</span>
          </p>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      ))}
    </div>
  );
};

export default LiveActivityFeed;
