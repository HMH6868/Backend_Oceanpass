import { changeUserPassword, updateMe, updateUserAvatar } from '../services/user.service.js';

export async function handleUpdateMe(req, res, next) {
  try {
    // Lấy name, phone, và avatar
    const { name, phone, avatar } = req.body || {};
    const updated = await updateMe(req.user.id, { name, phone, avatar });
    res.json({ ok: true, data: updated });
  } catch (e) {
    next(e);
  }
}

/**
 * Xử lý yêu cầu cập nhật avatar của người dùng.
 */
export async function handleUpdateAvatar(req, res, next) {
  try {
    const { avatar } = req.body;

    if (!avatar || typeof avatar !== 'string') {
      const err = new Error('Vui lòng cung cấp URL avatar hợp lệ.');
      err.status = 400;
      throw err;
    }

    const updatedUser = await updateUserAvatar(req.user.id, avatar);
    res.json({ ok: true, data: updatedUser });
  } catch (e) {
    next(e);
  }
}

/**
 * Xử lý yêu cầu đổi mật khẩu của người dùng.
 */
export async function handleChangePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation cơ bản
    if (!currentPassword || !newPassword) {
      const err = new Error('Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.');
      err.status = 400;
      throw err;
    }

    if (newPassword.length < 6) {
      const err = new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
      err.status = 400;
      throw err;
    }

    await changeUserPassword(userId, currentPassword, newPassword);

    res.json({ ok: true, message: 'Đổi mật khẩu thành công.' });
  } catch (e) {
    next(e);
  }
}
