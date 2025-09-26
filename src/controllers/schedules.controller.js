import * as schedulesService from '../services/schedules.service.js';

// === PUBLIC CONTROLLER (ĐÃ CẬP NHẬT) ===
export const searchSchedules = async (req, res, next) => {
  try {
    const { from, to, departure, type, return: return_date } = req.query; // 'return' là từ khóa, nên đổi tên thành return_date

    // Kiểm tra các tham số bắt buộc
    if (!from || !to || !departure || !type) {
      const err = new Error('Vui lòng cung cấp đủ thông tin: from, to, departure và type.');
      err.status = 400;
      throw err;
    }

    // Nếu là khứ hồi, kiểm tra ngày về
    if (type === 'round-trip' && !return_date) {
      const err = new Error('Vui lòng cung cấp ngày về (return) cho tìm kiếm khứ hồi.');
      err.status = 400;
      throw err;
    }

    const schedules = await schedulesService.searchSchedules(req.query);
    res.status(200).json({ ok: true, data: schedules });
  } catch (e) {
    next(e);
  }
};

// === ADMIN CONTROLLERS (Không thay đổi) ===

export const getSchedules = async (req, res, next) => {
  try {
    const schedules = await schedulesService.getAllSchedules();
    res.status(200).json({ ok: true, data: schedules });
  } catch (e) {
    next(e);
  }
};

export const createSchedule = async (req, res, next) => {
  try {
    const schedule = await schedulesService.createSchedule(req.body);
    res.status(201).json({ ok: true, data: schedule });
  } catch (e) {
    next(e);
  }
};

export const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await schedulesService.updateSchedule(id, req.body);
    res.status(200).json({ ok: true, data: schedule });
  } catch (e) {
    next(e);
  }
};

export const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    await schedulesService.deleteSchedule(id);
    res.status(200).json({ ok: true, data: { message: 'Schedule deleted successfully' } });
  } catch (e) {
    next(e);
  }
};

/**
 * Controller để lấy chi tiết lịch trình và sơ đồ ghế.
 */
export const handleGetScheduleWithSeatMap = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scheduleDetails = await schedulesService.getScheduleWithSeatMap(id);
    res.status(200).json({ ok: true, data: scheduleDetails });
  } catch (e) {
    next(e);
  }
};
