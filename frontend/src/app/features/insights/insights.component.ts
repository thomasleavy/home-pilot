import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeviceApiService } from '../../core/services/device-api.service';

const REFRESH_INTERVAL_MS = 5_000;

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './insights.component.html',
  styleUrl: './insights.component.css',
})
export class InsightsComponent implements OnInit, OnDestroy {
  private api = inject(DeviceApiService);
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  heatingHistory: { date: string; minutesOn: number }[] = [];
  hotWaterHistory: { date: string; minutesOn: number }[] = [];
  loading = true;
  error: string | null = null;
  private heatingDone = false;
  private hotWaterDone = false;

  ngOnInit(): void {
    this.loadHistory();
    this.refreshTimer = setInterval(() => this.loadHistory(), REFRESH_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  private loadHistory(): void {
    this.api.getHeatingHistory().subscribe({
      next: (data) => {
        this.heatingHistory = data;
        this.heatingDone = true;
        this.error = null;
        if (this.hotWaterDone) this.loading = false;
      },
      error: () => {
        if (this.heatingHistory.length === 0) this.heatingHistory = this.emptyHistory();
        this.heatingDone = true;
        this.error = "Cannot load insights. Is the backend running at http://localhost:3000?";
        if (this.hotWaterDone) this.loading = false;
      },
    });
    this.api.getHotWaterHistory().subscribe({
      next: (data) => {
        this.hotWaterHistory = data;
        this.hotWaterDone = true;
        this.error = null;
        if (this.heatingDone) this.loading = false;
      },
      error: () => {
        if (this.hotWaterHistory.length === 0) this.hotWaterHistory = this.emptyHistory();
        this.hotWaterDone = true;
        this.error = "Cannot load insights. Is the backend running at http://localhost:3000?";
        if (this.heatingDone) this.loading = false;
      },
    });
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const todayKey = this.localDateKey(today);
    if (dateStr === todayKey) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === this.localDateKey(yesterday)) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  private localDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private emptyHistory(): { date: string; minutesOn: number }[] {
    const out: { date: string; minutesOn: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      out.push({ date: this.localDateKey(d), minutesOn: 0 });
    }
    return out;
  }

  /** Fixed scale: 24 hours = 100% of container. Invisible reference points at 4, 8, 12, 16, 20, 24 hr. */
  private readonly maxMinutesScale = 24 * 60; // 1440

  heatingBarHeight(minutesOn: number): number {
    const pct = (minutesOn / this.maxMinutesScale) * 100;
    return Math.min(100, Math.round(pct * 10) / 10);
  }

  hotWaterBarHeight(minutesOn: number): number {
    const pct = (minutesOn / this.maxMinutesScale) * 100;
    return Math.min(100, Math.round(pct * 10) / 10);
  }

  /** e.g. 22.3 → "22.3 min", 140 → "2 hr 20 min" */
  formatDuration(minutesOn: number): string {
    if (minutesOn < 60) return `${minutesOn} min`;
    const hours = Math.floor(minutesOn / 60);
    const mins = Math.round(minutesOn % 60);
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  }
}
