# MQTT topic convention

Used by the backend and the simulator. Extend this when you add new device types.

## Base pattern

| Purpose | Topic | Publisher | Subscriber |
|--------|--------|-----------|------------|
| Device state | `devices/{deviceId}/state` | Device (or simulator) | Backend |
| Device command | `devices/{deviceId}/command` | Backend | Device (or simulator) |

- **deviceId**: lowercase, hyphenated, no spaces (e.g. `living-room-light`, `thermostat-1`).
- **Payload**: JSON, UTF-8.

---

## Device types

### Light

| Topic | Direction | Payload |
|-------|-----------|--------|
| `devices/living-room-light/state` | Device → Backend | `{ "on": true }` or `{ "on": false }` |
| `devices/living-room-light/command` | Backend → Device | `{ "on": true }` or `{ "on": false }` |

### Thermostat

| Topic | Direction | Payload |
|-------|-----------|--------|
| `devices/thermostat-1/state` | Device → Backend | `{ "temperature": 21.5, "setpoint": 22, "unit": "C" }` |
| `devices/thermostat-1/command` | Backend → Device | `{ "setpoint": 22 }` |

### Motion sensor (read-only)

| Topic | Direction | Payload |
|-------|-----------|--------|
| `devices/motion-sensor-1/state` | Device → Backend | `{ "motion": true, "timestamp": "2025-02-08T12:00:00.000Z" }` |

No command topic.

### Hot water

| Topic | Direction | Payload |
|-------|-----------|--------|
| `devices/hot-water-1/state` | Device → Backend | `{ "on": true }` or `{ "on": false }` |
| `devices/hot-water-1/command` | Backend → Device | `{ "on": true }` or `{ "on": false }` |

---

## Alerts (optional)

| Topic | Payload |
|-------|--------|
| `alerts/high` | `{ "deviceId": "motion-sensor-1", "type": "motion", "message": "Motion detected", "timestamp": "..." }` |

Backend subscribes and pushes to the dashboard (e.g. via WebSocket).

---

## Adding a new device type

1. Pick a **deviceId** and decide state + command (if writable).
2. Use **state** on `devices/{deviceId}/state` and **command** on `devices/{deviceId}/command`.
3. Document payloads here and in the simulator/backend code.
