import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type TextSize = 'small' | 'medium' | 'large';

const STORAGE_KEY_PREFIX = 'mqtt-dashboard-text-size';

@Injectable({ providedIn: 'root' })
export class TextSizeService {
  private auth = inject(AuthService);
  private sizeSignal = signal<TextSize>(this.loadForCurrentUser());

  size = this.sizeSignal.asReadonly();

  private getStorageKey(): string | null {
    const user = this.auth.getCurrentUser();
    return user ? `${STORAGE_KEY_PREFIX}-${user.id}` : null;
  }

  setSize(size: TextSize): void {
    this.sizeSignal.set(size);
    const key = this.getStorageKey();
    if (key) {
      try {
        localStorage.setItem(key, size);
      } catch (_) {}
    }
    this.applyToDocument(size);
  }

  private loadForCurrentUser(): TextSize {
    const key = this.getStorageKey();
    if (!key) return 'medium';
    try {
      const stored = localStorage.getItem(key) as TextSize | null;
      if (stored === 'small' || stored === 'medium' || stored === 'large') return stored;
    } catch (_) {}
    return 'medium';
  }

  /** Reload and apply the current user's saved text size (e.g. after login). */
  reloadForCurrentUser(): void {
    const size = this.loadForCurrentUser();
    this.sizeSignal.set(size);
    this.applyToDocument(size);
  }

  applyToDocument(size: TextSize): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
    root.classList.add(`text-size-${size}`);
  }

  init(): void {
    this.applyToDocument(this.sizeSignal());
  }
}
