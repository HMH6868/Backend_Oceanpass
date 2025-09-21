-- =================================================================
--      SCHEMA cho HỆ THỐNG ĐẶT VÉ TÀU CAO TỐC (FERRY BOOKING SYSTEM) - V3 (Sửa lỗi Syntax CAST)
-- =================================================================
-- Tác giả: Gemini
-- Ngày tạo: 2025-09-21
-- Phiên bản PostgreSQL: 14+
-- =================================================================

-- Xóa các đối tượng cũ nếu tồn tại để tránh lỗi khi chạy lại script
DROP TABLE IF EXISTS "tickets" CASCADE;
DROP TABLE IF EXISTS "passengers" CASCADE;
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "schedules" CASCADE;
DROP TABLE IF EXISTS "seats" CASCADE;
DROP TABLE IF EXISTS "rows" CASCADE;
DROP TABLE IF EXISTS "sections" CASCADE;
DROP TABLE IF EXISTS "decks" CASCADE;
DROP TABLE IF EXISTS "seat_maps" CASCADE;
DROP TABLE IF EXISTS "vessels" CASCADE;
DROP TABLE IF EXISTS "routes" CASCADE;
DROP TABLE IF EXISTS "ports" CASCADE;
DROP TABLE IF EXISTS "promotions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "roles" CASCADE;

DROP TYPE IF EXISTS "role_type";
DROP TYPE IF EXISTS "trip_type";
DROP TYPE IF EXISTS "passenger_type";
DROP TYPE IF EXISTS "seat_status";
DROP TYPE IF EXISTS "booking_status";
DROP TYPE IF EXISTS "payment_method";
DROP TYPE IF EXISTS "schedule_status";
DROP TYPE IF EXISTS "promotion_type";
DROP TYPE IF EXISTS "seat_class_type";

-- =================================================================
-- 1. ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU ENUM
-- =================================================================
CREATE TYPE "role_type" AS ENUM ('admin', 'staff', 'customer');
CREATE TYPE "trip_type" AS ENUM ('one-way', 'round-trip');
CREATE TYPE "passenger_type" AS ENUM ('adult', 'child');
CREATE TYPE "seat_status" AS ENUM ('available', 'reserved', 'booked');
CREATE TYPE "booking_status" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE "payment_method" AS ENUM ('card', 'e-wallet', 'bank-transfer');
CREATE TYPE "schedule_status" AS ENUM ('active', 'cancelled', 'full');
CREATE TYPE "promotion_type" AS ENUM ('percentage', 'fixed');
CREATE TYPE "seat_class_type" AS ENUM ('economy', 'business', 'vip', 'cabin');


-- =================================================================
-- 2. TẠO CÁC BẢNG
-- =================================================================

CREATE TABLE "roles" (
    "id" SERIAL PRIMARY KEY,
    "name" role_type NOT NULL UNIQUE
);

CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "phone" VARCHAR(20) UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "role_id" INT NOT NULL,
    "date_of_birth" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY ("role_id") REFERENCES "roles"("id")
);

CREATE TABLE "ports" (
    "id" VARCHAR(50) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(10) NOT NULL UNIQUE,
    "city" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "latitude" NUMERIC(10, 7) NOT NULL,
    "longitude" NUMERIC(10, 7) NOT NULL
);

CREATE TABLE "routes" (
    "id" VARCHAR(50) PRIMARY KEY,
    "from_port_id" VARCHAR(50) NOT NULL,
    "to_port_id" VARCHAR(50) NOT NULL,
    "distance_km" NUMERIC(10, 2),
    "estimated_duration_minutes" INT,
    
    FOREIGN KEY ("from_port_id") REFERENCES "ports"("id") ON DELETE RESTRICT,
    FOREIGN KEY ("to_port_id") REFERENCES "ports"("id") ON DELETE RESTRICT
);

CREATE TABLE "vessels" (
    "id" VARCHAR(50) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(20) NOT NULL UNIQUE,
    "capacity" INT NOT NULL,
    "amenities" TEXT[]
);

CREATE TABLE "seat_maps" (
    "id" VARCHAR(50) PRIMARY KEY,
    "vessel_id" VARCHAR(50) NOT NULL UNIQUE,
    "description" TEXT,
    
    FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE CASCADE
);

CREATE TABLE "decks" (
    "id" VARCHAR(50) PRIMARY KEY,
    "seat_map_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "level" INT NOT NULL,
    
    FOREIGN KEY ("seat_map_id") REFERENCES "seat_maps"("id") ON DELETE CASCADE
);

CREATE TABLE "sections" (
    "id" VARCHAR(50) PRIMARY KEY,
    "deck_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" seat_class_type NOT NULL,
    
    FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE
);

CREATE TABLE "rows" (
    "id" VARCHAR(50) PRIMARY KEY,
    "section_id" VARCHAR(50) NOT NULL,
    "row_number" VARCHAR(10) NOT NULL,
    
    FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE
);

CREATE TABLE "seats" (
    "id" VARCHAR(50) PRIMARY KEY,
    "row_id" VARCHAR(50) NOT NULL,
    "seat_number" VARCHAR(10) NOT NULL,
    "status" seat_status NOT NULL DEFAULT 'available',
    "adult_price" NUMERIC(12, 2) NOT NULL,
    "child_price" NUMERIC(12, 2) NOT NULL,
    
    FOREIGN KEY ("row_id") REFERENCES "rows"("id") ON DELETE CASCADE
);

CREATE TABLE "schedules" (
    "id" VARCHAR(50) PRIMARY KEY,
    "route_id" VARCHAR(50) NOT NULL,
    "vessel_id" VARCHAR(50) NOT NULL,
    "departure_time" TIMESTAMP WITH TIME ZONE NOT NULL,
    "arrival_time" TIMESTAMP WITH TIME ZONE NOT NULL,
    "status" schedule_status NOT NULL DEFAULT 'active',
    "base_adult_price" NUMERIC(12, 2) NOT NULL,
    "base_child_price" NUMERIC(12, 2) NOT NULL,
    
    FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT,
    FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE RESTRICT
);

CREATE TABLE "promotions" (
    "id" VARCHAR(50) PRIMARY KEY,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" promotion_type NOT NULL,
    "value" NUMERIC(12, 2) NOT NULL,
    "min_amount" NUMERIC(12, 2) DEFAULT 0,
    "max_discount" NUMERIC(12, 2),
    "valid_from" TIMESTAMPTZ NOT NULL,
    "valid_to" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "bookings" (
    "id" VARCHAR(50) PRIMARY KEY,
    "code" VARCHAR(20) NOT NULL UNIQUE,
    "user_id" UUID,
    "trip_type" trip_type NOT NULL,
    "outbound_schedule_id" VARCHAR(50) NOT NULL,
    "return_schedule_id" VARCHAR(50),
    "total_amount" NUMERIC(12, 2) NOT NULL,
    "discount_amount" NUMERIC(12, 2) DEFAULT 0,
    "final_amount" NUMERIC(12, 2) NOT NULL,
    "promotion_id" VARCHAR(50),
    "status" booking_status NOT NULL DEFAULT 'pending',
    "payment_method" payment_method,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
    FOREIGN KEY ("outbound_schedule_id") REFERENCES "schedules"("id") ON DELETE RESTRICT,
    FOREIGN KEY ("return_schedule_id") REFERENCES "schedules"("id") ON DELETE RESTRICT,
    FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE SET NULL
);

CREATE TABLE "passengers" (
    "id" VARCHAR(50) PRIMARY KEY,
    "booking_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "age" INT NOT NULL,
    "type" passenger_type NOT NULL,
    
    FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE
);

CREATE TABLE "tickets" (
    "id" VARCHAR(50) PRIMARY KEY,
    "booking_id" VARCHAR(50) NOT NULL,
    "schedule_id" VARCHAR(50) NOT NULL,
    "passenger_id" VARCHAR(50) NOT NULL,
    "seat_id" VARCHAR(50) NOT NULL,
    "qr_code_data" TEXT,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    
    FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE,
    FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE RESTRICT,
    FOREIGN KEY ("passenger_id") REFERENCES "passengers"("id") ON DELETE CASCADE,
    FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE RESTRICT
);

-- =================================================================
-- 3. CHÈN DỮ LIỆU BAN ĐẦU CHO BẢNG `roles`
-- =================================================================
INSERT INTO "roles" ("name") VALUES ('admin'), ('staff'), ('customer');

-- =================================================================
-- 4. TẠO CÁC CHỈ MỤC (INDEXES) ĐỂ TĂNG TỐC ĐỘ TRUY VẤN
-- =================================================================

CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_routes_ports" ON "routes"("from_port_id", "to_port_id");

-- DÒNG NÀY ĐÃ ĐƯỢC SỬA LỖI (SỬ DỤNG HÀM CAST)
CREATE INDEX "idx_schedules_date" ON "schedules" (CAST(departure_time AT TIME ZONE 'UTC' AS date));

CREATE INDEX "idx_schedules_route_vessel" ON "schedules"("route_id", "vessel_id");
CREATE INDEX "idx_bookings_user_id" ON "bookings"("user_id");
CREATE INDEX "idx_bookings_code" ON "bookings"("code");
CREATE INDEX "idx_bookings_status" ON "bookings"("status");
CREATE INDEX "idx_tickets_booking_id" ON "tickets"("booking_id");
CREATE INDEX "idx_tickets_passenger_id" ON "tickets"("passenger_id");

-- =================================================================
-- KẾT THÚC SCRIPT
-- =================================================================-- =================================================================
--      SCHEMA cho HỆ THỐNG ĐẶT VÉ TÀU CAO TỐC (FERRY BOOKING SYSTEM) - V3 (Sửa lỗi Syntax CAST)
-- =================================================================
-- Tác giả: Gemini
-- Ngày tạo: 2025-09-21
-- Phiên bản PostgreSQL: 14+
-- =================================================================

-- Xóa các đối tượng cũ nếu tồn tại để tránh lỗi khi chạy lại script
DROP TABLE IF EXISTS "tickets" CASCADE;
DROP TABLE IF EXISTS "passengers" CASCADE;
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "schedules" CASCADE;
DROP TABLE IF EXISTS "seats" CASCADE;
DROP TABLE IF EXISTS "rows" CASCADE;
DROP TABLE IF EXISTS "sections" CASCADE;
DROP TABLE IF EXISTS "decks" CASCADE;
DROP TABLE IF EXISTS "seat_maps" CASCADE;
DROP TABLE IF EXISTS "vessels" CASCADE;
DROP TABLE IF EXISTS "routes" CASCADE;
DROP TABLE IF EXISTS "ports" CASCADE;
DROP TABLE IF EXISTS "promotions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "roles" CASCADE;

DROP TYPE IF EXISTS "role_type";
DROP TYPE IF EXISTS "trip_type";
DROP TYPE IF EXISTS "passenger_type";
DROP TYPE IF EXISTS "seat_status";
DROP TYPE IF EXISTS "booking_status";
DROP TYPE IF EXISTS "payment_method";
DROP TYPE IF EXISTS "schedule_status";
DROP TYPE IF EXISTS "promotion_type";
DROP TYPE IF EXISTS "seat_class_type";

-- =================================================================
-- 1. ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU ENUM
-- =================================================================
CREATE TYPE "role_type" AS ENUM ('admin', 'staff', 'customer');
CREATE TYPE "trip_type" AS ENUM ('one-way', 'round-trip');
CREATE TYPE "passenger_type" AS ENUM ('adult', 'child');
CREATE TYPE "seat_status" AS ENUM ('available', 'reserved', 'booked');
CREATE TYPE "booking_status" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE "payment_method" AS ENUM ('card', 'e-wallet', 'bank-transfer');
CREATE TYPE "schedule_status" AS ENUM ('active', 'cancelled', 'full');
CREATE TYPE "promotion_type" AS ENUM ('percentage', 'fixed');
CREATE TYPE "seat_class_type" AS ENUM ('economy', 'business', 'vip', 'cabin');


-- =================================================================
-- 2. TẠO CÁC BẢNG
-- =================================================================

CREATE TABLE "roles" (
    "id" SERIAL PRIMARY KEY,
    "name" role_type NOT NULL UNIQUE
);

CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "phone" VARCHAR(20) UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "role_id" INT NOT NULL,
    "date_of_birth" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY ("role_id") REFERENCES "roles"("id")
);

CREATE TABLE "ports" (
    "id" VARCHAR(50) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(10) NOT NULL UNIQUE,
    "city" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "latitude" NUMERIC(10, 7) NOT NULL,
    "longitude" NUMERIC(10, 7) NOT NULL
);

CREATE TABLE "routes" (
    "id" VARCHAR(50) PRIMARY KEY,
    "from_port_id" VARCHAR(50) NOT NULL,
    "to_port_id" VARCHAR(50) NOT NULL,
    "distance_km" NUMERIC(10, 2),
    "estimated_duration_minutes" INT,
    
    FOREIGN KEY ("from_port_id") REFERENCES "ports"("id") ON DELETE RESTRICT,
    FOREIGN KEY ("to_port_id") REFERENCES "ports"("id") ON DELETE RESTRICT
);

CREATE TABLE "vessels" (
    "id" VARCHAR(50) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(20) NOT NULL UNIQUE,
    "capacity" INT NOT NULL,
    "amenities" TEXT[]
);

CREATE TABLE "seat_maps" (
    "id" VARCHAR(50) PRIMARY KEY,
    "vessel_id" VARCHAR(50) NOT NULL UNIQUE,
    "description" TEXT,
    
    FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE CASCADE
);

CREATE TABLE "decks" (
    "id" VARCHAR(50) PRIMARY KEY,
    "seat_map_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "level" INT NOT NULL,
    
    FOREIGN KEY ("seat_map_id") REFERENCES "seat_maps"("id") ON DELETE CASCADE
);

CREATE TABLE "sections" (
    "id" VARCHAR(50) PRIMARY KEY,
    "deck_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" seat_class_type NOT NULL,
    
    FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE
);

CREATE TABLE "rows" (
    "id" VARCHAR(50) PRIMARY KEY,
    "section_id" VARCHAR(50) NOT NULL,
    "row_number" VARCHAR(10) NOT NULL,
    
    FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE
);

CREATE TABLE "seats" (
    "id" VARCHAR(50) PRIMARY KEY,
    "row_id" VARCHAR(50) NOT NULL,
    "seat_number" VARCHAR(10) NOT NULL,
    "status" seat_status NOT NULL DEFAULT 'available',
    "adult_price" NUMERIC(12, 2) NOT NULL,
    "child_price" NUMERIC(12, 2) NOT NULL,
    
    FOREIGN KEY ("row_id") REFERENCES "rows"("id") ON DELETE CASCADE
);

CREATE TABLE "schedules" (
    "id" VARCHAR(50) PRIMARY KEY,
    "route_id" VARCHAR(50) NOT NULL,
    "vessel_id" VARCHAR(50) NOT NULL,
    "departure_time" TIMESTAMP WITH TIME ZONE NOT NULL,
    "arrival_time" TIMESTAMP WITH TIME ZONE NOT NULL,
    "status" schedule_status NOT NULL DEFAULT 'active',
    "base_adult_price" NUMERIC(12, 2) NOT NULL,
    "base_child_price" NUMERIC(12, 2) NOT NULL,
    
    FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT,
    FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE RESTRICT
);

CREATE TABLE "promotions" (
    "id" VARCHAR(50) PRIMARY KEY,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" promotion_type NOT NULL,
    "value" NUMERIC(12, 2) NOT NULL,
    "min_amount" NUMERIC(12, 2) DEFAULT 0,
    "max_discount" NUMERIC(12, 2),
    "valid_from" TIMESTAMPTZ NOT NULL,
    "valid_to" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "bookings" (
    "id" VARCHAR(50) PRIMARY KEY,
    "code" VARCHAR(20) NOT NULL UNIQUE,
    "user_id" UUID,
    "trip_type" trip_type NOT NULL,
    "outbound_schedule_id" VARCHAR(50) NOT NULL,
    "return_schedule_id" VARCHAR(50),
    "total_amount" NUMERIC(12, 2) NOT NULL,
    "discount_amount" NUMERIC(12, 2) DEFAULT 0,
    "final_amount" NUMERIC(12, 2) NOT NULL,
    "promotion_id" VARCHAR(50),
    "status" booking_status NOT NULL DEFAULT 'pending',
    "payment_method" payment_method,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
    FOREIGN KEY ("outbound_schedule_id") REFERENCES "schedules"("id") ON DELETE RESTRICT,
    FOREIGN KEY ("return_schedule_id") REFERENCES "schedules"("id") ON DELETE RESTRICT,
    FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE SET NULL
);

CREATE TABLE "passengers" (
    "id" VARCHAR(50) PRIMARY KEY,
    "booking_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "age" INT NOT NULL,
    "type" passenger_type NOT NULL,
    
    FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE
);

CREATE TABLE "tickets" (
    "id" VARCHAR(50) PRIMARY KEY,
    "booking_id" VARCHAR(50) NOT NULL,
    "schedule_id" VARCHAR(50) NOT NULL,
    "passenger_id" VARCHAR(50) NOT NULL,
    "seat_id" VARCHAR(50) NOT NULL,
    "qr_code_data" TEXT,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    
    FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE,
    FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE RESTRICT,
    FOREIGN KEY ("passenger_id") REFERENCES "passengers"("id") ON DELETE CASCADE,
    FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE RESTRICT
);

-- =================================================================
-- 3. CHÈN DỮ LIỆU BAN ĐẦU CHO BẢNG `roles`
-- =================================================================
INSERT INTO "roles" ("name") VALUES ('admin'), ('staff'), ('customer');

-- =================================================================
-- 4. TẠO CÁC CHỈ MỤC (INDEXES) ĐỂ TĂNG TỐC ĐỘ TRUY VẤN
-- =================================================================

CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_routes_ports" ON "routes"("from_port_id", "to_port_id");

-- DÒNG NÀY ĐÃ ĐƯỢC SỬA LỖI (SỬ DỤNG HÀM CAST)
CREATE INDEX "idx_schedules_date" ON "schedules" (CAST(departure_time AT TIME ZONE 'UTC' AS date));

CREATE INDEX "idx_schedules_route_vessel" ON "schedules"("route_id", "vessel_id");
CREATE INDEX "idx_bookings_user_id" ON "bookings"("user_id");
CREATE INDEX "idx_bookings_code" ON "bookings"("code");
CREATE INDEX "idx_bookings_status" ON "bookings"("status");
CREATE INDEX "idx_tickets_booking_id" ON "tickets"("booking_id");
CREATE INDEX "idx_tickets_passenger_id" ON "tickets"("passenger_id");

-- =================================================================
-- KẾT THÚC SCRIPT
-- =================================================================