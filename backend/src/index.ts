import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../../.env') });
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { connectMqtt } from './mqtt';
import authRouter from './routes/auth';
import devicesRouter from './routes/devices';
import { handleWebSocket } from './ws/handler';
import { requireAuth } from './middleware/auth';
import { findUserById } from './db';

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || '';

const app = express();
app.use(cors());
app.use(express.json());

function apiKeyMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!API_KEY) {
    next();
    return;
  }
  const key = req.headers['x-api-key'] as string | undefined;
  if (key !== API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// Explicit GET /api/auth/me so it is always available (avoids 404 with some Express/router setups)
app.get('/api/auth/me', requireAuth, (req: express.Request, res: express.Response) => {
  const userId = (req as unknown as { user?: { userId: number } }).user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = findUserById(userId);
  if (!user) {
    res.status(401).json({ error: 'User not found or session invalid' });
    return;
  }
  res.json({ id: user.id, username: user.username, email: user.email });
});
app.use('/api/auth', authRouter);
app.use('/api', apiKeyMiddleware, devicesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const server = createServer(app);

const wss = new WebSocketServer({ server });
wss.on('connection', handleWebSocket);

const mqttClient = connectMqtt();
(global as unknown as { mqttClient: typeof mqttClient }).mqttClient = mqttClient;

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  if (process.env.INSIGHTS_DEBUG === '1' || process.env.INSIGHTS_DEBUG === 'true') {
    console.log('[insights] INSIGHTS_DEBUG=1: logging heating/hot-water commands and history. In-memory state is lost when this process restarts.');
  }
});
