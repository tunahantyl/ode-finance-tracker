import * as service from './categories.service.js';

export async function list(req, res) {
  res.json({ categories: await service.list(req.user.id, req.query) });
}
export async function create(req, res) {
  res.status(201).json({ category: await service.create(req.user.id, req.body) });
}
export async function update(req, res) {
  res.json({ category: await service.update(req.user.id, req.params.id, req.body) });
}
export async function remove(req, res) {
  await service.remove(req.user.id, req.params.id);
  res.status(204).end();
}
