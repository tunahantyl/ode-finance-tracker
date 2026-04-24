import * as service from './accounts.service.js';

export async function list(req, res) {
  res.json({ accounts: await service.list(req.user.id) });
}
export async function getById(req, res) {
  res.json({ account: await service.getById(req.user.id, req.params.id) });
}
export async function create(req, res) {
  res.status(201).json({ account: await service.create(req.user.id, req.body) });
}
export async function update(req, res) {
  res.json({ account: await service.update(req.user.id, req.params.id, req.body) });
}
export async function remove(req, res) {
  await service.remove(req.user.id, req.params.id);
  res.status(204).end();
}
export async function recalculate(req, res) {
  res.json({ account: await service.recalculate(req.user.id, req.params.id) });
}
