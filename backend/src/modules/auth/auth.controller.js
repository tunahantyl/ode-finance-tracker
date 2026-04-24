import * as service from './auth.service.js';

export async function register(req, res) {
  const result = await service.register(req.body);
  res.status(201).json(result);
}

export async function login(req, res) {
  const result = await service.login(req.body);
  res.json(result);
}

export async function me(req, res) {
  const user = await service.me(req.user.id);
  res.json({ user });
}
