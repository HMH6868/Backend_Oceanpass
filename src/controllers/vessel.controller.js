// src/controllers/vessel.controller.js
import * as vesselService from '../services/vessel.service.js';

// === PUBLIC CONTROLLERS ===

export const getVessels = async (req, res, next) => {
  try {
    const vessels = await vesselService.listAllVessels();
    res.status(200).json({ ok: true, data: vessels });
  } catch (e) {
    next(e);
  }
};

export const getVessel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vessel = await vesselService.getVesselDetailsById(id);
    if (!vessel) {
      const err = new Error('Vessel not found');
      err.status = 404;
      throw err;
    }
    res.status(200).json({ ok: true, data: vessel });
  } catch (e) {
    next(e);
  }
};

// === ADMIN CONTROLLERS ===

// --- Vessel ---
export const createVessel = async (req, res, next) => {
  try {
    const newVessel = await vesselService.createVessel(req.body);
    res.status(201).json({ ok: true, data: newVessel });
  } catch (e) {
    next(e);
  }
};

export const updateVessel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedVessel = await vesselService.updateVessel(id, req.body);
    if (!updatedVessel) {
      const err = new Error('Vessel not found');
      err.status = 404;
      throw err;
    }
    res.status(200).json({ ok: true, data: updatedVessel });
  } catch (e) {
    next(e);
  }
};

export const deleteVessel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await vesselService.deleteVessel(id);
    res.status(200).json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
};

// --- Deck ---
export const addDeck = async (req, res, next) => {
  try {
    const newDeck = await vesselService.addDeck(req.body);
    res.status(201).json({ ok: true, data: newDeck });
  } catch (e) {
    next(e);
  }
};

export const updateDeck = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedDeck = await vesselService.updateDeck(id, req.body);
    res.status(200).json({ ok: true, data: updatedDeck });
  } catch (e) {
    next(e);
  }
};

export const deleteDeck = async (req, res, next) => {
  try {
    const result = await vesselService.deleteDeck(req.params.id);
    res.status(200).json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
};

// --- Section ---
export const addSection = async (req, res, next) => {
  try {
    const newSection = await vesselService.addSection(req.body);
    res.status(201).json({ ok: true, data: newSection });
  } catch (e) {
    next(e);
  }
};

export const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedSection = await vesselService.updateSection(id, req.body);
    res.status(200).json({ ok: true, data: updatedSection });
  } catch (e) {
    next(e);
  }
};

export const deleteSection = async (req, res, next) => {
  try {
    const result = await vesselService.deleteSection(req.params.id);
    res.status(200).json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
};

// --- Row ---
export const addRow = async (req, res, next) => {
  try {
    const newRow = await vesselService.addRow(req.body);
    res.status(201).json({ ok: true, data: newRow });
  } catch (e) {
    next(e);
  }
};

export const updateRow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedRow = await vesselService.updateRow(id, req.body);
    res.status(200).json({ ok: true, data: updatedRow });
  } catch (e) {
    next(e);
  }
};

export const deleteRow = async (req, res, next) => {
  try {
    const result = await vesselService.deleteRow(req.params.id);
    res.status(200).json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
};

// --- Seat ---
export const addSeat = async (req, res, next) => {
  try {
    const newSeat = await vesselService.addSeat(req.body);
    res.status(201).json({ ok: true, data: newSeat });
  } catch (e) {
    next(e);
  }
};

export const updateSeat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedSeat = await vesselService.updateSeat(id, req.body);
    res.status(200).json({ ok: true, data: updatedSeat });
  } catch (e) {
    next(e);
  }
};

export const deleteSeat = async (req, res, next) => {
  try {
    const result = await vesselService.deleteSeat(req.params.id);
    res.status(200).json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
};

// --- Cập nhật giá cho Khoang ---
export const updatePriceForSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adult_price, child_price } = req.body;

    if (adult_price === undefined || child_price === undefined) {
      const err = new Error('Vui lòng cung cấp adult_price và child_price');
      err.status = 400;
      throw err;
    }

    const result = await vesselService.updatePriceForSection(id, { adult_price, child_price });
    res.status(200).json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
};