import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  createEmergencyRequest,
  getEmergencyRequests,
  acceptEmergencyRequest,
  getDonorRequests,
  declineEmergencyRequest
} from '../controllers/emergency.controller.js';

const router = express.Router();

// Create emergency request
router.post('/request', authenticateToken, createEmergencyRequest);

// Get all emergency requests (for admin)
router.get('/requests', authenticateToken, getEmergencyRequests);

// Get requests for a specific donor
router.get('/donor/requests', authenticateToken, getDonorRequests);

// Accept emergency request
router.post('/request/:requestId/accept', authenticateToken, acceptEmergencyRequest);

// Decline emergency request
router.post('/request/:requestId/decline', authenticateToken, declineEmergencyRequest);

export default router; 