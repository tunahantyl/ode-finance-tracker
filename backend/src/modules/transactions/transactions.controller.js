import * as service from './transactions.service.js';

export async function list(req, res) {
  res.json(await service.list(req.user.id, req.query));
}
export async function getById(req, res) {
  res.json({ transaction: await service.getById(req.user.id, req.params.id) });
}
export async function create(req, res) {
  res.status(201).json({ transaction: await service.create(req.user.id, req.body) });
}
export async function update(req, res) {
  res.json({ transaction: await service.update(req.user.id, req.params.id, req.body) });
}
export async function remove(req, res) {
  await service.remove(req.user.id, req.params.id);
  res.status(204).end();
}
