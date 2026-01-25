
import { supabase } from './supabaseClient';

export interface ActivityEntry {
  id: string;
  country: string;
  country_code: string;
  action_name: string;
  created_at: string;
}

class ActivityService {
  private userLocation: { country: string, code: string } | null = null;

  private async getLocation() {
    if (this.userLocation) return this.userLocation;
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      this.userLocation = {
        country: data.country_name || 'Desconhecido',
        code: data.country_code || 'UN'
      };
      return this.userLocation;
    } catch (e) {
      return { country: 'Global', code: 'UN' };
    }
  }

  /**
   * Registra uma ação real do usuário no banco de dados.
   */
  async logAction(itemName: string) {
    const loc = await this.getLocation();
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        country: loc.country,
        country_code: loc.code,
        action_name: itemName
      });
    
    if (error) console.error('Activity Log Error:', error);
  }

  /**
   * Subscreve para atualizações em tempo real das atividades de outros usuários.
   */
  subscribeToFeed(onNewActivity: (activity: ActivityEntry) => void) {
    return supabase
      .channel('live-activity-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => onNewActivity(payload.new as ActivityEntry)
      )
      .subscribe();
  }

  /**
   * Busca as últimas atividades para popular o feed inicial.
   */
  async getRecentActivities(limit = 3) {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  }
}

export const activityService = new ActivityService();
