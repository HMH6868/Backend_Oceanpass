# Sử dụng một image Node.js gọn nhẹ
FROM node:18-alpine AS base

# Thiết lập môi trường
ENV NODE_ENV=production

# Tạo thư mục làm việc
WORKDIR /usr/src/app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies cho production
RUN npm ci --only=production

# Sao chép mã nguồn của ứng dụng
COPY . .

# Expose port mà ứng dụng sẽ chạy trên đó
# Fly.io sẽ tự động cung cấp biến môi trường PORT (thường là 8080)
EXPOSE 8080

# Lệnh để khởi chạy ứng dụng
CMD [ "npm", "start" ]