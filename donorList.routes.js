import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  getAllDonors,
  getDonorById,
  updateDonorAvailability,
  removeFromList
} from '../controllers/donorList.controller.js';

const router = express.Router();

// Protected routes
router.use(authenticateToken);

// Get all eligible donors
router.get('/', getAllDonors);

// Get specific donor from list
router.get('/:id', getDonorById);

// Update donor availability
router.put('/:id/availability', updateDonorAvailability);

// Remove donor from list
router.delete('/:id', removeFromList);

export default router; 