-- ============================================================
--  OceanPass - Full PostgreSQL Schema + Procedures + Reports
--  Compatible: PostgreSQL 14+
-- ============================================================

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- uuid_generate_v4() (optional)

-- ---------- Safety: drop in dependency order ----------
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "transactions" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;
DROP TABLE IF EXISTS "tickets" CASCADE;
DROP TABLE IF EXISTS "passengers" CASCADE;
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "promotions" CASCADE;
DROP TABLE IF EXISTS "schedules" CASCADE;
DROP TABLE IF EXISTS "seats" CASCADE;
DROP TABLE IF EXISTS "rows" CASCADE;
DROP TABLE IF EXISTS "sections" CASCADE;
DROP TABLE IF EXISTS "decks" CASCADE;
DROP TABLE IF EXISTS "seat_maps" CASCADE;
DROP TABLE IF EXISTS "vessels" CASCADE;
DROP TABLE IF EXISTS "routes" CASCADE;
DROP TABLE IF EXISTS "ports" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "employees" CASCADE;
DROP TABLE IF EXISTS "roles" CASCADE;
DROP TABLE IF EXISTS "passengers" CASCADE;

DROP TYPE IF EXISTS "role_type" CASCADE;
DROP TYPE IF EXISTS "trip_type" CASCADE;
DROP TYPE IF EXISTS "passenger_type" CASCADE;
DROP TYPE IF EXISTS "seat_status" CASCADE;
DROP TYPE IF EXISTS "booking_status" CASCADE;
DROP TYPE IF EXISTS "payment_method" CASCADE;
DROP TYPE IF EXISTS "payment_status" CASCADE;
DROP TYPE IF EXISTS "schedule_status" CASCADE;
DROP TYPE IF EXISTS "promotion_type" CASCADE;
DROP TYPE IF EXISTS "seat_class_type" CASCADE;
DROP TYPE IF EXISTS "invoice_status" CASCADE;
DROP TYPE IF EXISTS "txn_type" CASCADE;

-- ============================================================
-- 1) ENUMS
-- ============================================================
CREATE TYPE "role_type"        AS ENUM ('admin', 'staff', 'customer');
CREATE TYPE "trip_type"        AS ENUM ('one-way', 'round-trip');
CREATE TYPE "passenger_type" AS ENUM ('adult', 'child', 'senior');
CREATE TYPE "seat_status"      AS ENUM ('available', 'reserved', 'booked');
CREATE TYPE "booking_status"   AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'expired');
CREATE TYPE "payment_method"   AS ENUM ('card', 'e-wallet', 'bank-transfer', 'cash');
CREATE TYPE "payment_status"   AS ENUM ('unpaid', 'paid', 'failed', 'refunded', 'partial');
CREATE TYPE "schedule_status"  AS ENUM ('active', 'cancelled', '"completed"');
CREATE TYPE "promotion_type"   AS ENUM ('percentage', 'fixed');
CREATE TYPE "seat_class_type"  AS ENUM ('economy', 'business', 'vip', 'cabin');
CREATE TYPE "invoice_status"   AS ENUM ('draft', 'issued', 'void', 'refunded');
CREATE TYPE "txn_type"         AS ENUM ('payment', 'refund', 'adjustment');
CREATE TYPE "schedule_seat_state_enum" AS ENUM ('reserved', 'booked');

-- ============================================================
-- 2) CORE TABLES (users/roles/employees)
-- ============================================================
CREATE TABLE "roles" (
  "id" SERIAL PRIMARY KEY,
  "name" role_type NOT NULL UNIQUE
);

-- Users: khách + nhân viên đều ở đây (role_id phân biệt)
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "phone" VARCHAR(20) UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,
  "role_id" INT NOT NULL REFERENCES "roles"("id"),
  "avatar" TEXT DEFAULT 'https://i.imgur.com/ezYOpsx.png',
  "date_of_birth" DATE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Employees: thông tin riêng cho nhân viên (tham chiếu users)
CREATE TABLE "employees" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "employee_code" VARCHAR(30) NOT NULL UNIQUE,
  "department" VARCHAR(100),
  "position" VARCHAR(100),
  "hired_at" DATE,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3) DOMAIN TABLES (ports/routes/vessels/seatmap/seats)
-- ============================================================
CREATE TABLE "ports" (
  "id" VARCHAR(50) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "code" VARCHAR(10) NOT NULL UNIQUE,
  "city" VARCHAR(100) NOT NULL,
  "address" TEXT,
  "latitude" NUMERIC(10,7) NOT NULL,
  "longitude" NUMERIC(10,7) NOT NULL
);

CREATE TABLE "routes" (
  "id" VARCHAR(50) PRIMARY KEY,
  "from_port_id" VARCHAR(50) NOT NULL REFERENCES "ports"("id") ON DELETE RESTRICT,
  "to_port_id"   VARCHAR(50) NOT NULL REFERENCES "ports"("id") ON DELETE RESTRICT,
  "distance_km" NUMERIC(10,2),
  "estimated_duration_minutes" INT
);

-- Enum mới cho trạng thái tàu
CREATE TYPE "vessel_status" AS ENUM ('active', 'maintenance', 'retired');

CREATE TABLE "vessels" (
  "id" VARCHAR(50) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "code" VARCHAR(20) NOT NULL UNIQUE,
  "amenities" TEXT[],
  "status" vessel_status NOT NULL DEFAULT 'active'
);


CREATE TABLE "seat_maps" (
  "id" VARCHAR(50) PRIMARY KEY,
  "vessel_id" VARCHAR(50) NOT NULL UNIQUE REFERENCES "vessels"("id") ON DELETE CASCADE,
  "description" TEXT
);

CREATE TABLE "decks" (
  "id" VARCHAR(50) PRIMARY KEY,
  "seat_map_id" VARCHAR(50) NOT NULL REFERENCES "seat_maps"("id") ON DELETE CASCADE,
  "name" VARCHAR(100) NOT NULL,
  "level" INT NOT NULL
);

CREATE TABLE "sections" (
  "id" VARCHAR(50) PRIMARY KEY,
  "deck_id" VARCHAR(50) NOT NULL REFERENCES "decks"("id") ON DELETE CASCADE,
  "name" VARCHAR(100) NOT NULL,
  "type" seat_class_type NOT NULL
);

CREATE TABLE "rows" (
  "id" VARCHAR(50) PRIMARY KEY,
  "section_id" VARCHAR(50) NOT NULL REFERENCES "sections"("id") ON DELETE CASCADE,
  "row_number" VARCHAR(10) NOT NULL
);

CREATE TABLE "seats" (
  "id" VARCHAR(50) PRIMARY KEY,
  "row_id" VARCHAR(50) NOT NULL REFERENCES "rows"("id") ON DELETE CASCADE,
  "seat_number" VARCHAR(10) NOT NULL,
  "adult_price" NUMERIC(12,2) NOT NULL,
  "child_price" NUMERIC(12,2) NOT NULL,
  "senior_price" NUMERIC(12,2) NOT NULL, 
  UNIQUE ("row_id", "seat_number")
);

CREATE TABLE "schedules" (
  "id" VARCHAR(50) PRIMARY KEY,
  "route_id" VARCHAR(50) NOT NULL REFERENCES "routes"("id") ON DELETE RESTRICT,
  "vessel_id" VARCHAR(50) NOT NULL REFERENCES "vessels"("id") ON DELETE RESTRICT,
  "departure_time" TIMESTAMPTZ NOT NULL,
  "arrival_time"   TIMESTAMPTZ NOT NULL,
  "status" schedule_status NOT NULL DEFAULT 'active',
  "base_adult_price" NUMERIC(12,2) NOT NULL,
  "base_child_price" NUMERIC(12,2) NOT NULL,
  CHECK (arrival_time > departure_time)
);

-- ============================================================
-- 4) PROMOTIONS / BOOKINGS / PASSENGERS / TICKETS
-- ============================================================
CREATE TABLE "promotions" (
  "id" VARCHAR(50) PRIMARY KEY,
  "code" VARCHAR(50) NOT NULL UNIQUE,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "type" promotion_type NOT NULL,
  "value" NUMERIC(12,2) NOT NULL,
  "min_amount" NUMERIC(12,2) DEFAULT 0,
  "max_discount" NUMERIC(12,2),
  "valid_from" TIMESTAMPTZ NOT NULL,
  "valid_to"   TIMESTAMPTZ NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "uses_count" INT NOT NULL DEFAULT 0, 
  "max_uses" INT,                      
  CHECK (valid_to > valid_from)
);

CREATE TABLE "bookings" (
  "id" VARCHAR(50) PRIMARY KEY,
  "code" VARCHAR(50) NOT NULL UNIQUE,
  "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "trip_type" trip_type NOT NULL,
  "outbound_schedule_id" VARCHAR(50) NOT NULL REFERENCES "schedules"("id") ON DELETE RESTRICT,
  "return_schedule_id"   VARCHAR(50) REFERENCES "schedules"("id") ON DELETE RESTRICT,
  "total_amount" NUMERIC(12,2) NOT NULL,
  "discount_amount" NUMERIC(12,2) DEFAULT 0,
  "final_amount" NUMERIC(12,2) NOT NULL,
  "promotion_id" VARCHAR(50) REFERENCES "promotions"("id") ON DELETE SET NULL,
  "status" booking_status NOT NULL DEFAULT 'pending',
  "payment_method" payment_method,
  "created_by_employee_id" UUID REFERENCES "employees"("id") ON DELETE SET NULL,
  "expires_at" TIMESTAMPTZ NULL, -- Thêm dòng này
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (final_amount = GREATEST(total_amount - COALESCE(discount_amount,0), 0))
);

-- Bảng theo dõi trạng thái ghế theo từng chuyến
CREATE TABLE "schedule_seat_status" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "schedule_id" VARCHAR(50) NOT NULL REFERENCES "schedules"("id") ON DELETE CASCADE,
  "seat_id" VARCHAR(50) NOT NULL REFERENCES "seats"("id") ON DELETE CASCADE,
  "booking_id" VARCHAR(50) REFERENCES "bookings"("id") ON DELETE SET NULL,
  "status" schedule_seat_state_enum NOT NULL,
  "reserved_until" TIMESTAMPTZ,
  CONSTRAINT "uq_schedule_seat" UNIQUE ("schedule_id", "seat_id")
);

CREATE TABLE "passengers" (
  "id" VARCHAR(50) PRIMARY KEY,
  "booking_id" VARCHAR(50) NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "date_of_birth" DATE NOT NULL,
  "type" passenger_type NOT NULL,
  "cccd_number" VARCHAR(20)
);

-- Vé gắn với lịch trình cụ thể + ghế cụ thể
CREATE TABLE "tickets" (
  "id" VARCHAR(50) PRIMARY KEY,
  "booking_id"  VARCHAR(50) NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "schedule_id" VARCHAR(50) NOT NULL REFERENCES "schedules"("id") ON DELETE RESTRICT,
  "passenger_id" VARCHAR(50) NOT NULL REFERENCES "passengers"("id") ON DELETE CASCADE,
  "seat_id" VARCHAR(50) NOT NULL REFERENCES "seats"("id") ON DELETE RESTRICT,
  "qr_code_data" TEXT,
  "is_used" BOOLEAN NOT NULL DEFAULT false,
  UNIQUE ("schedule_id", "seat_id"),           -- chặn trùng ghế cùng chuyến
  UNIQUE ("passenger_id", "schedule_id")       -- 1 hành khách 1 vé / 1 chiều
);


-- ============================================================
-- 5) INVOICES / PAYMENTS / TRANSACTIONS / AUDIT
-- ============================================================
CREATE TABLE "invoices" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "booking_id" VARCHAR(50) NOT NULL UNIQUE REFERENCES "bookings"("id") ON DELETE CASCADE,
  "invoice_number" VARCHAR(30) NOT NULL UNIQUE,
  "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" invoice_status NOT NULL DEFAULT 'issued',
  "subtotal" NUMERIC(12,2) NOT NULL,
  "discount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "tax" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "total" NUMERIC(12,2) NOT NULL,
  "note" TEXT
);

CREATE TABLE "payments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_id" UUID NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "method" payment_method NOT NULL,
  "status" payment_status NOT NULL DEFAULT 'unpaid',
  "provider" VARCHAR(50),               -- VNPay/MoMo/Stripe...
  "provider_ref" VARCHAR(100),          -- mã giao dịch phía cổng thanh toán
  "amount" NUMERIC(12,2) NOT NULL,
  "paid_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "booking_id" VARCHAR(50) NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "invoice_id" UUID REFERENCES "invoices"("id") ON DELETE SET NULL,
  "payment_id" UUID REFERENCES "payments"("id") ON DELETE SET NULL,
  "type" txn_type NOT NULL,
  "amount" NUMERIC(12,2) NOT NULL,
  "message" TEXT,
  "created_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity" VARCHAR(50) NOT NULL,  -- bookings/tickets/payments...
  "entity_id" VARCHAR(100) NOT NULL,
  "action" VARCHAR(30) NOT NULL,  -- create/update/delete/status-change
  "payload" JSONB,
  "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6) TRIGGERS: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated   BEFORE UPDATE ON "users"     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_emp_updated     BEFORE UPDATE ON "employees" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_book_updated    BEFORE UPDATE ON "bookings"  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 7) INDEXES
-- ============================================================
CREATE INDEX "idx_users_email"      ON "users"("email");
CREATE INDEX "idx_routes_ports"     ON "routes"("from_port_id","to_port_id");
CREATE INDEX "idx_schedules_date"   ON "schedules"(CAST(departure_time AT TIME ZONE 'UTC' AS date));
CREATE INDEX "idx_schedules_route"  ON "schedules"("route_id","vessel_id");
CREATE INDEX "idx_bookings_user"    ON "bookings"("user_id");
CREATE INDEX "idx_bookings_code"    ON "bookings"("code");
CREATE INDEX "idx_bookings_status"  ON "bookings"("status");
CREATE INDEX "idx_tickets_booking"  ON "tickets"("booking_id");
CREATE INDEX "idx_tickets_pass"     ON "tickets"("passenger_id");
CREATE INDEX "idx_invoices_booking" ON "invoices"("booking_id");
CREATE INDEX "idx_payments_invoice" ON "payments"("invoice_id");
CREATE INDEX "idx_txn_booking"      ON "transactions"("booking_id");

-- ============================================================
-- 8) BUSINESS FUNCTIONS / PROCEDURES
-- ============================================================

-- Check ghế còn trống cho 1 schedule
CREATE OR REPLACE FUNCTION seat_available(p_schedule_id VARCHAR, p_seat_id VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  -- Kiểm tra trong bảng trạng thái ghế mới
  IF EXISTS (
    SELECT 1 FROM schedule_seat_status sss
    WHERE sss.schedule_id = p_schedule_id AND sss.seat_id = p_seat_id
  ) THEN
    RETURN FALSE; -- Không còn trống
  END IF;

  RETURN TRUE; -- Còn trống
END;
$$ LANGUAGE plpgsql;

-- Tạo booking (pending), tính tiền cơ bản (không áp khuyến mãi ở đây)
CREATE OR REPLACE FUNCTION booking_create(
  p_id VARCHAR,
  p_code VARCHAR,
  p_user UUID,
  p_trip trip_type,
  p_outbound VARCHAR,
  p_total NUMERIC,
  p_return VARCHAR DEFAULT NULL,
  p_discount NUMERIC DEFAULT 0,
  p_promo_id VARCHAR DEFAULT NULL,
  p_payment_method payment_method DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO bookings(id, code, user_id, trip_type, outbound_schedule_id, return_schedule_id,
                       total_amount, discount_amount, final_amount, promotion_id, status,
                       payment_method, created_by_employee_id)
  VALUES (p_id, p_code, p_user, p_trip, p_outbound, p_return,
          p_total, p_discount, GREATEST(p_total - COALESCE(p_discount,0),0),
          p_promo_id, 'pending', p_payment_method, p_created_by);

  INSERT INTO audit_logs(entity, entity_id, action, payload, actor_id)
  VALUES ('bookings', p_id, 'create', jsonb_build_object('code', p_code), p_user);
END;
$$ LANGUAGE plpgsql;


-- Thêm hành khách vào booking
CREATE OR REPLACE FUNCTION passenger_add(
  p_id VARCHAR,
  p_booking_id VARCHAR,
  p_name VARCHAR,
  p_age INT,
  p_type passenger_type
) RETURNS VOID AS $$
BEGIN
  INSERT INTO passengers(id, booking_id, name, age, type)
  VALUES (p_id, p_booking_id, p_name, p_age, p_type);

  INSERT INTO audit_logs(entity, entity_id, action, payload)
  VALUES ('passengers', p_id, 'create', jsonb_build_object('booking_id', p_booking_id));
END;
$$ LANGUAGE plpgsql;

-- Xuất vé (issue ticket) cho 1 hành khách + ghế + lịch trình
CREATE OR REPLACE FUNCTION ticket_issue(
  p_ticket_id VARCHAR,
  p_booking_id VARCHAR,
  p_schedule_id VARCHAR,
  p_passenger_id VARCHAR,
  p_seat_id VARCHAR,
  p_qr TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF NOT seat_available(p_schedule_id, p_seat_id) THEN
    RAISE EXCEPTION 'Seat % is not available for schedule %', p_seat_id, p_schedule_id;
  END IF;

  INSERT INTO tickets(id, booking_id, schedule_id, passenger_id, seat_id, qr_code_data)
  VALUES (p_ticket_id, p_booking_id, p_schedule_id, p_passenger_id, p_seat_id, p_qr);

  INSERT INTO audit_logs(entity, entity_id, action, payload)
  VALUES ('tickets', p_ticket_id, 'issue', jsonb_build_object('booking', p_booking_id, 'schedule', p_schedule_id, 'seat', p_seat_id));
END;
$$ LANGUAGE plpgsql;

-- Xác nhận & phát hành hoá đơn cho booking
CREATE OR REPLACE FUNCTION invoice_issue_for_booking(
  p_booking_id VARCHAR,
  p_invoice_number VARCHAR,
  p_subtotal NUMERIC,
  p_discount NUMERIC,
  p_tax NUMERIC
) RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID := gen_random_uuid();
  v_total NUMERIC := GREATEST(p_subtotal - COALESCE(p_discount,0),0) + COALESCE(p_tax,0);
BEGIN
  INSERT INTO invoices(id, booking_id, invoice_number, status, subtotal, discount, tax, total)
  VALUES (v_invoice_id, p_booking_id, p_invoice_number, 'issued', p_subtotal, p_discount, p_tax, v_total);

  UPDATE bookings SET status='confirmed' WHERE id=p_booking_id AND status='pending';

  INSERT INTO audit_logs(entity, entity_id, action, payload)
  VALUES ('invoices', p_booking_id, 'issue', jsonb_build_object('invoice_id', v_invoice_id, 'number', p_invoice_number));

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- Ghi nhận thanh toán
CREATE OR REPLACE FUNCTION payment_record(
  p_invoice_id UUID,
  p_method payment_method,
  p_amount NUMERIC,
  p_provider VARCHAR DEFAULT NULL,
  p_provider_ref VARCHAR DEFAULT NULL,
  p_status payment_status DEFAULT 'paid',
  p_actor UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_payment_id UUID := gen_random_uuid();
  v_booking_id VARCHAR;
BEGIN
  INSERT INTO payments(id, invoice_id, method, status, provider, provider_ref, amount, paid_at)
  VALUES (v_payment_id, p_invoice_id, p_method, p_status, p_provider, p_provider_ref, p_amount,
          CASE WHEN p_status='paid' THEN CURRENT_TIMESTAMP ELSE NULL END);

  SELECT booking_id INTO v_booking_id FROM invoices WHERE id=p_invoice_id;

  INSERT INTO transactions(id, booking_id, invoice_id, payment_id, type, amount, message, created_by)
  VALUES (gen_random_uuid(), v_booking_id, p_invoice_id, v_payment_id, 
          CASE WHEN p_status='refunded' THEN 'refund' ELSE 'payment' END, 
          p_amount, p_provider_ref, p_actor);

  -- nếu đã thanh toán đủ hoặc quá -> completed
  IF p_status='paid' THEN
    UPDATE bookings SET status='completed' WHERE id=v_booking_id AND status IN ('pending','confirmed');
  END IF;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- Huỷ booking: xoá vé, cập nhật trạng thái, tạo nhật ký
CREATE OR REPLACE FUNCTION booking_cancel(p_booking_id VARCHAR, p_reason TEXT DEFAULT NULL, p_actor UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  DELETE FROM tickets WHERE booking_id=p_booking_id; -- UNIQUE đảm bảo giải phóng ghế
  UPDATE bookings SET status='cancelled' WHERE id=p_booking_id AND status IN ('pending','confirmed');
  INSERT INTO audit_logs(entity, entity_id, action, payload, actor_id)
  VALUES ('bookings', p_booking_id, 'cancel', jsonb_build_object('reason', p_reason), p_actor);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 9) REPORTING VIEWS
-- ============================================================
-- Doanh thu theo ngày
CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT
  date_trunc('day', i.issued_at) AS day,
  SUM(i.total) AS total_revenue,
  COUNT(*) AS invoices_count
FROM invoices i
WHERE i.status IN ('issued','refunded')
GROUP BY 1
ORDER BY 1;

-- Doanh thu theo tháng
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
  to_char(date_trunc('month', i.issued_at), 'YYYY-MM') AS ym,
  SUM(i.total) AS total_revenue,
  COUNT(*) AS invoices_count
FROM invoices i
WHERE i.status IN ('issued','refunded')
GROUP BY 1
ORDER BY 1;

-- Hệ số lấp đầy (load factor) theo schedule
CREATE OR REPLACE VIEW v_schedule_load_factor AS
SELECT
  s.id AS schedule_id,
  s.route_id,
  s.vessel_id,
  s.departure_time,
  (SELECT COUNT(*) FROM seats) AS total_seats,             -- tổng ghế của seat map hiện tại (giả định dùng chung)
  (SELECT COUNT(*) FROM tickets t WHERE t.schedule_id=s.id) AS sold_tickets,
  ( (SELECT COUNT(*) FROM tickets t WHERE t.schedule_id=s.id)::DECIMAL
    / NULLIF((SELECT COUNT(*) FROM seats),0) ) AS load_factor
FROM schedules s;

-- Tổng hợp vé bán theo tuyến/ngày
CREATE OR REPLACE VIEW v_sales_by_route_day AS
SELECT
  r.id AS route_id,
  CAST(s.departure_time AT TIME ZONE 'UTC' AS DATE) AS day_utc,
  COUNT(t.id) AS tickets_sold,
  SUM(i.total) FILTER (WHERE i.id IS NOT NULL) AS revenue
FROM routes r
JOIN schedules s ON s.route_id = r.id
LEFT JOIN tickets t ON t.schedule_id = s.id
LEFT JOIN invoices i ON i.booking_id = t.booking_id
GROUP BY r.id, CAST(s.departure_time AT TIME ZONE 'UTC' AS DATE)
ORDER BY day_utc;

-- ============================================================
-- 10) SEED DATA (nhẹ nhàng để demo)
-- ============================================================
INSERT INTO roles(name) VALUES ('admin'), ('staff'), ('customer');

-- Admin user
INSERT INTO users(id, name, email, phone, password_hash, role_id)
VALUES (gen_random_uuid(), 'System Admin', 'admin@oceanpass.local', '0900000000', '$2b$12$examplehash', 
        (SELECT id FROM roles WHERE name='admin'));

-- Sample ports/routes/vessel/seatmap (tối thiểu)
INSERT INTO ports(id,name,code,city,address,latitude,longitude) VALUES
('PRT_HCM','Bến Bạch Đằng','HCM','Hồ Chí Minh','Q1',10.7730,106.7040),
('PRT_VT','Cảng Cầu Đá','VTP','Vũng Tàu','Cầu Đá',10.3460,107.0830);

INSERT INTO routes(id,from_port_id,to_port_id,distance_km,estimated_duration_minutes) VALUES
('R_HCM_VT','PRT_HCM','PRT_VT', 96.0, 120);

INSERT INTO vessels(id,name,code,capacity,amenities) VALUES
('V_SL1','SilverLine 01','SL01', 200, ARRAY['AC','WiFi','Snack']);

INSERT INTO seat_maps(id,vessel_id,description) VALUES ('SM_SL1','V_SL1','Default seat map');

INSERT INTO decks(id,seat_map_id,name,level) VALUES ('D1','SM_SL1','Main Deck',1);

INSERT INTO sections(id,deck_id,name,type) VALUES
('S1','D1','Economy A','economy'),
('S2','D1','Business A','business');

INSERT INTO rows(id,section_id,row_number) VALUES
('RW1','S1','1'),('RW2','S1','2'),('RW3','S2','1');

-- Tạo vài ghế mẫu
INSERT INTO seats(id,row_id,seat_number,adult_price,child_price) VALUES
('ST1','RW1','A1',350000,250000),
('ST2','RW1','A2',350000,250000),
('ST3','RW2','B1',350000,250000),
('ST4','RW3','C1',500000,350000);

-- Lịch trình ngày mai
INSERT INTO schedules(id,route_id,vessel_id,departure_time,arrival_time,status,base_adult_price,base_child_price)
VALUES ('SCH1','R_HCM_VT','V_SL1', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 2 hours','active',350000,250000);

-- Khuyến mãi 10%
INSERT INTO promotions(id,code,name,type,value,valid_from,valid_to,is_active)
VALUES ('PM10','NEW10','New user 10%','percentage',10, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', true);

-- ============================================================
-- END OF FILE
-- ============================================================