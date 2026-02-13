# MQTT Smart Home Dashboard – Project Proposal

## 1. Project layout (monorepo)

Single repo with clear separation of concerns:

```
mqtt-device-pilot/
├── README.md                 # Overview + quick start
├── PROPOSAL.md               # This document
├── .env.example              # Shared template (broker + optional API key)
│
├── frontend/                 # Angular app (standalone components)
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.config.ts
│   │   │   ├── app.component.ts
│   │   │   ├── core/         # services, guards, env
│   │   │   ├── features/
│   │   │   │   └── dashboard/
│   │   │   └── shared/       # pipes, directives, UI primitives
│   │   └── environments/     # environment.ts (API URL from env at build)
│   ├── angular.json
│   └── package.json
│
├── backend/                  # Node.js bridge (MQTT ↔ REST/WebSocket)
│   ├── src/
│   │   ├── index.ts          # Express + WebSocket server
│   │   ├── mqtt.ts           # MQTT client, subscribe/publish
│   │   ├── routes/           # REST endpoints (devices, health)
│   │   └── ws/               # WebSocket handler (push device updates)
│   ├── package.json
│   └── tsconfig.json
│
├── simulator/                # Simulated devices (Node script)
│   ├── index.js              # Connects to broker, runs 2–3 device sims
│   ├── devices/
│   │   ├── light.js
│   │   ├── thermostat.js
│   │   └── motion-sensor.js
│   └── package.json
│
└── docs/
    ├── MQTT_TOPICS.md        # Topic names + payload format
    └── SECURITY.md            # Production vs portfolio note
```

- **Frontend**: Angular only; uses env (e.g. `NG_APP_API_URL`) for API/base URL; no MQTT, no broker credentials.
- **Backend**: Single Node process: MQTT client + Express + WebSocket; reads broker and optional API key from `.env`.
- **Simulator**: Standalone Node script; same broker config via `.env`; can run in same repo root or from `simulator/` with env loaded from root.

---

## 2. MQTT topic convention

Broker-agnostic; works with local Mosquitto or any MQTT 3.1.1 broker.

### Base pattern

- **State (device → backend/simulator):** `devices/{deviceId}/state`
- **Command (backend/simulator → device):** `devices/{deviceId}/command`

`deviceId` is a short, stable id (e.g. `living-room-light`, `thermostat-1`, `motion-sensor-1`). No spaces; lowercase + hyphens.

### Payload format

- **JSON** for all payloads (easier to extend and parse).
- UTF-8; no binary.

### Per-device topics and payloads

| Device type     | deviceId example   | State topic                      | Command topic                       |
|-----------------|--------------------|----------------------------------|-------------------------------------|
| Light           | living-room-light  | `devices/living-room-light/state`  | `devices/living-room-light/command` |
| Thermostat      | thermostat-1       | `devices/thermostat-1/state`       | `devices/thermostat-1/command`      |
| Motion sensor   | motion-sensor-1    | `devices/motion-sensor-1/state`   | (none; sensor is read-only)         |

**Light**

- **State** (device publishes): `{ "on": true | false }`
- **Command** (backend publishes): `{ "on": true | false }`  
  Simulator subscribes to command, updates state, then publishes new state.

**Thermostat**

- **State** (device publishes): `{ "temperature": 21.5, "setpoint": 22, "unit": "C" }`  
  Device can publish state periodically and on setpoint change.
- **Command** (backend publishes): `{ "setpoint": 22 }`  
  Simulator subscribes, updates setpoint, then publishes state.

**Motion sensor**

- **State** (device publishes): `{ "motion": true, "timestamp": "2025-02-08T12:00:00.000Z" }`  
  Simulator publishes every N seconds (e.g. “motion” event). No command topic.

### Alerts (optional)

- **Topic:** `devices/alerts` or `alerts/high` (single topic for simplicity).
- **Payload:** `{ "deviceId": "motion-sensor-1", "type": "motion", "message": "Motion detected", "timestamp": "..." }`  
  Backend can subscribe and push to frontend via WebSocket for the “alerts” area.

A short **docs/MQTT_TOPICS.md** will reference this and add 1–2 examples so you can add more device types later.

---

## 3. Step-by-step setup

### Prerequisites

- Node.js (LTS, e.g. 20.x)
- Docker (for Mosquitto), or Mosquitto installed locally
- Git

### Step 1: Run Mosquitto (local broker)

**Option A – Docker (recommended)**

```bash
docker run -d --name mosquitto -p 1883:1883 -p 9001:9001 eclipse-mosquitto:2
```

- Port **1883**: MQTT
- Port **9001**: WebSockets (optional; we use TCP 1883 for backend/simulator only)

No auth by default. To use auth (username/password), create a config and run with a volume (we can add this in implementation).

**Option B – Local install**

- Windows: [Mosquitto Windows install](https://mosquitto.org/download/)
- Linux: `sudo apt install mosquitto mosquitto-clients` (or equivalent)
- Default: listen on `localhost:1883`

---

### Step 2: Clone / open repo and env

```bash
cd mqtt-device-pilot
```

Create `.env` in repo root (from `.env.example`):

```env
# MQTT broker (used by backend + simulator)
MQTT_BROKER_URL=localhost
MQTT_BROKER_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Backend REST/WebSocket (optional API key for REST)
API_KEY=

# Optional: for Angular build-time API URL
# NG_APP_API_URL=http://localhost:3000
```

Leave `MQTT_USERNAME`/`MQTT_PASSWORD` empty for local Mosquitto without auth. Backend and simulator read from this file (e.g. via `dotenv`).

---

### Step 3: Run the simulator

```bash
cd simulator
npm install
node index.js
```

Simulator connects to the broker and starts:

- One light (publish state, subscribe command)
- One thermostat (publish temperature + setpoint, subscribe setpoint commands)
- One motion sensor (publish motion events every N seconds)

Leave this terminal open. No need to run from repo root if we load `.env` from root (e.g. `dotenv` with `path: '../.env'`) or copy `.env` into `simulator/`.

---

### Step 4: Run the backend

New terminal:

```bash
cd backend
npm install
npm run build
npm start
```

Backend will:

- Connect to MQTT using `.env` (from repo root or `backend/.env`)
- Subscribe to `devices/+/state` and `devices/alerts` (or `alerts/high`)
- Expose REST (e.g. `GET /api/devices`, `POST /api/devices/:id/command`) and WebSocket (e.g. `ws://localhost:3000` or `/ws`) for live updates
- Translate toggles/commands into MQTT publishes on the correct `devices/{id}/command` topics

Default: listen on `http://localhost:3000` (configurable via `PORT` in `.env` if we add it).

---

### Step 5: Run the Angular app

New terminal:

```bash
cd frontend
npm install
npm start
```

Use env for API URL so it’s not hardcoded (e.g. Angular environment or `NG_APP_API_URL`). Open `http://localhost:4200`. The dashboard lists devices, toggles the light, shows thermostat temp/setpoint and motion events, and optional alerts.

---

### Order of operations (summary)

1. Start **Mosquitto** (Docker or local).
2. Create **`.env`** from `.env.example`.
3. Start **simulator** (so devices are publishing).
4. Start **backend** (so MQTT is bridged to REST/WS).
5. Start **Angular** (so UI talks to backend only).

---

## 4. Environment variables and .env.example

**Repo root `.env.example`:**

```env
# ============== MQTT broker (backend + simulator) ==============
MQTT_BROKER_URL=localhost
MQTT_BROKER_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=

# ============== Backend ==============
PORT=3000
API_KEY=

# ============== Frontend (build-time; e.g. ng build) ==============
# NG_APP_API_URL=http://localhost:3000
```

- **Backend**: `PORT`, `MQTT_*`, `API_KEY` (optional; we can check `x-api-key` on REST in a later step).
- **Simulator**: `MQTT_*` only; load from root `.env` or a copy.
- **Frontend**: No broker or API key in code; only API base URL via build-time env (e.g. `NG_APP_API_URL` or Angular `environment.ts` from env).

---

## 5. Security note (for docs/SECURITY.md)

- **Portfolio / local use:**  
  Env vars for broker and optional API key; no secrets in frontend; backend bridges MQTT and REST/WebSocket. HTTP and `ws://` are acceptable for local/demo.

- **Production:**  
  Use HTTPS and WSS; proper auth (e.g. JWT or API keys with rate limiting); broker with TLS and auth; lock down CORS and validate all inputs. This project does not implement those; the note is for your CV and future hardening.

---

## 6. What we implement next (order)

1. **Repo scaffold**: folders, `.env.example`, `docs/MQTT_TOPICS.md`, `docs/SECURITY.md`, root `README.md` with the steps above.
2. **Backend**: MQTT client (subscribe/publish), Express REST, WebSocket push, in-memory device state.
3. **Simulator**: Three devices (light, thermostat, motion) following the topic scheme.
4. **Frontend**: Angular app, env-based API URL, dashboard with device list, toggles, sensor readouts, optional alerts.
5. **Polish**: README commands, optional Docker Compose for broker + backend + simulator if you want one-command run.

If this layout and topic scheme work for you, we can start with the repo scaffold and then implement backend → simulator → frontend in that order.
