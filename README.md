# Backend Oceanpass

Đây là backend cho dự án Oceanpass, được xây dựng bằng Node.js và Express.js. Dự án cung cấp các API cho authentication và quản lý người dùng.

## Cài đặt

1. Clone repository:

   ```bash
   git clone https://github.com/HMH6868/Backend_Oceanpass.git
   cd Backend_Oceanpass
   ```

2. Cài đặt dependencies:

   ```bash
   npm install
   ```

3. Thiết lập biến môi trường: Tạo file `.env` với các biến cần thiết (ví dụ: DATABASE_URL, JWT_SECRET, PORT).

4. Chạy database: Đảm bảo PostgreSQL đang chạy và import schema từ `oceanpass.sql` hoặc `SQL_GEMINI.sql`.

## Chạy dự án

- Chạy ở chế độ development:

  ```bash
  npm run dev
  ```

- Chạy production:

  ```bash
  npm start
  ```

Server sẽ chạy trên `http://localhost:4000` (hoặc PORT trong .env).

## API Endpoints

### Health Check

- **GET** `/health` - Kiểm tra trạng thái server

### Authentication

- **POST** `/api/auth/register` - Đăng ký tài khoản mới
  - Body: `{ name, email, phone, password, role }`
- **POST** `/api/auth/login` - Đăng nhập
  - Body: `{ email, password }`
- **GET** `/api/auth/me` - Lấy thông tin người dùng hiện tại (cần JWT token)

### User Management

- **PATCH** `/api/users/me` - Cập nhật thông tin cá nhân (chỉ name và phone)
  - Body: `{ name, phone }`
  - Cần JWT token

### Promotions

- **GET** `/api/promotions` - Lấy danh sách khuyến mãi

## Công nghệ sử dụng

- Node.js
- Express.js
- PostgreSQL
- JWT cho authentication
- bcrypt cho hash password

## Cấu trúc thư mục

```text
src/
  controllers/     # Xử lý logic API
  middlewares/     # Middleware (auth, etc.)
  routes/          # Định nghĩa routes
  services/        # Business logic
  utils/           # Utilities (validation, etc.)
  db.js            # Kết nối database
  server.js        # Entry point
```
