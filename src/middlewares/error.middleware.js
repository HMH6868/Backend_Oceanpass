// src/middlewares/error.middleware.js
// Middleware xử lý Exception tập trung cho toàn bộ API

export function errorHandler(err, req, res, next) {
  // Nếu lỗi có status thì dùng, không thì mặc định 500
  const status = err.status || 500;
  // Nếu lỗi có message thì trả về, không thì trả generic
  const message = err.message || 'Internal Server Error';
  // Có thể log lỗi chi tiết ở đây nếu cần
  // console.error(err);
  res.status(status).json({
    success: false,
    error: message,
    code: status,
    // Có thể trả thêm thông tin debug ở môi trường dev
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
