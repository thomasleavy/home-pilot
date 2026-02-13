require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mqtt = require('mqtt');

const light = require('./devices/light');
const thermostat = require('./devices/thermostat');
const motionSensor = require('./devices/motion-sensor');
const hotWater = require('./devices/hot-water');

const BROKER_URL = process.env.MQTT_BROKER_URL || 'localhost';
const BROKER_PORT = process.env.MQTT_BROKER_PORT || '1883';
const USERNAME = process.env.MQTT_USERNAME || '';
const PASSWORD = process.env.MQTT_PASSWORD || '';

const url = `mqtt://${BROKER_URL}:${BROKER_PORT}`;
const options = {};
if (USERNAME) options.username = USERNAME;
if (PASSWORD) options.password = PASSWORD;

const client = mqtt.connect(url, options);

client.on('connect', () => {
  console.log('Simulator connected to broker');
  light.run(client);
  thermostat.run(client);
  motionSensor.run(client);
  hotWater.run(client);
});

client.on('error', (err) => console.error('Simulator MQTT error', err));
