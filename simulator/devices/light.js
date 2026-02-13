const DEVICE_ID = 'living-room-light';
const STATE_TOPIC = `devices/${DEVICE_ID}/state`;
const COMMAND_TOPIC = `devices/${DEVICE_ID}/command`;

let on = false;

function publishState(client) {
  client.publish(STATE_TOPIC, JSON.stringify({ on }), { qos: 0 });
}

function run(client) {
  client.subscribe(COMMAND_TOPIC, (err) => {
    if (err) {
      console.error('[light] subscribe failed', err);
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
      }
    } catch (_) {}
  });
}

module.exports = { run };
