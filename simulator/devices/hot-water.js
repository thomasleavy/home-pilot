const DEVICE_ID = 'hot-water-1';
const STATE_TOPIC = `devices/${DEVICE_ID}/state`;
const COMMAND_TOPIC = `devices/${DEVICE_ID}/command`;
const INTERVAL_MS = 60 * 1000;

let on = false;
let intervalId = null;

function publishState(client) {
  client.publish(STATE_TOPIC, JSON.stringify({ on }), { qos: 0 });
}

function run(client) {
  client.subscribe(COMMAND_TOPIC, (err) => {
    if (err) {
      console.error('[hot-water] subscribe failed', err);
      return;
    }
    publishState(client);
  });

  client.on('message', (topic, payload) => {
    if (topic !== COMMAND_TOPIC) return;
    try {
      const msg = JSON.parse(payload.toString());
      if (typeof msg.on === 'boolean') {
        on = msg.on;
        publishState(client);
        if (on && !intervalId) {
          intervalId = setInterval(() => publishState(client), INTERVAL_MS);
        } else if (!on && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    } catch (_) {}
  });
}

module.exports = { run };
