import { pool } from '../db.js';

// Hàm nội bộ để tìm kiếm các chuyến đi cho một chặng
const findAvailableTrips = async (from_port_id, to_port_id, departure_date) => {
  const { rows } = await pool.query(
    `
    SELECT 
      s.id,
      s.departure_time,
      s.arrival_time,
      s.status,
      v.id as vessel_id, -- <-- DÒNG QUAN TRỌNG
      v.name as vessel_name,
      v.amenities,
      r.distance_km,
      r.estimated_duration_minutes,
      p_from.name as from_port_name,
      p_to.name as to_port_name,
      s.base_adult_price,
      s.base_child_price
    FROM schedules s
    JOIN vessels v ON s.vessel_id = v.id
    JOIN routes r ON s.route_id = r.id
    JOIN ports p_from ON r.from_port_id = p_from.id
    JOIN ports p_to ON r.to_port_id = p_to.id
    WHERE 
      r.from_port_id = $1 AND
      r.to_port_id = $2 AND
      s.departure_time::date = $3::date AND
      s.status = 'active'
    ORDER BY s.departure_time ASC;
    `,
    [from_port_id, to_port_id, departure_date]
  );
  return rows;
};

// === PUBLIC SERVICE ===
export const searchSchedules = async (queryParams) => {
  const { from, to, departure, type, return: return_date } = queryParams;
  const departure_trips = await findAvailableTrips(from, to, departure);
  let return_trips = [];
  if (type === 'round-trip' && return_date) {
    return_trips = await findAvailableTrips(to, from, return_date);
  }
  return { departure_trips, return_trips };
};

// === ADMIN SERVICES ===
export const getAllSchedules = async () => {
  const { rows } = await pool.query('SELECT * FROM schedules ORDER BY departure_time DESC');
  return rows;
};

export const createSchedule = async (schedule) => {
  const {
    route_id,
    vessel_id,
    departure_time,
    arrival_time,
    status,
    base_adult_price,
    base_child_price,
  } = schedule;
  const { rows } = await pool.query(
    'INSERT INTO schedules (id, route_id, vessel_id, departure_time, arrival_time, status, base_adult_price, base_child_price) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [route_id, vessel_id, departure_time, arrival_time, status, base_adult_price, base_child_price]
  );
  return rows[0];
};

export const updateSchedule = async (id, dataToUpdate) => {
  const currentScheduleResult = await pool.query('SELECT * FROM schedules WHERE id = $1', [id]);
  if (currentScheduleResult.rows.length === 0) {
    const err = new Error('Schedule not found');
    err.status = 404;
    throw err;
  }
  const currentSchedule = currentScheduleResult.rows[0];
  const updatedData = {
    route_id: dataToUpdate.route_id || currentSchedule.route_id,
    vessel_id: dataToUpdate.vessel_id || currentSchedule.vessel_id,
    departure_time: dataToUpdate.departure_time || currentSchedule.departure_time,
    arrival_time: dataToUpdate.arrival_time || currentSchedule.arrival_time,
    status: dataToUpdate.status || currentSchedule.status,
    base_adult_price: dataToUpdate.base_adult_price || currentSchedule.base_adult_price,
    base_child_price: dataToUpdate.base_child_price || currentSchedule.base_child_price,
  };
  const { rows } = await pool.query(
    'UPDATE schedules SET route_id = $1, vessel_id = $2, departure_time = $3, arrival_time = $4, status = $5, base_adult_price = $6, base_child_price = $7 WHERE id = $8 RETURNING *',
    [
      updatedData.route_id,
      updatedData.vessel_id,
      updatedData.departure_time,
      updatedData.arrival_time,
      updatedData.status,
      updatedData.base_adult_price,
      updatedData.base_child_price,
      id,
    ]
  );
  return rows[0];
};

export const deleteSchedule = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM schedules WHERE id = $1', [id]);
  if (rowCount === 0) {
    const err = new Error('Schedule not found');
    err.status = 404;
    throw err;
  }
};

/**
 * Lấy thông tin chi tiết của một lịch trình, bao gồm cả sơ đồ ghế và trạng thái của từng ghế.
 * @param {string} scheduleId - ID của lịch trình cần xem
 * @returns {Promise<object>} - Chi tiết lịch trình và sơ đồ ghế.
 */
export const getScheduleWithSeatMap = async (scheduleId) => {
  // Lấy thông tin cơ bản của schedule và vessel
  const scheduleQuery = `
    SELECT 
      s.id as schedule_id, s.departure_time, s.arrival_time, s.status,
      v.id as vessel_id, v.name as vessel_name,
      p_from.name as from_port_name,
      p_to.name as to_port_name
    FROM schedules s
    JOIN vessels v ON s.vessel_id = v.id
    JOIN routes r ON s.route_id = r.id
    JOIN ports p_from ON r.from_port_id = p_from.id
    JOIN ports p_to ON r.to_port_id = p_to.id
    WHERE s.id = $1
  `;
  const scheduleResult = await pool.query(scheduleQuery, [scheduleId]);
  if (scheduleResult.rows.length === 0) {
    throw Object.assign(new Error('Schedule not found'), { status: 404 });
  }
  const scheduleInfo = scheduleResult.rows[0];

  // Lấy toàn bộ sơ đồ ghế tĩnh của con tàu
  const seatMapQuery = `
    SELECT
      d.id as deck_id, d.name as deck_name, d.level as deck_level,
      json_agg(
        jsonb_build_object(
          'section_id', s.id, 'section_name', s.name, 'section_type', s.type,
          'rows', (
            SELECT json_agg(
              jsonb_build_object(
                'row_id', r.id, 'row_number', r.row_number,
                'seats', (
                  SELECT json_agg(
                    jsonb_build_object(
                      'seat_id', st.id, 'seat_number', st.seat_number,
                      'adult_price', st.adult_price, 'child_price', st.child_price
                    ) ORDER BY st.seat_number
                  ) FROM seats st WHERE st.row_id = r.id
                )
              ) ORDER BY r.row_number::int
            ) FROM "rows" r WHERE r.section_id = s.id
          )
        ) ORDER BY s.name
      ) as sections
    FROM decks d
    JOIN sections s ON s.deck_id = d.id
    JOIN seat_maps sm ON d.seat_map_id = sm.id
    WHERE sm.vessel_id = $1
    GROUP BY d.id
    ORDER BY d.level;
  `;
  const seatMapResult = await pool.query(seatMapQuery, [scheduleInfo.vessel_id]);
  const seatMap = { decks: seatMapResult.rows };

  // Lấy trạng thái động của các ghế cho chuyến đi này
  const seatStatusResult = await pool.query(
    `SELECT seat_id, status FROM schedule_seat_status WHERE schedule_id = $1`,
    [scheduleId]
  );
  const seatStatuses = new Map(seatStatusResult.rows.map((row) => [row.seat_id, row.status]));

  // Gộp trạng thái động vào sơ đồ ghế tĩnh
  for (const deck of seatMap.decks) {
    for (const section of deck.sections) {
      for (const row of section.rows) {
        for (const seat of row.seats) {
          // Mặc định là 'available', nếu có trong map thì cập nhật lại
          seat.status = seatStatuses.get(seat.seat_id) || 'available';
        }
      }
    }
  }

  return {
    ...scheduleInfo,
    seatMap: seatMap,
  };
};

