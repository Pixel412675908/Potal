
export type TabType = 'home' | 'dashboard' | 'studio' | 'favorites' | 'collections' | 'history' | 'settings';

export type AnalysisStatus = 'ok' | 'error_dns' | 'error_firewall' | 'error_malicious' | 'pending' | 'none';

/**
 * Interface for grouping dashboard resources by category.
 */
export interface Category {
  id: string;
  name: string;
  icon: string;
}

/**
 * Represents a single resource link on the dashboard.
 */
export interface LinkItem {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  subCategory?: string;
  baseViews: number;
  videoUrl?: string;
  isDownload?: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'glass';
  accentColor: string;
  wallpaperUrl: string;
  devicePreference: 'mobile' | 'desktop';
  uploadedWallpapers: UploadedWallpaper[];
}

export interface UploadedWallpaper {
  id: string;
  url: string;
  name: string;
  type: 'mobile' | 'desktop';
  timestamp: number;
}

/**
 * State object for the real-time presence system.
 */
export interface PresenceState {
  total: number;
  byCountry: Record<string, { count: number; code: string }>;
}

/**
 * Represents a connected user in the presence registry.
 */
export interface PresenceUser {
  id: string;
  country: string;
  code: string;
}

/**
 * Represents an entry in the user's interaction history.
 */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: string;
}
