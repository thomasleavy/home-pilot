import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeviceApiService, DeviceState, Alert, ConnectionStatus } from '../../core/services/device-api.service';
import { AuthService } from '../../core/services/auth.service';
import { TemperatureUnitService } from '../../core/services/temperature-unit.service';

const HOT_WATER_PLACEHOLDER: DeviceState = {
  deviceId: 'hot-water-1',
  type: 'hot-water',
  name: 'Hot Water',
  state: { on: false },
  lastUpdated: new Date().toISOString(),
};

const LIVING_ROOM_LIGHT_PLACEHOLDER: DeviceState = {
  deviceId: 'living-room-light',
  type: 'light',
  name: 'Living Room Light',
  state: { on: false },
  lastUpdated: new Date().toISOString(),
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private api = inject(DeviceApiService);
  private auth = inject(AuthService);
  private tempUnit = inject(TemperatureUnitService);

  devices: DeviceState[] = [];
  alerts: Alert[] = [];
  loading = true;
  error: string | null = null;
  connectionStatus: ConnectionStatus = 'disconnected';

  /** Latest preferred unit so template updates when user changes it (e.g. after saving home profile). */
  preferredUnit: 'C' | 'F' = 'C';

  ngOnInit(): void {
    this.tempUnit.refresh();
    this.preferredUnit = this.tempUnit.getPreferredUnit();
    this.tempUnit.preferredUnit$.subscribe((u) => (this.preferredUnit = u));
    this.api.connectionStatus$.subscribe((s) => (this.connectionStatus = s));
    this.api.devices$.subscribe((d) => (this.devices = this.ensurePlaceholderDevicesInList(d)));
    this.api.alerts$.subscribe((a) => this.alerts.unshift(a));
    this.api.getDevices().subscribe({
      next: (d) => {
        this.api.setDevices(d);
        this.loading = false;
      },
      error: (e) => {
        this.error = 'Cannot reach backend. Start the backend (see README).';
        this.loading = false;
      },
    });
    this.api.getAlerts().subscribe({
      next: (a) => (this.alerts = a ?? []),
    });
  }

  ngOnDestroy(): void {
    // WebSocket is managed by app shell; no disconnect here
  }

  toggleLight(deviceId: string, currentOn: boolean): void {
    const newOn = !currentOn;
    this.api.setDeviceStateOverlay(deviceId, { on: newOn });
    this.devices = this.devices.map((d) =>
      d.deviceId === deviceId ? { ...d, state: { ...d.state, on: newOn } } : d
    );
    this.api.sendCommand(deviceId, { on: newOn }).subscribe();
  }

  toggleHotWater(deviceId: string, currentOn: boolean): void {
    const newOn = !currentOn;
    this.api.setDeviceStateOverlay(deviceId, { on: newOn });
    this.devices = this.ensurePlaceholderDevicesInList(this.devices);
    this.devices = this.devices.map((d) =>
      d.deviceId === deviceId ? { ...d, state: { ...d.state, on: newOn } } : d
    );
    this.api.sendCommand(deviceId, { on: newOn }).subscribe();
  }

  private ensurePlaceholderDevicesInList(devices: DeviceState[]): DeviceState[] {
    let list = devices;
    if (!list.some((d) => d.deviceId === 'living-room-light')) {
      const overlay = this.api.getDeviceOverlay('living-room-light');
      const state = { on: (overlay['on'] as boolean) ?? false };
      list = [...list, { ...LIVING_ROOM_LIGHT_PLACEHOLDER, state, lastUpdated: new Date().toISOString() }];
    }
    if (!list.some((d) => d.deviceId === 'hot-water-1')) {
      const overlay = this.api.getDeviceOverlay('hot-water-1');
      const state = { on: (overlay['on'] as boolean) ?? false };
      list = [...list, { ...HOT_WATER_PLACEHOLDER, state, lastUpdated: new Date().toISOString() }];
    }
    return list;
  }

  /** setpoint is in Celsius (backend/device use C). */
  setThermostat(deviceId: string, setpointCelsius: number): void {
    this.api.sendCommand(deviceId, { setpoint: setpointCelsius }).subscribe();
  }

  /** Step setpoint by delta in the user's display unit (1 or -1), then send Celsius to backend. */
  stepThermostatSetpoint(deviceId: string, device: DeviceState, delta: number): void {
    const setpointC = this.getThermostatSetpoint(device);
    const displayValue = this.tempUnit.toDisplay(setpointC);
    const newDisplay = displayValue + delta;
    const newC = this.tempUnit.toCelsius(newDisplay);
    this.setThermostat(deviceId, newC);
  }

  setThermostatHeating(deviceId: string, heatingOn: boolean): void {
    this.api.setDeviceStateOverlay(deviceId, { heatingOn });
    this.devices = this.devices.map((d) =>
      d.deviceId === deviceId ? { ...d, state: { ...d.state, heatingOn } } : d
    );
    this.api.sendCommand(deviceId, { heatingOn }).subscribe();
  }

  getLightOn(device: DeviceState): boolean {
    return (device.state['on'] as boolean) ?? false;
  }

  getThermostatTemp(device: DeviceState): number {
    const celsius = (device.state['temperature'] as number) ?? 0;
    return this.tempUnit.toDisplay(celsius);
  }

  getThermostatSetpoint(device: DeviceState): number {
    const celsius = (device.state['setpoint'] as number) ?? 20;
    return this.tempUnit.toDisplay(celsius);
  }

  getThermostatHeatingOn(device: DeviceState): boolean {
    return (device.state['heatingOn'] as boolean) ?? true;
  }

  getMotionTime(device: DeviceState): string {
    const ts = device.state['timestamp'] as string;
    return ts ? new Date(ts).toLocaleTimeString() : '—';
  }

  connectionLabel(): string {
    switch (this.connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting…';
      case 'poor': return 'Poor connection';
      default: return 'Disconnected';
    }
  }

  onLogout(): void {
    this.auth.logout();
  }
}
