const blocklist = new Set();

/**
 * Thêm một token vào danh sách bị chặn.
 * @param {string} token - JWT token cần chặn.
 * @param {number} exp - Thời điểm hết hạn của token (timestamp tính bằng giây).
 */
export function addTokenToBlocklist(token, exp) {
  if (!token || !exp) return;

  const nowInSeconds = Date.now() / 1000;
  const expiresIn = exp - nowInSeconds;

  // Nếu token đã hết hạn thì không cần thêm vào danh sách
  if (expiresIn <= 0) return;

  blocklist.add(token);

  // Tự động xóa token khỏi danh sách khi nó hết hạn
  setTimeout(() => {
    blocklist.delete(token);
  }, expiresIn * 1000);
}

/**
 * Kiểm tra xem một token có nằm trong danh sách bị chặn không.
 * @param {string} token - JWT token cần kiểm tra.
 * @returns {boolean}
 */
export function isTokenBlocklisted(token) {
  return blocklist.has(token);
}