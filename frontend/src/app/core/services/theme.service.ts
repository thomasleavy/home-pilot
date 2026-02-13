import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'mqtt-dashboard-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeSignal = signal<Theme>(this.loadInitial());

  theme = this.themeSignal.asReadonly();
  isDark = computed(() => this.themeSignal() === 'dark');

  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {}
    this.applyToDocument(theme);
  }

  toggle(): void {
    const next = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  private loadInitial(): Theme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (_) {}
    return 'light';
  }

  applyToDocument(theme: Theme): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
  }

  /** Call once at app init to sync document with stored theme. */
  init(): void {
    this.applyToDocument(this.themeSignal());
  }
}
