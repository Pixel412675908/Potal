
import { supabase } from './supabaseClient';
import { PresenceState } from '../types';

/**
 * PresenceService v4: Supabase Realtime Presence
 * Gerencia a contagem global de usuários online com persistência.
 */
class PresenceService {
  private subscribers: ((state: PresenceState) => void)[] = [];
  private deviceId: string = '';
  private channel: any = null;
  private state: PresenceState = { total: 0, byCountry: {} };
  private reconnectTimeout: any = null;

  constructor() {
    this.initDeviceId();
    this.connect();
  }

  private initDeviceId() {
    let id = localStorage.getItem('portal_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('portal_device_id', id);
    }
    this.deviceId = id;
  }

  private async connect() {
    if (this.channel) {
      this.channel.unsubscribe();
    }

    // Obter dados de localização básicos
    let country = 'Global';
    let countryCode = 'UN';
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      country = data.country_name || 'Global';
      countryCode = data.country_code || 'UN';
    } catch (e) {
      console.warn("GeoIP fail, using default.");
    }

    // Configura o canal de presença com o Supabase
    this.channel = supabase.channel('online-portal', {
      config: {
        presence: {
          key: this.deviceId,
        },
      },
    });

    this.channel
      .on('presence', { event: 'sync' }, () => {
        this.handleSync();
      })
      .on('presence', { event: 'join' }, ({ key, currentPresences }) => {
        console.log('Join:', key, currentPresences);
        this.handleSync();
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Leave:', key, leftPresences);
        this.handleSync();
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Track envia os dados do usuário para o cluster do Supabase
          await this.channel.track({
            country,
            code: countryCode,
            online_at: new Date().toISOString(),
          });
        }

        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.attemptReconnect();
        }
      });
  }

  private attemptReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 5000);
  }

  private handleSync() {
    const presenceState = this.channel.presenceState();
    const byCountry: Record<string, { count: number; code: string }> = {};
    let total = 0;

    // Processa o objeto complexo do Supabase Presence para o nosso formato simplificado
    Object.keys(presenceState).forEach((key) => {
      const userPresences = presenceState[key];
      if (userPresences && userPresences.length > 0) {
        const data = userPresences[0]; // Pegamos a primeira aba/sessão do mesmo dispositivo
        const countryName = data.country || 'Global';
        
        if (!byCountry[countryName]) {
          byCountry[countryName] = { count: 0, code: data.code || 'UN' };
        }
        byCountry[countryName].count++;
        total++;
      }
    });

    this.state = { total, byCountry };
    this.broadcast();
  }

  private broadcast() {
    this.subscribers.forEach(cb => cb(this.state));
  }

  subscribe(callback: (state: PresenceState) => void) {
    this.subscribers.push(callback);
    // Envia o estado atual imediatamente
    callback(this.state);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }
}

export const presence = new PresenceService();
