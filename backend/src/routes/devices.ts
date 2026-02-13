import { Router, Request, Response } from 'express';
import {
  getDevices as getBaseDevices,
  publishCommand,
  getAlerts,
} from '../mqtt';
import { requireAuth } from '../middleware/auth';
import {
  getUserDeviceState,
  setUserDeviceState,
  getUserHeatingHistory,
  getUserHotWaterHistory,
  getHotWaterTodayExtraSeconds,
  getHeatingTodayExtraSeconds,
  recordUserHeatingCommand,
  recordUserHotWaterCommand,
} from '../db';
import type { DeviceState } from '../mqtt';

const router = Router();

const INSIGHTS_DEBUG = process.env.INSIGHTS_DEBUG === '1' || process.env.INSIGHTS_DEBUG === 'true';
const DEBUG_THROTTLE_MS = 60_000; // log each endpoint at most once per minute to avoid console spam
const lastLog: Record<string, number> = {};
function debugLog(msg: string, data?: object): void {
  if (!INSIGHTS_DEBUG) return;
  const now = Date.now();
  if (now - (lastLog[msg] ?? 0) < DEBUG_THROTTLE_MS) return;
  lastLog[msg] = now;
  console.log(`[insights] ${msg}`, data ?? '');
}

function mergeUserState(baseDevices: DeviceState[], userState: Record<string, string>): DeviceState[] {
  return baseDevices.map((d) => {
    const saved = userState[d.deviceId];
    if (!saved) return d;
    try {
      const state = JSON.parse(saved) as Record<string, unknown>;
      return { ...d, state, lastUpdated: new Date().toISOString() };
    } catch {
      return d;
    }
  });
}

/** Same pattern as hot-water-history: in-memory today-extra only, no bootstrap/MQTT. */
router.get('/insights/heating-history', requireAuth, (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  const userId = req.user!.userId;
  const extra = getHeatingTodayExtraSeconds(userId);
  const history = getUserHeatingHistory(userId, extra);
  const todayEntry = history[history.length - 1];
  debugLog('heating-history', { userId, extraSec: extra, todayMinutes: todayEntry?.minutesOn, hint: extra <= 0 ? 'Extra 0: toggle heating On on Home first; or backend restarted (in-memory lost).' : undefined });
  res.json(history);
});

router.get('/insights/hot-water-history', requireAuth, (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  const userId = req.user!.userId;
  const extra = getHotWaterTodayExtraSeconds(userId);
  const history = getUserHotWaterHistory(userId, extra);
  const todayEntry = history[history.length - 1];
  debugLog('hot-water-history', { userId, extraSec: extra, todayMinutes: todayEntry?.minutesOn, hint: extra <= 0 ? 'Extra 0: toggle hot water On on Home first; or backend restarted (in-memory lost).' : undefined });
  res.json(history);
});

router.get('/devices', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const base = getBaseDevices();
  const userState = getUserDeviceState(userId);
  const devices = mergeUserState(base, userState);
  res.json(devices);
});

router.get('/alerts', requireAuth, (_req: Request, res: Response) => {
  res.json(getAlerts());
});

router.post('/devices/:id/command', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;
  if (!id || !body || typeof body !== 'object') {
    res.status(400).json({ error: 'Bad request' });
    return;
  }
  const userId = req.user!.userId;
  const existing = getUserDeviceState(userId)[id];
  const currentState = existing ? (JSON.parse(existing) as Record<string, unknown>) : {};
  const newState = { ...currentState, ...body };
  setUserDeviceState(userId, id, newState);
  const didHeating = id === 'thermostat-1' && 'heatingOn' in body;
  const didHotWater = id === 'hot-water-1';
  if (didHotWater) recordUserHotWaterCommand(userId, body);
  if (didHeating) recordUserHeatingCommand(userId, body);
  debugLog('command', { id, userId, body, recordedHeating: didHeating, recordedHotWater: didHotWater });
  publishCommand(id, body);
  res.json({ ok: true });
});

export default router;
