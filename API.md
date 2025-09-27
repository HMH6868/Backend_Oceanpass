## 🔑 Xác thực (Authentication)

Tất cả các API quản trị (được đánh dấu 🔐) và các API cần xác định người dùng đều yêu cầu `Bearer Token` trong header `Authorization`.

---

## 🌍 API Công Khai (Public Access)

Các API này có thể được truy cập bởi bất kỳ ai mà không cần xác thực.

| Phương thức | Endpoint                    | Chức năng                                                                                          | Payload Mẫu (Body/Query)                                                                                               |
| :---------- | :-------------------------- | :------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| `GET`       | `/health`                   | ✅ **Health Check.**                                                                               | (Không cần)                                                                                                            |
| `POST`      | `/api/auth/register`        | 📝 **Đăng ký (Bước 1/2).** Chỉ kiểm tra thông tin, chưa tạo user. Sẽ gửi OTP nếu thông tin hợp lệ. | `{"name": "Nguyen Van A", "email": "a@example.com", "phone": "0987654321", "password": "matkhau123"}`                  |
| `POST`      | `/api/auth/login`           | 🚪 **Đăng nhập.**                                                                                  | `{"email": "a@example.com", "password": "matkhau123"}`                                                                 |
| `POST`      | `/api/otp/send-otp`         | 📨 **Gửi mã OTP** đến email để xác thực.                                                           | `{"email": "a@example.com", "name": "Nguyen Van A"}`                                                                   |
| `POST`      | `/api/otp/verify-otp`       | ✅ **Xác thực OTP (Bước 2/2).** Nếu OTP đúng, sẽ tạo tài khoản người dùng.                         | `{"email": "a@example.com", "otp": "123456", "name": "Nguyen Van A", "phone": "0987654321", "password": "matkhau123"}` |
| `POST`      | `/api/auth/forgot-password` | 🔑 **Yêu cầu OTP** để đặt lại mật khẩu.                                                            | `{"email": "a@example.com"}`                                                                                           |
| `POST`      | `/api/auth/reset-password`  | 🔄 **Đặt lại mật khẩu** bằng OTP và mật khẩu mới.                                                  | `{"email": "a@example.com", "otp": "123456", "newPassword": "matkhaumoi456"}`                                          |
| `GET`       | `/api/schedules/search`     | 🔍 **Tìm kiếm chuyến đi.**                                                                         | `?from=PRT_HCM&to=PRT_VT&departure=2025-09-25&type=one-way`                                                            |
| `GET`       | `/api/vessels`              | 📄 Lấy danh sách **tất cả tàu** (thông tin cơ bản).                                                | (Không cần)                                                                                                            |
| `GET`       | `/api/vessels/:id`          | 🚢 Lấy thông tin **chi tiết của một tàu** và toàn bộ sơ đồ ghế.                                    | (Không cần)                                                                                                            |
| `GET`       | `/api/ports`                | 🏛️ Lấy danh sách **tất cả cảng**.                                                                  | (Không cần)                                                                                                            |
| `GET`       | `/api/routes`               | ↔️ Lấy danh sách **tất cả tuyến đường**.                                                           | (Không cần)                                                                                                            |
| `GET`       | `/api/promotions`           | 🎟️ Lấy danh sách **tất cả khuyến mãi**.                                                            | (Không cần)                                                                                                            |
| `POST`      | `/api/promotions/check`     | ✅ **Kiểm tra mã khuyến mãi** với tổng giá trị đơn hàng.                                           | `{"code": "NEW10", "total_amount": 500000}`                                                                            |

---

## 👤 API Người Dùng (User Access)

Yêu cầu xác thực (`Bearer Token`).

| Phương thức | Endpoint                       | Chức năng                                                   | Payload Mẫu (JSON)                                                                     |
| :---------- | :----------------------------- | :---------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| `GET`       | `/api/auth/me`                 | 👤 Lấy thông tin **người dùng hiện tại.**                   | (Không cần)                                                                            |
| `POST`      | `/api/auth/logout`             | 🚪 **Đăng xuất.** Vô hiệu hóa token hiện tại ở phía server. | (Không cần)                                                                            |
| `PATCH`     | `/api/users/me`                | ✏️ **Cập nhật thông tin cá nhân** (chỉ `name`, `phone`).    | `{"name": "Nguyen Van B", "phone": "0912345678"}`                                      |
| `PATCH`     | `/api/users/me/avatar`         | 🖼️ **Cập nhật ảnh đại diện** của người dùng.                | `{"avatar": "https://i.imgur.com/new_avatar.png"}`                                     |
| `PATCH`     | `/api/users/me/password`       | 🔑 **Thay đổi mật khẩu** của người dùng.                    | `{"currentPassword": "mat_khau_cu", "newPassword": "mat_khau_moi"}`                    |
| `POST`      | `/api/bookings`                | 🛒 **Tạo đơn đặt vé mới** (trạng thái `pending`).           | `{"scheduleId": "uuid-chuyen-di", "seats": [{"seatId": "uuid-ghe", "type": "adult"}]}` |
| `GET`       | `/api/bookings/my-bookings`    | 📄 Lấy **lịch sử đặt vé** của người dùng.                   | (Không cần)                                                                            |
| `GET`       | `/api/bookings/:id`            | ℹ️ Lấy **thông tin chi tiết** một đơn đặt vé.               | (Không cần)                                                                            |
| `PATCH`     | `/api/bookings/:id/promotion`  | ✅ Áp dụng **mã khuyến mãi** vào đơn vé.                    | `{"promotionCode": "NEW10"}`                                                           |
| `POST`      | `/api/bookings/:id/passengers` | 👨‍👩‍👧‍👦 Thêm **thông tin hành khách** vào đơn vé.                | `{"passengers": [{"name": "Nguyen Van A", "dateOfBirth": "1990-01-01"}]}`              |

---

## 🔐 API Quản Trị (Admin Access)

Các API này yêu cầu quyền admin (`role_id` là 1 hoặc 2).

### 🗓️ Quản lý Lịch trình (Schedules)

| Phương thức | Endpoint             | Chức năng                                | Payload Mẫu (JSON)                                                                              |
| :---------- | :------------------- | :--------------------------------------- | :---------------------------------------------------------------------------------------------- |
| `GET`       | `/api/schedules`     | 📊 Lấy danh sách **toàn bộ lịch trình**. | (Không cần)                                                                                     |
| `POST`      | `/api/schedules`     | ✨ **Tạo lịch trình mới.**               | `{"route_id": "R_HCM_VT", "vessel_id": "V_SL1", "departure_time": "2025-10-10T08:00:00Z", ...}` |
| `PATCH`     | `/api/schedules/:id` | ✏️ **Cập nhật** lịch trình.              | `{"status": "cancelled", "departure_time": "2025-10-10T09:00:00Z"}`                             |
| `DELETE`    | `/api/schedules/:id` | 🗑️ **Xóa** lịch trình.                   | (Không cần)                                                                                     |

### 🚢 Quản lý Tàu (Vessel) & Sơ đồ ghế

| Phương thức | Endpoint                                 | Chức năng                                         | Payload Mẫu (JSON)                                                   |
| :---------- | :--------------------------------------- | :------------------------------------------------ | :------------------------------------------------------------------- |
| `POST`      | `/api/vessels`                           | ✨ **Tạo tàu mới.**                               | `{"name": "SuperFerry 01", "code": "SF01", "capacity": 300, ...}`    |
| `PATCH`     | `/api/vessels/:id`                       | ✏️ **Cập nhật** thông tin tàu.                    | `{"name": "SuperFerry 01 Updated", "status": "maintenance"}`         |
| `DELETE`    | `/api/vessels/:id`                       | 🗑️ **Xóa** tàu.                                   | (Không cần)                                                          |
| `POST`      | `/api/vessels/decks`                     | ✨ **Thêm Tầng** vào tàu.                         | `{"vessel_id": "uuid-cua-tau", "name": "Upper Deck", "level": 2}`    |
| `PATCH`     | `/api/vessels/decks/:id`                 | ✏️ **Cập nhật** Tầng.                             | `{"name": "Tầng 2 VIP"}`                                             |
| `DELETE`    | `/api/vessels/decks/:id`                 | 🗑️ **Xóa** Tầng.                                  | (Không cần)                                                          |
| `POST`      | `/api/vessels/sections`                  | ✨ **Thêm Khoang** vào tầng.                      | `{"deck_id": "uuid-cua-tang", "name": "VIP Section", "type": "vip"}` |
| `PATCH`     | `/api/vessels/sections/:id`              | ✏️ **Cập nhật** Khoang.                           | `{"name": "VIP A"}`                                                  |
| `PATCH`     | `/api/vessels/sections/:id/update-price` | 💰 **Cập nhật giá** cho toàn bộ ghế trong khoang. | `{"adult_price": 550000, "child_price": 450000}`                     |
| `DELETE`    | `/api/vessels/sections/:id`              | 🗑️ **Xóa** Khoang.                                | (Không cần)                                                          |
| ...         | ...                                      | ...                                               | ...                                                                  |

### 🏛️ Quản lý Cảng (Ports)

| Phương thức | Endpoint         | Chức năng             | Payload Mẫu (JSON)                                                  |
| :---------- | :--------------- | :-------------------- | :------------------------------------------------------------------ |
| `POST`      | `/api/ports`     | ✨ **Tạo cảng mới.**  | `{"name": "Cảng Vũng Tàu", "code": "VTP", "city": "Vũng Tàu", ...}` |
| `PATCH`     | `/api/ports/:id` | ✏️ **Cập nhật** cảng. | `{"name": "Cảng Tàu Khách Vũng Tàu"}`                               |
| `DELETE`    | `/api/ports/:id` | 🗑️ **Xóa** cảng.      | (Không cần)                                                         |

### ↔️ Quản lý Tuyến (Routes)

| Phương thức | Endpoint          | Chức năng              | Payload Mẫu (JSON)                                         |
| :---------- | :---------------- | :--------------------- | :--------------------------------------------------------- |
| `POST`      | `/api/routes`     | ✨ **Tạo tuyến mới.**  | `{"from_port_id": "PRT_HCM", "to_port_id": "PRT_VT", ...}` |
| `PATCH`     | `/api/routes/:id` | ✏️ **Cập nhật** tuyến. | `{"distance_km": 100}`                                     |
| `DELETE`    | `/api/routes/:id` | 🗑️ **Xóa** tuyến.      | (Không cần)                                                |

### 🎟️ Quản lý Khuyến mãi (Promotions)

| Phương thức | Endpoint              | Chức năng                   | Payload Mẫu (JSON)                                                     |
| :---------- | :-------------------- | :-------------------------- | :--------------------------------------------------------------------- |
| `POST`      | `/api/promotions`     | ✨ **Tạo khuyến mãi mới.**  | `{"name": "Chào Thu", "code": "HELLOFALL", "type": "percentage", ...}` |
| `PATCH`     | `/api/promotions/:id` | ✏️ **Cập nhật** khuyến mãi. | `{"description": "Giảm 15% cho mọi chuyến đi", "is_active": false}`    |
| `DELETE`    | `/api/promotions/:id` | 🗑️ **Xóa** khuyến mãi.      | (Không cần)                                                            |
