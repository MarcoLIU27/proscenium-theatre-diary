import { Production } from '../types';
import { INITIAL_PRODUCTIONS } from '../data/sampleProductions';

const STORAGE_KEY = 'theatre_diary_productions_v1';

export function loadProductions(): Production[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time init with sample data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTIONS));
      return INITIAL_PRODUCTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_PRODUCTIONS;
  } catch (err) {
    console.error('Failed to load productions from LocalStorage', err);
    return INITIAL_PRODUCTIONS;
  }
}

export function saveProductions(productions: Production[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productions));
  } catch (err) {
    console.error('Failed to save productions to LocalStorage', err);
  }
}

export function exportBackupJSON(productions: Production[]): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(productions, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `theatre-diary-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function resetToSampleData(): Production[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTIONS));
  return INITIAL_PRODUCTIONS;
}
