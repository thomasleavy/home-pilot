import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const HOME_PROFILE_KEY = 'mqtt-device-pilot.homeProfile';

export type TempUnit = 'C' | 'F';

@Injectable({ providedIn: 'root' })
export class TemperatureUnitService {
  private readonly preferredSubject = new BehaviorSubject<TempUnit>(this.readFromStorage());

  preferredUnit$: Observable<TempUnit> = this.preferredSubject.asObservable();

  getPreferredUnit(): TempUnit {
    return this.preferredSubject.value;
  }

  /** Re-read preferred unit from home profile storage (call after saving home profile). */
  refresh(): void {
    this.preferredSubject.next(this.readFromStorage());
  }

  /** Convert Celsius to display value (C or F). Backend/device state is always in Celsius. */
  toDisplay(celsius: number): number {
    const unit = this.preferredSubject.value;
    if (unit === 'F') return Math.round((celsius * 9) / 5 + 32);
    return Math.round(celsius * 10) / 10;
  }

  /** Convert display value back to Celsius for sending to backend. */
  toCelsius(displayValue: number): number {
    const unit = this.preferredSubject.value;
    if (unit === 'F') return Math.round(((displayValue - 32) * 5) / 9 * 10) / 10;
    return displayValue;
  }

  displayUnitLabel(): '°C' | '°F' {
    return this.preferredSubject.value === 'F' ? '°F' : '°C';
  }

  private readFromStorage(): TempUnit {
    try {
      const raw = localStorage.getItem(HOME_PROFILE_KEY);
      if (!raw) return 'C';
      const data = JSON.parse(raw) as { preferredTempUnit?: TempUnit };
      return data.preferredTempUnit === 'F' ? 'F' : 'C';
    } catch {
      return 'C';
    }
  }
}
