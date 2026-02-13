const DEVICE_ID = 'thermostat-1';
const STATE_TOPIC = `devices/${DEVICE_ID}/state`;
const COMMAND_TOPIC = `devices/${DEVICE_ID}/command`;

let temperature = 21;
let setpoint = 22;
let heatingOn = true;
const UNIT = 'C';

function publishState(client) {
  client.publish(
    STATE_TOPIC,
    JSON.stringify({ temperature, setpoint, unit: UNIT, heatingOn }),
    { qos: 0 }
  );
}

function run(client) {
  client.subscribe(COMMAND_TOPIC, (err) => {
    if (err) {
      console.error('[thermostat] subscribe failed', err);
      return;
    }
    publishState(client);
  });

  client.on('message', (topic, payload) => {
    if (topic !== COMMAND_TOPIC) return;
    try {
      const msg = JSON.parse(payload.toString());
      if (typeof msg.setpoint === 'number') {
        setpoint = Math.max(15, Math.min(30, msg.setpoint));
      }
      if (msg.hasOwnProperty('heatingOn')) {
        heatingOn = msg.heatingOn === true || msg.heatingOn === 'true';
      }
      publishState(client);
    } catch (_) {}
  });

  setInterval(() => {
    if (!client.connected) return;
    temperature += (Math.random() - 0.5) * 0.4;
    temperature = Math.round(temperature * 10) / 10;
    publishState(client);
  }, 5000);
}

module.exports = { run };
