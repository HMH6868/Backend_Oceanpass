import { listPorts, getPort, createPort, updatePort, deletePort } from '../services/ports.service.js';
import { assertCreatePort, assertUpdatePort } from '../utils/validator.js';

export async function handleListPorts(req, res, next) {
  try {
    const { page, pageSize, q } = req.query;
    const data = await listPorts({ page, pageSize, q });
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function handleGetPort(req, res, next) {
  try {
    const data = await getPort(req.params.id);
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function handleCreatePort(req, res, next) {
  try {
    const roleId = req.user?.role_id;
    if (roleId !== 1 && roleId !== 2) {
      const err = new Error('bạn không có quyền thay đổi cảng'); // thông điệp bạn đang dùng
      err.status = 403; throw err;
    }
    assertCreatePort(req.body);
    const created = await createPort(req.body);
    res.status(201).json({ ok: true, data: created });
  } catch (e) {
    if (e?.code === '23505') { e.status = 409; e.message = 'Mã cảng (code) đã tồn tại'; }
    next(e);
  }
}

export async function handleUpdatePort(req, res, next) {
  try {
    const roleId = req.user?.role_id;
    if (roleId !== 1 && roleId !== 2) {
      const err = new Error('bạn không có quyền thay đổi cảng');
      err.status = 403; throw err;
    }
    assertUpdatePort(req.body);
    const updated = await updatePort(req.params.id, req.body);
    res.json({ ok: true, data: updated });
  } catch (e) {
    if (e?.code === '23505') { e.status = 409; e.message = 'Mã cảng (code) đã tồn tại'; }
    next(e);
  }
}

export async function handleDeletePort(req, res, next) {
  try {
    const roleId = req.user?.role_id;
    if (roleId !== 1 && roleId !== 2) {
      const err = new Error('bạn không có quyền thay đổi cảng');
      err.status = 403; throw err;
    }
    const deleted = await deletePort(req.params.id);
    res.json({ ok: true, data: deleted });
  } catch (e) {
    // FK từ routes (from_port_id / to_port_id) -> RESTRICT
    if (e?.code === '23503') { e.status = 409; e.message = 'Không thể xoá vì đang được sử dụng trong tuyến'; }
    next(e);
  }
}
