import express from 'express';
import {
  getDonorProfile,
  updateDonorProfile,
  markEligible,
  getDonationHistory,
  findNearbyDonors,
  updateLastDonation
} from '../controllers/donor.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Profile update validation
const updateProfileValidation = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
  body('mobileNumber').optional().matches(/^[0-9]{10}$/).withMessage('Invalid mobile number'),
  body('location.latitude').optional().isFloat().withMessage('Invalid latitude'),
  body('location.longitude').optional().isFloat().withMessage('Invalid longitude'),
  body('location.address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validate
];

// Nearby donors validation
const nearbyDonorsValidation = [
  body('latitude').isFloat().withMessage('Invalid latitude'),
  body('longitude').isFloat().withMessage('Invalid longitude'),
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('maxDistance').optional().isFloat({ min: 1, max: 50 }).withMessage('Distance must be between 1 and 50 km'),
  validate
];

// All donor routes are protected
router.use(protect);

// Donor profile routes
router.get('/profile', getDonorProfile);
router.put('/profile', updateProfileValidation, updateDonorProfile);

// Donation related routes
router.post('/eligible', markEligible);
router.get('/history', getDonationHistory);
router.post('/nearby', nearbyDonorsValidation, findNearbyDonors);

// Update last donation date
router.post('/update-last-donation', updateLastDonation);

export default router; 