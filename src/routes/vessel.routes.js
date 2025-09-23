// src/routes/vessel.routes.js
import { Router } from 'express';
import {
  addDeck,
  addRow,
  addSeat,
  addSection,
  createVessel,
  deleteDeck,
  deleteRow,
  deleteSeat,
  deleteSection,
  deleteVessel,
  getVessel,
  getVessels,
  updateDeck,
  updatePriceForSection,
  updateRow,
  updateSeat,
  updateSection,
  updateVessel,
} from '../controllers/vessel.controller.js';
import { checkAdminRole, requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// PUBLIC ROUTES
router.get('/', getVessels);
router.get('/:id', getVessel);

// ADMIN ROUTES - Gắn middleware requireAuth và checkAdminRole
const adminAccess = [requireAuth, checkAdminRole];

// CRUD for Vessels
router.post('/', adminAccess, createVessel);
router.patch('/:id', adminAccess, updateVessel);
router.delete('/:id', adminAccess, deleteVessel);

// CRUD for Decks
router.post('/decks', adminAccess, addDeck);
router.patch('/decks/:id', adminAccess, updateDeck);
router.delete('/decks/:id', adminAccess, deleteDeck);

// CRUD for Sections
router.post('/sections', adminAccess, addSection);
router.patch('/sections/:id', adminAccess, updateSection);
router.delete('/sections/:id', adminAccess, deleteSection);

// CRUD for Rows
router.post('/rows', adminAccess, addRow);
router.patch('/rows/:id', adminAccess, updateRow);
router.delete('/rows/:id', adminAccess, deleteRow);

// CRUD for Seats
router.post('/seats', adminAccess, addSeat);
router.patch('/seats/:id', adminAccess, updateSeat);
router.delete('/seats/:id', adminAccess, deleteSeat);

router.patch('/sections/:id/update-price', adminAccess, updatePriceForSection);

export default router;
