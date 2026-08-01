// API Configuration & Base URL Resolver for CaptureFlow

const STORAGE_KEY_API = 'captureflow_api_base';
const STORAGE_KEY_SETTINGS = 'captureflow_user_settings';

export const getApiBase = (): string => {
  if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY_API)) {
    return localStorage.getItem(STORAGE_KEY_API) || 'http://localhost:3000';
  }
  return (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';
};

export const setApiBase = (url: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_API, url);
  }
};

export interface UserSettings {
  captureHotkey: string;
  dashboardHotkey: string;
  oauthEnabled: boolean;
  theme: 'obsidian' | 'dark' | 'midnight';
  storageMode: 'local-indexeddb' | 'wal-server';
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  captureHotkey: 'Ctrl + Shift + C',
  dashboardHotkey: 'Ctrl + Shift + F',
  oauthEnabled: false,
  theme: 'obsidian',
  storageMode: 'local-indexeddb',
};

export const getUserSettings = (): UserSettings => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      try {
        return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) };
      } catch (e) {
        // Fallback
      }
    }
  }
  return DEFAULT_USER_SETTINGS;
};

export const saveUserSettings = (settings: Partial<UserSettings>): UserSettings => {
  const current = getUserSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
  }
  return updated;
};

export const API_BASE = getApiBase();
