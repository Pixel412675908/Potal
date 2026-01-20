
// @ts-nocheck
import { PresenceUser, PresenceState } from '../types';

/**
 * PresenceService v3: Singleton Guard & Minimalist logic
 * Focado em precisão absoluta e prevenção de conexões duplicadas.
 */
class PresenceService {
  private subscribers: ((state: PresenceState) => void)[] = [];
  private deviceId: string = '';
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  
  // Memória de Sessão
  private registry = new Map<string, { tabs: number, country: string, code: string, timeout?: any }>();
  private totalUnique: number = 0;

  constructor() {
    this.initDeviceId();
    // A inicialização agora é protegida contra chamadas múltiplas
    this.initPresence();
  }

  private initDeviceId() {
    let id = localStorage.getItem('portal_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('portal_device_id', id);
    }
    this.deviceId = id;
  }

  private async initPresence() {
    // PADRÃO SINGLETON: Verifica se já existe uma conexão ativa ou em curso
    if (this.isConnected || this.isConnecting) {
      console.log("Presença: Já conectado ou conectando, abortando tentativa duplicada...");
      return;
    }

    console.log("Presença: Tentando conectar pela primeira vez...");
    this.isConnecting = true;

    let country = 'Global';
    let countryCode = 'UN';
    
    try {
      // Handshake com GeoIP
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      country = data.country_name || 'Global';
      countryCode = data.country_code || 'UN';
    } catch (e) {
      console.warn("GeoIP indisponível, seguindo com dados anônimos.");
    }

    // Registrar conexão única
    this.handleNewConnection(this.deviceId, country, countryCode);
    
    this.isConnected = true;
    this.isConnecting = false;
    console.log("Presença: Conexão estabelecida com ID:", this.deviceId);

    // Evento de fechamento
    window.addEventListener('beforeunload', () => {
      this.handleDisconnect(this.deviceId);
    });
  }

  private handleNewConnection(id: string, country: string, code: string) {
    const session = this.registry.get(id);

    if (!session) {
      this.registry.set(id, { tabs: 1, country, code });
      this.totalUnique++;
    } else {
      if (session.timeout) {
        clearTimeout(session.timeout);
        delete session.timeout;
      }
      session.tabs++;
    }
    this.broadcast();
  }

  private handleDisconnect(id: string) {
    const session = this.registry.get(id);
    if (!session) return;

    session.tabs--;

    if (session.tabs <= 0) {
      // Grace period para evitar flutuação no F5
      session.timeout = setTimeout(() => {
        this.registry.delete(id);
        this.totalUnique = Math.max(0, this.totalUnique - 1);
        this.broadcast();
      }, 3000); 
    }
  }

  private broadcast() {
    const state = this.compileState();
    this.subscribers.forEach(cb => cb(state));
  }

  private compileState(): PresenceState {
    const byCountry: Record<string, { count: number; code: string }> = {};
    this.registry.forEach((data) => {
      if (data.timeout) return;
      if (!byCountry[data.country]) {
        byCountry[data.country] = { count: 0, code: data.code };
      }
      byCountry[data.country].count++;
    });
    return { total: this.totalUnique, byCountry };
  }

  subscribe(callback: (state: PresenceState) => void) {
    this.subscribers.push(callback);
    this.broadcast();
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }
}

// Exportamos a instância única
export const presence = new PresenceService();
