import jwt from 'jsonwebtoken';
import Donor from '../models/donor.model.js';

export const authenticateToken = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const donor = await Donor.findById(decoded.id).select('-password');
    if (!donor) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = donor;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const protect = authenticateToken; 