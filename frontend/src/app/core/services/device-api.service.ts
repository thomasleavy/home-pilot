import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'poor';

export interface DeviceState {
  deviceId: string;
  type: string;
  name: string;
  state: Record<string, unknown>;
  lastUpdated: string;
}

export interface Alert {
  deviceId: string;
  type: string;
  message: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class DeviceApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private ws: WebSocket | null = null;
  private devicesSubject = new BehaviorSubject<DeviceState[]>([]);
  private alertsSubject = new Subject<Alert>();
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>('disconnected');
  private currentDevices: DeviceState[] = [];
  private deviceStateOverlay = new Map<string, Record<string, unknown>>();
  private readonly overlayStorageKey = 'mqtt-device-pilot.deviceStateOverlay';

  constructor() {
    this.loadOverlayFromStorage();
  }

  devices$ = this.devicesSubject.asObservable();
  alerts$ = this.alertsSubject.asObservable();
  connectionStatus$ = this.connectionStatusSubject.asObservable();

  getDevices(): Observable<DeviceState[]> {
    return this.http.get<DeviceState[]>(`${this.baseUrl}/api/devices`);
  }

  /** Persist user toggles so state survives navigation and page reload. Merged into device list on every emit. */
  setDeviceStateOverlay(deviceId: string, statePatch: Record<string, unknown>): void {
    const cur = this.deviceStateOverlay.get(deviceId) ?? {};
    this.deviceStateOverlay.set(deviceId, { ...cur, ...statePatch });
    this.saveOverlayToStorage();
    this.devicesSubject.next(this.mergeOverlay(this.currentDevices));
  }

  getDeviceOverlay(deviceId: string): Record<string, unknown> {
    return this.deviceStateOverlay.get(deviceId) ?? {};
  }

  private mergeOverlay(devices: DeviceState[]): DeviceState[] {
    return devices.map((d) => {
      const overlay = this.deviceStateOverlay.get(d.deviceId);
      if (!overlay || Object.keys(overlay).length === 0) return d;
      return { ...d, state: { ...d.state, ...overlay } };
    });
  }

  /** Use this when receiving devices from API/WebSocket so overlay is applied. */
  setDevices(devices: DeviceState[]): void {
    this.currentDevices = devices;
    this.devicesSubject.next(this.mergeOverlay(devices));
  }

  private loadOverlayFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.overlayStorageKey);
      if (!raw) return;
      const obj = JSON.parse(raw) as Record<string, Record<string, unknown>>;
      this.deviceStateOverlay.clear();
      Object.entries(obj).forEach(([id, state]) => {
        if (state && typeof state === 'object') this.deviceStateOverlay.set(id, state);
      });
    } catch (_) {
      // ignore invalid stored data
    }
  }

  private saveOverlayToStorage(): void {
    try {
      const obj: Record<string, Record<string, unknown>> = {};
      this.deviceStateOverlay.forEach((state, id) => {
        obj[id] = state;
      });
      localStorage.setItem(this.overlayStorageKey, JSON.stringify(obj));
    } catch (_) {}
  }

  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.baseUrl}/api/alerts`);
  }

  sendCommand(deviceId: string, payload: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/api/devices/${deviceId}/command`, payload);
  }

  getHeatingHistory(): Observable<{ date: string; minutesOn: number }[]> {
    return this.http.get<{ date: string; minutesOn: number }[]>(
      `${this.baseUrl}/api/insights/heating-history?t=${Date.now()}`
    );
  }

  getHotWaterHistory(): Observable<{ date: string; minutesOn: number }[]> {
    return this.http.get<{ date: string; minutesOn: number }[]>(
      `${this.baseUrl}/api/insights/hot-water-history?t=${Date.now()}`
    );
  }

  connectWebSocket(): void {
    const wsUrl = this.baseUrl.replace(/^http/, 'ws');
    this.connectionStatusSubject.next('connecting');
    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === 'devices') {
          this.setDevices(msg.payload ?? []);
        } else if (msg.type === 'alert') {
          this.alertsSubject.next(msg.payload);
        }
        this.connectionStatusSubject.next('connected');
      } catch (_) {}
    };

    this.ws.onopen = () => {
      this.connectionStatusSubject.next('connected');
      this.getDevices().subscribe((devices) => this.setDevices(devices));
      this.getAlerts().subscribe();
    };

    this.ws.onclose = () => {
      this.connectionStatusSubject.next('disconnected');
    };

    this.ws.onerror = () => {
      this.connectionStatusSubject.next('poor');
    };
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionStatusSubject.next('disconnected');
  }
}
