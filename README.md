# Home Pilot

A smart-home control app. Control heating, hot water, lights and view usage insights from one place. The frontend talks to a Node.js backend, which bridges your devices (via MQTT) and the web.

**Why it’s useful:** One dashboard for thermostat, hot water, lights and sensors; per-account settings and insights; works with a local MQTT broker and optional simulated devices.

**Tech stack:** Angular (frontend), Node.js + Express + MQTT + WebSocket (backend), Eclipse Mosquitto (broker), optional Node.js simulator for devices.

---

## How to run

1. **Start the MQTT broker** (e.g. Mosquitto on port 1883). With Docker:  
   `docker run -d --name mosquitto -p 1883:1883 -p 9001:9001 eclipse-mosquitto:2`

2. **Copy env:** `copy .env.example .env` (edit if needed).

3. **Simulator** (optional; terminal 1):  
   `cd simulator && npm install && node index.js`

4. **Backend** (terminal 2):  
   `cd backend && npm install && npm run build && npm start`

5. **Frontend** (terminal 3):  
   `cd frontend && npm install && npm start`  
   Then open http://localhost:4200
