// src/utils/otpCache.js
// Lưu OTP tạm thời trên RAM (cache process), tự động hết hạn

const otpMap = new Map();

export function setOtp(email, otp, ttlSeconds = 300) {
  clearOtp(email); // clear cũ nếu có
  const timeout = setTimeout(() => otpMap.delete(email), ttlSeconds * 1000);
  otpMap.set(email, { otp, expires: Date.now() + ttlSeconds * 1000, timeout });
}

export function getOtp(email) {
  const entry = otpMap.get(email);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    clearOtp(email);
    return null;
  }
  return entry.otp;
}

export function clearOtp(email) {
  const entry = otpMap.get(email);
  if (entry && entry.timeout) clearTimeout(entry.timeout);
  otpMap.delete(email);
}
