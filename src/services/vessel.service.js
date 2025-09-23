// src/services/vessel.service.js
import { pool } from '../db.js';

// === PUBLIC SERVICES ===

/**
 * Lấy danh sách tất cả tàu (thông tin cơ bản)
 */
export const listAllVessels = async () => {
  const { rows } = await pool.query(
    'SELECT id, name, code, capacity, status, amenities FROM vessels ORDER BY name ASC'
  );
  return rows;
};

/**
 * Lấy thông tin chi tiết một tàu, bao gồm toàn bộ sơ đồ ghế
 */
export const getVesselDetailsById = async (vesselId) => {
  const query = `
    SELECT
      v.id, v.name, v.code, v.capacity, v.amenities, v.status,
      json_agg(DISTINCT
        jsonb_build_object(
          'deck_id', d.id,
          'deck_name', d.name,
          'deck_level', d.level,
          'sections', (
            SELECT json_agg(
              jsonb_build_object(
                'section_id', s.id,
                'section_name', s.name,
                'section_type', s.type,
                'rows', (
                  SELECT json_agg(
                    jsonb_build_object(
                      'row_id', r.id,
                      'row_number', r.row_number,
                      'seats', (
                        SELECT json_agg(
                          jsonb_build_object(
                            'seat_id', st.id,
                            'seat_number', st.seat_number,
                            'adult_price', st.adult_price,
                            'child_price', st.child_price 
                          ) ORDER BY st.seat_number
                        ) FROM seats st WHERE st.row_id = r.id
                      )
                    ) ORDER BY r.row_number::int
                  ) FROM rows r WHERE r.section_id = s.id
                )
              ) ORDER BY s.name
            ) FROM sections s WHERE s.deck_id = d.id
          )
        )
      ) AS seat_map
    FROM vessels v
    LEFT JOIN seat_maps sm ON v.id = sm.vessel_id
    LEFT JOIN decks d ON sm.id = d.seat_map_id
    WHERE v.id = $1
    GROUP BY v.id;
  `;
  const { rows } = await pool.query(query, [vesselId]);
  return rows[0];
};

// === ADMIN SERVICES ===

// --- Vessel ---
export const createVessel = async ({ name, code, capacity, amenities, status }) => {
  const { rows } = await pool.query(
    'INSERT INTO vessels (id, name, code, capacity, amenities, status) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING *',
    [name, code, capacity, amenities, status]
  );

  // Khi tạo tàu mới, tự động tạo một seat_map cho nó
  const newVessel = rows[0];
  await pool.query(
    'INSERT INTO seat_maps (id, vessel_id, description) VALUES (gen_random_uuid(), $1, $2)',
    [newVessel.id, `Sơ đồ ghế cho tàu ${name}`]
  );

  return newVessel;
};

export const updateVessel = async (id, dataToUpdate) => {
  // Lấy thông tin tàu hiện tại để làm giá trị mặc định
  const currentVesselResult = await pool.query('SELECT * FROM vessels WHERE id = $1', [id]);
  if (currentVesselResult.rows.length === 0) {
    return null; // Trả về null nếu không tìm thấy tàu
  }
  const currentVessel = currentVesselResult.rows[0];

  // Trộn dữ liệu cũ với dữ liệu mới.
  // Nếu một trường không được cung cấp trong dataToUpdate, nó sẽ lấy giá trị từ currentVessel.
  const updatedData = {
    name: dataToUpdate.name || currentVessel.name,
    code: dataToUpdate.code || currentVessel.code,
    capacity: dataToUpdate.capacity || currentVessel.capacity,
    amenities: dataToUpdate.amenities || currentVessel.amenities,
    status: dataToUpdate.status || currentVessel.status,
  };

  // Kiểm tra lại để đảm bảo các trường NOT NULL không bị ghi đè thành null
  if (!updatedData.name || !updatedData.code) {
    throw new Error('Vessel name and code cannot be null.');
  }

  const { rows } = await pool.query(
    'UPDATE vessels SET name = $1, code = $2, capacity = $3, amenities = $4, status = $5 WHERE id = $6 RETURNING *',
    [
      updatedData.name,
      updatedData.code,
      updatedData.capacity,
      updatedData.amenities,
      updatedData.status,
      id,
    ]
  );
  return rows[0];
};

export const deleteVessel = async (id) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lấy ID của seat_map liên quan đến tàu
    const seatMapResult = await client.query('SELECT id FROM seat_maps WHERE vessel_id = $1', [id]);

    if (seatMapResult.rows.length > 0) {
      const seatMapId = seatMapResult.rows[0].id;

      // Xóa theo thứ tự ngược: seats -> rows -> sections -> decks -> seat_maps
      await client.query(
        `DELETE FROM seats WHERE row_id IN (SELECT r.id FROM rows r JOIN sections s ON r.section_id = s.id JOIN decks d ON s.deck_id = d.id WHERE d.seat_map_id = $1)`,
        [seatMapId]
      );
      await client.query(
        `DELETE FROM rows WHERE section_id IN (SELECT s.id FROM sections s JOIN decks d ON s.deck_id = d.id WHERE d.seat_map_id = $1)`,
        [seatMapId]
      );
      await client.query(
        `DELETE FROM sections WHERE deck_id IN (SELECT d.id FROM decks d WHERE d.seat_map_id = $1)`,
        [seatMapId]
      );
      await client.query('DELETE FROM decks WHERE seat_map_id = $1', [seatMapId]);
      await client.query('DELETE FROM seat_maps WHERE id = $1', [seatMapId]);
    }

    // Xóa các lịch trình liên quan (nếu có)
    await client.query('DELETE FROM schedules WHERE vessel_id = $1', [id]);

    // Cuối cùng, xóa chính con tàu đó
    const deleteVesselResult = await client.query('DELETE FROM vessels WHERE id = $1', [id]);

    // Kiểm tra xem có thực sự xóa được không TRƯỚC KHI COMMIT
    if (deleteVesselResult.rowCount === 0) {
      // Nếu không có hàng nào bị xóa, có thể ID không tồn tại.
      // Hoàn tác lại giao dịch một cách an toàn và báo lỗi.
      await client.query('ROLLBACK');
      throw new Error('Vessel not found. No records were deleted.');
    }

    // Mọi thứ thành công, commit giao dịch
    await client.query('COMMIT');

    // Trả về thông điệp thành công
    return { message: 'Xóa tàu thành công.' };
  } catch (error) {
    // Chỉ rollback nếu có lỗi xảy ra TRƯỚC KHI commit
    // Bằng cách đặt một biến cờ hoặc kiểm tra trạng thái transaction (phức tạp hơn)
    // Cách đơn giản là chỉ rollback ở đây, vì nếu lỗi xảy ra sau COMMIT thì đã quá muộn.
    // Khối catch này chủ yếu để xử lý lỗi CSDL (ví dụ: mất kết nối, ràng buộc...)
    await client.query('ROLLBACK');
    console.error('Error in deleteVessel transaction:', error);
    throw new Error(error.message); // Ném lỗi gốc ra ngoài
  } finally {
    client.release(); // Luôn luôn giải phóng kết nối
  }
};

// --- Deck ---
export const addDeck = async ({ vessel_id, name, level }) => {
  // Lấy seat_map_id từ vessel_id
  const seatMapResult = await pool.query('SELECT id FROM seat_maps WHERE vessel_id = $1', [
    vessel_id,
  ]);
  if (seatMapResult.rows.length === 0) {
    throw new Error('Seat map not found for this vessel');
  }
  const seat_map_id = seatMapResult.rows[0].id;

  // BƯỚC 1: Kiểm tra xem level đã tồn tại cho seat_map này chưa
  const existingDeckResult = await pool.query(
    'SELECT id FROM decks WHERE seat_map_id = $1 AND level = $2',
    [seat_map_id, level]
  );

  // BƯỚC 2: Nếu đã tồn tại, ném ra lỗi cụ thể
  if (existingDeckResult.rowCount > 0) {
    throw new Error('Đã tồn tại tầng này');
  }

  // BƯỚC 3: Nếu chưa tồn tại, tiến hành thêm mới
  const { rows } = await pool.query(
    'INSERT INTO decks (id, seat_map_id, name, level) VALUES (gen_random_uuid(), $1, $2, $3) RETURNING *',
    [seat_map_id, name, level]
  );
  return rows[0];
};

export const updateDeck = async (id, dataToUpdate) => {
  // Lấy thông tin tầng hiện tại
  const currentDeckResult = await pool.query('SELECT * FROM decks WHERE id = $1', [id]);
  if (currentDeckResult.rows.length === 0) {
    return null; // Không tìm thấy tầng
  }
  const currentDeck = currentDeckResult.rows[0];

  // Trộn dữ liệu cũ với dữ liệu mới được gửi lên
  const updatedData = {
    name: dataToUpdate.name || currentDeck.name,
    level: dataToUpdate.level || currentDeck.level,
  };

  // Thực thi câu lệnh UPDATE với dữ liệu đã được trộn
  const { rows } = await pool.query(
    'UPDATE decks SET name = $1, "level" = $2 WHERE id = $3 RETURNING *',
    [updatedData.name, updatedData.level, id]
  );
  return rows[0];
};

export const deleteDeck = async (id) => {
  await pool.query('DELETE FROM decks WHERE id = $1', [id]);
  return { message: 'Deck deleted successfully.' };
};

// --- Section ---
export const addSection = async ({ deck_id, name, type }) => {
  const { rows } = await pool.query(
    'INSERT INTO sections (id, deck_id, name, type) VALUES (gen_random_uuid(), $1, $2, $3) RETURNING *',
    [deck_id, name, type]
  );
  return rows[0];
};

export const updateSection = async (id, dataToUpdate) => {
  // Lấy thông tin khoang hiện tại
  const currentSectionResult = await pool.query('SELECT * FROM sections WHERE id = $1', [id]);
  if (currentSectionResult.rows.length === 0) {
    return null; // Không tìm thấy khoang
  }
  const currentSection = currentSectionResult.rows[0];

  // Trộn dữ liệu cũ với dữ liệu mới được gửi lên
  const updatedData = {
    name: dataToUpdate.name || currentSection.name,
    type: dataToUpdate.type || currentSection.type,
  };

  // Thực thi câu lệnh UPDATE với dữ liệu đã được trộn
  const { rows } = await pool.query(
    'UPDATE sections SET name = $1, type = $2 WHERE id = $3 RETURNING *',
    [updatedData.name, updatedData.type, id]
  );
  return rows[0];
};

export const deleteSection = async (id) => {
  await pool.query('DELETE FROM sections WHERE id = $1', [id]);
  return { message: 'Section deleted successfully.' };
};

// --- Row ---
export const addRow = async ({ section_id, row_number }) => {
  // BƯỚC 1: Kiểm tra xem section_id có hợp lệ không
  const sectionResult = await pool.query('SELECT deck_id FROM sections WHERE id = $1', [section_id]);
  if (sectionResult.rowCount === 0) {
    throw new Error('Section not found');
  }
  const { deck_id } = sectionResult.rows[0];

  // BƯỚC 2: Kiểm tra xem row_number đã tồn tại trong bất kỳ khoang nào của cùng một tầng chưa
  const existingRowResult = await pool.query(
    `SELECT r.id FROM rows r
     JOIN sections s ON r.section_id = s.id
     WHERE s.deck_id = $1 AND r.row_number = $2`,
    [deck_id, row_number]
  );

  // BƯỚC 3: Nếu đã tồn tại, ném ra lỗi cụ thể
  if (existingRowResult.rowCount > 0) {
    throw new Error('Số hàng này đã tồn tại trong tầng');
  }

  // BƯỚC 4: Nếu chưa tồn tại, tiến hành thêm hàng mới
  const { rows } = await pool.query(
    'INSERT INTO rows (id, section_id, row_number) VALUES (gen_random_uuid(), $1, $2) RETURNING *',
    [section_id, row_number]
  );
  return rows[0];
};

export const updateRow = async (id, { row_number }) => {
  const { rows } = await pool.query('UPDATE rows SET row_number = $1 WHERE id = $2 RETURNING *', [
    row_number,
    id,
  ]);
  return rows[0];
};

export const deleteRow = async (id) => {
  await pool.query('DELETE FROM rows WHERE id = $1', [id]);
  return { message: 'Row deleted successfully.' };
};

// --- Seat ---
export const addSeat = async ({ row_id, seat_number, adult_price, child_price }) => {
  // Kiểm tra xem row_id có tồn tại không
  const rowResult = await pool.query('SELECT id FROM rows WHERE id = $1', [row_id]);
  if (rowResult.rowCount === 0) {
    throw new Error('Row not found');
  }

  // BƯỚC 1: Đếm số ghế hiện tại trong hàng
  const seatCountResult = await pool.query(
    'SELECT COUNT(*) FROM seats WHERE row_id = $1',
    [row_id]
  );
  const seatCount = parseInt(seatCountResult.rows[0].count, 10);

  // BƯỚC 2: Nếu số ghế đã là 8 hoặc nhiều hơn, ném ra lỗi
  if (seatCount >= 8) {
    throw new Error('Một hàng chỉ có thể có tối đa 8 ghế');
  }

  // BƯỚC 3: Nếu chưa đủ, tiến hành thêm ghế mới
  const { rows } = await pool.query(
    'INSERT INTO seats (id, row_id, seat_number, adult_price, child_price) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *',
    [row_id, seat_number, adult_price, child_price]
  );
  return rows[0];
};

export const updateSeat = async (id, { seat_number, adult_price, child_price }) => {
  const { rows } = await pool.query(
    'UPDATE seats SET seat_number = $1, adult_price = $2, child_price = $3 WHERE id = $4 RETURNING *',
    [seat_number, adult_price, child_price, id]
  );
  return rows[0];
};

export const deleteSeat = async (id) => {
  await pool.query('DELETE FROM seats WHERE id = $1', [id]);
  return { message: 'Seat deleted successfully.' };
};


// === SERVICE MỚI ĐỂ CẬP NHẬT GIÁ CHO KHOANG ===
export const updatePriceForSection = async (section_id, { adult_price, child_price }) => {
    const { rows } = await pool.query(
        `
        UPDATE seats
        SET adult_price = $1, child_price = $2
        WHERE row_id IN (
            SELECT id FROM rows WHERE section_id = $3
        )
        RETURNING *;
        `,
        [adult_price, child_price, section_id]
    );

    if (rows.length === 0) {
        // Có thể khoang này không có ghế nào, hoặc section_id không đúng
        // Trong trường hợp này, không báo lỗi mà trả về thông báo thành công nhưng không có gì thay đổi
        return { message: 'Không có ghế nào được cập nhật (có thể khoang trống hoặc ID không đúng).' };
    }

    return { 
        message: `Đã cập nhật giá cho ${rows.length} ghế thành công.`,
        updated_count: rows.length 
    };
};