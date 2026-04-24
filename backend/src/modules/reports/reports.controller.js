import * as service from './reports.service.js';

export async function summary(req, res) {
  res.json(await service.summary(req.user.id, req.query));
}
export async function byCategory(req, res) {
  res.json(await service.byCategory(req.user.id, req.query));
}
export async function timeline(req, res) {
  res.json(await service.timeline(req.user.id, req.query));
}
export async function recent(req, res) {
  const limit = Math.min(Math.max(parseInt(req.query.limit ?? '10', 10), 1), 50);
  res.json({ items: await service.recent(req.user.id, limit) });
}
