import { listRoutes, getRoute, createRoute, updateRoute, deleteRoute } from '../services/routes.service.js';
import { assertCreateRoute, assertUpdateRoute } from '../utils/validator.js';

export async function handleListRoutes(req, res, next) {
  try {
    const { page, pageSize, q } = req.query;
    const data = await listRoutes({ page, pageSize, q });
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function handleGetRoute(req, res, next) {
  try {
    const data = await getRoute(req.params.id);
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function handleCreateRoute(req, res, next) {
  try {
    const roleId = req.user?.role_id;
    if (roleId !== 1 && roleId !== 2) { const err = new Error('bạn không có quyền thay đổi tuyến'); err.status = 403; throw err; }
    assertCreateRoute(req.body);
    const created = await createRoute(req.body);
    res.status(201).json({ ok: true, data: created });
  } catch (e) { next(e); }
}

export async function handleUpdateRoute(req, res, next) {
  try {
    const roleId = req.user?.role_id;
    if (roleId !== 1 && roleId !== 2) { const err = new Error('bạn không có quyền thay đổi tuyến'); err.status = 403; throw err; }
    assertUpdateRoute(req.body);
    const updated = await updateRoute(req.params.id, req.body);
    res.json({ ok: true, data: updated });
  } catch (e) { next(e); }
}

export async function handleDeleteRoute(req, res, next) {
  try {
    const roleId = req.user?.role_id;
    if (roleId !== 1 && roleId !== 2) { const err = new Error('bạn không có quyền thay đổi tuyến'); err.status = 403; throw err; }
    const deleted = await deleteRoute(req.params.id);
    res.json({ ok: true, data: deleted });
  } catch (e) { next(e); }
}
