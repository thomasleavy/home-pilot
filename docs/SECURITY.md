# Security note

## This portfolio project

- **Broker and API**: Configuration via environment variables (`.env`). No broker URL, credentials, or API keys in the frontend.
- **Frontend**: Talks only to the backend (REST + WebSocket). No direct MQTT connection.
- **Local/demo**: HTTP and `ws://` are acceptable. No TLS or authentication is required for running locally or showing in a portfolio.

## Production considerations

For a real deployment you would typically:

- Use **HTTPS** and **WSS** (secure WebSockets).
- Add **authentication** for the REST/WebSocket API (e.g. JWT, API keys, or session-based auth) and **authorization** so users only see their own devices.
- Connect to the MQTT broker over **TLS** and use **broker authentication** (username/password or certificates).
- Harden the backend: **CORS**, **rate limiting**, **input validation**, and avoid exposing internal errors to clients.
- Keep secrets in a **secret manager** or **CI/CD env**, not in the repo.

This project does not implement the above; it is kept minimal for demo and CV purposes.
