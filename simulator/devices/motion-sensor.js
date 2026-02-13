const DEVICE_ID = 'motion-sensor-1';
const STATE_TOPIC = `devices/${DEVICE_ID}/state`;
const ALERTS_TOPIC = 'alerts/high';
const INTERVAL_MS = 8000;

function publishMotion(client) {
  const payload = {
    motion: true,
    timestamp: new Date().toISOString(),
  };
  client.publish(STATE_TOPIC, JSON.stringify(payload), { qos: 0 });
  client.publish(
    ALERTS_TOPIC,
    JSON.stringify({
      deviceId: DEVICE_ID,
      type: 'motion',
      message: 'Motion detected',
      timestamp: payload.timestamp,
    }),
    { qos: 0 }
  );
}

function run(client) {
  setInterval(() => {
    if (!client.connected) return;
    publishMotion(client);
  }, INTERVAL_MS);
}

module.exports = { run };
