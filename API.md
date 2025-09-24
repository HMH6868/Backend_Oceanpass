## 🔑 Xác thực (Authentication)

Tất cả các API quản trị (được đánh dấu 🔐) đều yêu cầu `Bearer Token` trong header `Authorization`.

## 🌍 API Công Khai (Public Access)

Các API này có thể được truy cập bởi bất kỳ ai mà không cần xác thực.

| Phương thức | Endpoint | Chức năng | Payload Mẫu (Query Params) |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/schedules/search` | 🔍 **Tìm kiếm chuyến đi.** | `?from_port_id=PRT_HCM&to_port_id=PRT_VT&departure_date=2025-09-25` |
| `GET` | `/api/vessels` | 📄 Lấy danh sách **tất cả tàu** (thông tin cơ bản). | (Không cần) |
| `GET` | `/api/vessels/:id` | 🚢 Lấy thông tin **chi tiết của một tàu** và toàn bộ sơ đồ ghế. | (Không cần) |
| `GET` | `/api/ports` | 🏛️ Lấy danh sách **tất cả cảng**. | (Không cần) |
| `GET` | `/api/routes` | ↔️ Lấy danh sách **tất cả tuyến đường**. | (Không cần) |
| `GET` | `/api/promotions` | 🎟️ Lấy danh sách **tất cả khuyến mãi**. | (Không cần) |

---

## 🔐 API Quản Trị (Admin Access)

Các API này yêu cầu quyền admin (`role_id` là 1 hoặc 2).

### 🗓️ Quản lý Lịch trình (Schedules)

| Phương thức | Endpoint | Chức năng | Payload Mẫu (JSON) |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/schedules` | 📊 Lấy danh sách **toàn bộ lịch trình**. | (Không cần) |
| `POST` | `/api/schedules` | ✨ **Tạo lịch trình mới.** | `{"route_id": "uuid", "vessel_id": "uuid", "departure_time": "2025-10-10T08:00:00Z", "arrival_time": "2025-10-10T10:00:00Z", "status": "active", "base_adult_price": 350000, "base_child_price": 250000}` |
| `PATCH`| `/api/schedules/:id`| ✏️ **Cập nhật** lịch trình. | `{"status": "cancelled", "departure_time": "2025-10-10T09:00:00Z"}` |
| `DELETE`| `/api/schedules/:id`| 🗑️ **Xóa** lịch trình. | (Không cần) |

### Quản lý Tàu (Vessel) & Sơ đồ ghế

| Phương thức | Endpoint | Chức năng | Payload Mẫu (JSON) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/vessels` | ✨ **Tạo tàu mới.** | `{"name": "SuperFerry 01", "code": "SF01", "capacity": 300, "amenities": ["AC", "TV"]}` |
| `PATCH`| `/api/vessels/:id` | ✏️ **Cập nhật** thông tin tàu. | `{"name": "SuperFerry 01 Updated"}` |
| `DELETE`| `/api/vessels/:id` | 🗑️ **Xóa** tàu. | (Không cần) |
| `POST` | `/api/vessels/decks` | ✨ **Thêm Tầng** vào tàu. | `{"vessel_id": "uuid-cua-tau", "name": "Upper Deck", "level": 2}` |
| `PATCH`| `/api/vessels/decks/:id` | ✏️ **Cập nhật** Tầng. | `{"name": "Tầng 2 VIP"}` |
| `DELETE`| `/api/vessels/decks/:id` | 🗑️ **Xóa** Tầng. | (Không cần) |
| `POST` | `/api/vessels/sections`| ✨ **Thêm Khoang** vào tầng. | `{"deck_id": "uuid-cua-tang", "name": "VIP Section", "type": "vip"}` |
| `PATCH`| `/api/vessels/sections/:id`| ✏️ **Cập nhật** Khoang. | `{"name": "VIP A"}` |
| `PATCH`| `/api/vessels/sections/:id/update-price` | 💰 **Cập nhật giá** cho toàn bộ ghế trong khoang. | `{"adult_price": 550000, "child_price": 450000}` |
| `DELETE`| `/api/vessels/sections/:id`| 🗑️ **Xóa** Khoang. | (Không cần) |
| `POST` | `/api/vessels/rows` | ✨ **Thêm Hàng** vào khoang. | `{"section_id": "uuid-cua-khoang", "row_number": "15"}` |
| `PATCH`| `/api/vessels/rows/:id` | ✏️ **Cập nhật** Hàng. | `{"row_number": "16"}` |
| `DELETE`| `/api/vessels/rows/:id` | 🗑️ **Xóa** Hàng. | (Không cần) |
| `POST` | `/api/vessels/seats` | ✨ **Thêm Ghế** vào hàng. | `{"row_id": "uuid-cua-hang", "seat_number": "15A", "adult_price": 500000, "child_price": 400000}` |
| `PATCH`| `/api/vessels/seats/:id` | ✏️ **Cập nhật** Ghế. | `{"adult_price": 520000}` |
| `DELETE`| `/api/vessels/seats/:id` | 🗑️ **Xóa** Ghế. | (Không cần) |

### 🏛️ Quản lý Cảng (Ports)

| Phương thức | Endpoint | Chức năng | Payload Mẫu (JSON) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ports` | ✨ **Tạo cảng mới.** | `{"name": "Cảng Vũng Tàu", "code": "PRT_VT", "city": "Vũng Tàu", "address": "123 Hạ Long", "latitude": 10.34, "longitude": 107.08}` |
| `PATCH`| `/api/ports/:id` | ✏️ **Cập nhật** cảng. | `{"name": "Cảng Tàu Khách Vũng Tàu"}` |
| `DELETE`| `/api/ports/:id` | 🗑️ **Xóa** cảng. | (Không cần) |

### ↔️ Quản lý Tuyến (Routes)

| Phương thức | Endpoint | Chức năng | Payload Mẫu (JSON) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/routes` | ✨ **Tạo tuyến mới.** | `{"from_port_id": "uuid", "to_port_id": "uuid", "distance_km": 96, "estimated_duration_minutes": 120}` |
| `PATCH`| `/api/routes/:id` | ✏️ **Cập nhật** tuyến. | `{"distance_km": 100}` |
| `DELETE`| `/api/routes/:id` | 🗑️ **Xóa** tuyến. | (Không cần) |

### 🎟️ Quản lý Khuyến mãi (Promotions)

| Phương thức | Endpoint | Chức năng | Payload Mẫu (JSON) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/promotions` | ✨ **Tạo khuyến mãi mới.** | `{"name": "Chào Thu", "code": "HELLOFALL", "type": "percentage", "value": 15, "min_amount": 500000, "max_discount": 100000, "valid_from": "2025-09-01T00:00:00Z", "valid_to": "2025-09-30T23:59:59Z", "is_active": true}` |
| `PATCH`| `/api/promotions/:id`| ✏️ **Cập nhật** khuyến mãi. | `{"description": "Giảm 15% cho mọi chuyến đi", "is_active": false}` |
| `DELETE`| `/api/promotions/:id`| 🗑️ **Xóa** khuyến mãi. | (Không cần) |