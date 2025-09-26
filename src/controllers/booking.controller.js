import { getBookings, createBooking, updateBooking, deleteBooking } from '../services/booking.service.js';

export async function handleGetBookings(req, res, next) {
  try {
    const bookings = await getBookings();
    res.json({ ok: true, data: bookings });
  } catch (e) {
    next(e);
  }
}

export async function handleCreateBooking(req, res, next) {
  try {
    const booking = await createBooking(req.body);
    res.json({ ok: true, data: booking });
  } catch (e) {
    next(e);
  }
}

export async function handleUpdateBooking(req, res, next) {
  try {
    const booking = await updateBooking(req.params.id, req.body);
    res.json({ ok: true, data: booking });
  } catch (e) {
    next(e);
  }
}

export async function handleDeleteBooking(req, res, next) {
  try {
    await deleteBooking(req.params.id);
    res.json({ ok: true, message: 'Booking deleted successfully' });
  } catch (e) {
    next(e);
  }
}
