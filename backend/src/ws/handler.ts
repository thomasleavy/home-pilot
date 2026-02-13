import { WebSocket } from 'ws';
import { subscribeDevices, subscribeAlerts, unsubscribeAlerts } from '../mqtt';

export function handleWebSocket(ws: WebSocket): void {
  const unsubDevices = subscribeDevices((devices) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'devices', payload: devices }));
    }
  });

  const onAlert = (alert: { deviceId: string; type: string; message: string; timestamp: string }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'alert', payload: alert }));
    }
  };
  subscribeAlerts(onAlert);

  ws.on('close', () => {
    unsubDevices();
    unsubscribeAlerts(onAlert);
  });
}
