
import { supabase } from './supabaseClient';
import { PresenceState } from '../types';

/**
 * PresenceService v17: Sincronização Global e Realtime
 * Corrige o isolamento de sessões e implementa geolocalização dinâmica.
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
    // ID único por browser/dispositivo para que o Supabase identifique como um nó separado
    let id = localStorage.getItem('portal_node_id');
    if (!id) {
      id = 'node_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('portal_node_id', id);
    }
    this.deviceId = id;
  }

  private async connect() {
    if (this.channel) {
      this.channel.unsubscribe();
    }

    // 1. GEOLOCALIZAÇÃO REAL: Busca dados do usuário atual
    let country = 'Desconhecido';
    let countryCode = 'UN';
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        country = data.country_name || 'Desconhecido';
        countryCode = data.country_code || 'UN';
      }
    } catch (e) {
      console.warn("Presence: Falha ao obter GeoIP, usando fallback.");
    }

    // 2. SALA ÚNICA (FIXA): Todos os usuários entram no mesmo canal
    this.channel = supabase.channel('global-tracking-room', {
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
        console.debug('Novo usuário conectado:', key);
        this.handleSync();
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.debug('Usuário desconectado:', key);
        this.handleSync();
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // 3. RASTREAMENTO IMEDIATO: Envia o país real para o cluster
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
    
    // 4. AGRUPAMENTO DINÂMICO: Transforma o estado bruto em contagem por país
    const byCountry = Object.keys(presenceState).reduce((acc, key) => {
      const userPresences = presenceState[key];
      if (userPresences && userPresences.length > 0) {
        const data = userPresences[0]; // Dados do primeiro track do usuário
        const countryName = data.country || 'Desconhecido';
        const code = data.code || 'UN';

        if (!acc[countryName]) {
          acc[countryName] = { count: 0, code };
        }
        acc[countryName].count++;
      }
      return acc;
    }, {} as Record<string, { count: number; code: string }>);

    const total = Object.values(byCountry).reduce((sum, item) => sum + item.count, 0);

    this.state = { total, byCountry };
    this.broadcast();
  }

  private broadcast() {
    this.subscribers.forEach(cb => cb({ ...this.state }));
  }

  subscribe(callback: (state: PresenceState) => void) {
    this.subscribers.push(callback);
    callback({ ...this.state });
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }
}

export const presence = new PresenceService();
