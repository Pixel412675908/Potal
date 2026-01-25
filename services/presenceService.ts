
import { supabase } from './supabaseClient';
import { PresenceState } from '../types';

/**
 * PresenceService v16: Global Realtime Synchronization
 * Gerencia a contagem global de usuários online garantindo que todos os browsers
 * se conectem ao mesmo canal estático.
 */
class PresenceService {
  private subscribers: ((state: PresenceState) => void)[] = [];
  private deviceId: string = '';
  private channel: any = null;
  // Iniciamos com total 1 para evitar o "Bug do Zero" visual
  private state: PresenceState = { total: 1, byCountry: {} };
  private reconnectTimeout: any = null;

  constructor() {
    this.initDeviceId();
    this.connect();
  }

  private initDeviceId() {
    let id = localStorage.getItem('portal_device_id');
    if (!id) {
      id = 'node_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('portal_device_id', id);
    }
    this.deviceId = id;
  }

  private async connect() {
    if (this.channel) {
      this.channel.unsubscribe();
    }

    // Identificação de localidade para o mapa de presença
    let country = 'Global';
    let countryCode = 'UN';
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      country = data.country_name || 'Global';
      countryCode = data.country_code || 'UN';
    } catch (e) {
      console.warn("Presence: Localização baseada em fallback.");
    }

    // CANAL GLOBAL ESTÁTICO: Todos os usuários DEVEM entrar aqui
    // O nome 'portal_global_presence_v16' é mandatório para evitar isolamento
    this.channel = supabase.channel('portal_global_presence_v16', {
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
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('Presence Node Joined:', key);
        this.handleSync();
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('Presence Node Left:', key);
        this.handleSync();
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Track envia os sinais de "batimento cardíaco" para o cluster
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
    }, 3000);
  }

  private handleSync() {
    const presenceState = this.channel.presenceState();
    const byCountry: Record<string, { count: number; code: string }> = {};
    let total = 0;

    // Supabase Presence agrupa por chave (key). Iteramos pelas chaves únicas.
    Object.keys(presenceState).forEach((key) => {
      const sessions = presenceState[key];
      if (sessions && sessions.length > 0) {
        const primarySession = sessions[0];
        const countryName = primarySession.country || 'Global';
        
        if (!byCountry[countryName]) {
          byCountry[countryName] = { count: 0, code: primarySession.code || 'UN' };
        }
        byCountry[countryName].count++;
        total++;
      }
    });

    // Se por algum motivo o total for 0 (delay de rede), mantemos 1 (o usuário atual)
    this.state = { total: Math.max(total, 1), byCountry };
    this.broadcast();
  }

  private broadcast() {
    this.subscribers.forEach(cb => cb({ ...this.state }));
  }

  subscribe(callback: (state: PresenceState) => void) {
    this.subscribers.push(callback);
    // Push imediato do estado atual para evitar delay de render
    callback({ ...this.state });
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }
}

export const presence = new PresenceService();
