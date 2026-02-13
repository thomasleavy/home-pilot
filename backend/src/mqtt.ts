import mqtt from 'mqtt';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'localhost';
const BROKER_PORT = process.env.MQTT_BROKER_PORT || '1883';
const USERNAME = process.env.MQTT_USERNAME || '';
const PASSWORD = process.env.MQTT_PASSWORD || '';

export type DeviceState = {
  deviceId: string;
  type: string;
  name: string;
  state: Record<string, unknown>;
  lastUpdated: string;
};

export type Alert = {
  deviceId: string;
  type: string;
  message: string;
  timestamp: string;
};

const deviceRegistry: Map<string, DeviceState> = new Map();
const alerts: Alert[] = [];
const ALERTS_MAX = 50;

const heatingSecondsByDay: Record<string, number> = {};
let lastThermostatHeating: { on: boolean; ts: number } = { on: false, ts: 0 };

const hotWaterSecondsByDay: Record<string, number> = {};
let lastHotWaterOn: { on: boolean; ts: number } = { on: false, ts: 0 };

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addHeatingSeconds(seconds: number, dateStr: string): void {
  heatingSecondsByDay[dateStr] = (heatingSecondsByDay[dateStr] ?? 0) + seconds;
}

function addHotWaterSeconds(seconds: number, dateStr: string): void {
  hotWaterSecondsByDay[dateStr] = (hotWaterSecondsByDay[dateStr] ?? 0) + seconds;
}

export function getHeatingHistory(): { date: string; minutesOn: number }[] {
  const out: { date: string; minutesOn: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const minutes = Math.round(((heatingSecondsByDay[key] ?? 0) / 60) * 10) / 10;
    out.push({ date: key, minutesOn: minutes });
  }
  return out;
}

export function getHotWaterHistory(): { date: string; minutesOn: number }[] {
  const out: { date: string; minutesOn: number }[] = [];
  const now = new Date();
  const nowSec = Date.now() / 1000;
  const todayKey = dateKey(now);
  let todaySeconds = hotWaterSecondsByDay[todayKey] ?? 0;
  if (lastHotWaterOn.on && lastHotWaterOn.ts > 0) {
    todaySeconds += Math.max(0, nowSec - lastHotWaterOn.ts);
  }
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const seconds = key === todayKey ? todaySeconds : (hotWaterSecondsByDay[key] ?? 0);
    const minutes = Math.round((seconds / 60) * 10) / 10;
    out.push({ date: key, minutesOn: minutes });
  }
  return out;
}

type Listener = (devices: DeviceState[]) => void;
type AlertListener = (alert: Alert) => void;
const deviceListeners = new Set<Listener>();
const alertListeners = new Set<AlertListener>();

const DEVICE_META: Record<string, { type: string; name: string }> = {
  'living-room-light': { type: 'light', name: 'Living Room Light' },
  'thermostat-1': { type: 'thermostat', name: 'Thermostat' },
  'motion-sensor-1': { type: 'motion', name: 'Motion Sensor' },
  'hot-water-1': { type: 'hot-water', name: 'Hot Water' },
};

function getMeta(deviceId: string): { type: string; name: string } {
  return DEVICE_META[deviceId] ?? { type: 'unknown', name: deviceId };
}

function notifyDeviceListeners(): void {
  ensurePlaceholderDevices();
  const list = Array.from(deviceRegistry.values());
  deviceListeners.forEach((fn) => fn(list));
}

function notifyAlertListeners(alert: Alert): void {
  alertListeners.forEach((fn) => fn(alert));
}

function handleStateMessage(topic: string, payload: Buffer): void {
  const match = topic.match(/^devices\/([^/]+)\/state$/);
  if (!match) return;
  const deviceId = match[1];
  let state: Record<string, unknown>;
  try {
    state = JSON.parse(payload.toString()) as Record<string, unknown>;
  } catch {
    return;
  }
  if (deviceId === 'thermostat-1') {
    const now = Date.now() / 1000;
    const heatingOn = state.heatingOn !== false;
    if (lastThermostatHeating.on && lastThermostatHeating.ts > 0) {
      const elapsed = Math.max(0, now - lastThermostatHeating.ts);
      const today = dateKey(new Date(now * 1000));
      addHeatingSeconds(elapsed, today);
    }
    lastThermostatHeating = { on: heatingOn, ts: now };
  }
  if (deviceId === 'hot-water-1') {
    const now = Date.now() / 1000;
    const on = state.on !== false;
    if (lastHotWaterOn.on && lastHotWaterOn.ts > 0) {
      const elapsed = Math.max(0, now - lastHotWaterOn.ts);
      const today = dateKey(new Date(now * 1000));
      addHotWaterSeconds(elapsed, today);
    }
    lastHotWaterOn = { on, ts: now };
  }
  const meta = getMeta(deviceId);
  const entry: DeviceState = {
    deviceId,
    type: meta.type,
    name: meta.name,
    state,
    lastUpdated: new Date().toISOString(),
  };
  deviceRegistry.set(deviceId, entry);
  notifyDeviceListeners();
}

function handleAlertMessage(payload: Buffer): void {
  let data: { deviceId?: string; type?: string; message?: string; timestamp?: string };
  try {
    data = JSON.parse(payload.toString()) as typeof data;
  } catch {
    return;
  }
  const alert: Alert = {
    deviceId: data.deviceId ?? 'unknown',
    type: data.type ?? 'alert',
    message: data.message ?? 'Alert',
    timestamp: data.timestamp ?? new Date().toISOString(),
  };
  alerts.unshift(alert);
  if (alerts.length > ALERTS_MAX) alerts.pop();
  notifyAlertListeners(alert);
}

export function connectMqtt(): mqtt.MqttClient {
  const url = `mqtt://${BROKER_URL}:${BROKER_PORT}`;
  const options: mqtt.IClientOptions = {};
  if (USERNAME) options.username = USERNAME;
  if (PASSWORD) options.password = PASSWORD;

  const client = mqtt.connect(url, options);

  client.on('connect', () => {
    client.subscribe('devices/+/state', (err) => {
      if (err) console.error('Subscribe devices/+/state failed', err);
    });
    client.subscribe('alerts/high', (err) => {
      if (err) console.error('Subscribe alerts/high failed', err);
    });
  });

  client.on('message', (topic, payload) => {
    if (topic.startsWith('devices/') && topic.endsWith('/state')) {
      handleStateMessage(topic, payload);
    } else if (topic === 'alerts/high') {
      handleAlertMessage(payload);
    }
  });

  client.on('error', (err) => console.error('MQTT error', err));

  return client;
}

/** Update hot-water history from an API command (so duration is counted even without MQTT state). */
export function recordHotWaterCommand(payload: Record<string, unknown>): void {
  if (!payload || !('on' in payload)) return;
  const now = Date.now() / 1000;
  const on = payload.on !== false;
  if (lastHotWaterOn.on && lastHotWaterOn.ts > 0) {
    const elapsed = Math.max(0, now - lastHotWaterOn.ts);
    const today = dateKey(new Date(now * 1000));
    addHotWaterSeconds(elapsed, today);
  }
  lastHotWaterOn = { on, ts: now };
}

export function publishCommand(deviceId: string, payload: Record<string, unknown>): void {
  if (deviceId === 'hot-water-1') {
    recordHotWaterCommand(payload);
  }
  const client = (global as unknown as { mqttClient?: mqtt.MqttClient }).mqttClient;
  if (!client?.connected) return;
  const topic = `devices/${deviceId}/command`;
  client.publish(topic, JSON.stringify(payload));
}

function ensurePlaceholderDevices(): void {
  if (!deviceRegistry.has('living-room-light')) {
    const meta = getMeta('living-room-light');
    deviceRegistry.set('living-room-light', {
      deviceId: 'living-room-light',
      type: meta.type,
      name: meta.name,
      state: { on: false },
      lastUpdated: new Date().toISOString(),
    });
  }
  if (!deviceRegistry.has('hot-water-1')) {
    const meta = getMeta('hot-water-1');
    deviceRegistry.set('hot-water-1', {
      deviceId: 'hot-water-1',
      type: meta.type,
      name: meta.name,
      state: { on: false },
      lastUpdated: new Date().toISOString(),
    });
  }
  if (!deviceRegistry.has('thermostat-1')) {
    const meta = getMeta('thermostat-1');
    deviceRegistry.set('thermostat-1', {
      deviceId: 'thermostat-1',
      type: meta.type,
      name: meta.name,
      state: { temperature: 20, setpoint: 20, heatingOn: false },
      lastUpdated: new Date().toISOString(),
    });
  }
}

export function getDevices(): DeviceState[] {
  ensurePlaceholderDevices();
  return Array.from(deviceRegistry.values());
}

export function getAlerts(): Alert[] {
  return [...alerts];
}

export function subscribeDevices(fn: Listener): () => void {
  deviceListeners.add(fn);
  fn(getDevices());
  return () => deviceListeners.delete(fn);
}

export function subscribeAlerts(fn: AlertListener): void {
  alertListeners.add(fn);
}

export function unsubscribeAlerts(fn: AlertListener): void {
  alertListeners.delete(fn);
}
