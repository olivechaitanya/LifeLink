import Donor from '../models/donor.model.js';
import DonorList from '../models/donorList.model.js';
import jwt from 'jsonwebtoken';
import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();
export const markEligible = (req, res) => {
    // your logic here
  };
  
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Register donor
export const registerDonor = async (req, res) => {
  try {
    const {
      fullName,
      age,
      gender,
      bloodGroup,
      mobileNumber,
      email,
      password,
      location
    } = req.body;

    // Validate location
    if (
      !location ||
      typeof location.latitude !== 'number' ||
      typeof location.longitude !== 'number' ||
      isNaN(location.latitude) ||
      isNaN(location.longitude)
    ) {
      return res.status(400).json({ message: 'Location with valid latitude and longitude is required.' });
    }

    // Check if donor already exists
    const donorExists = await Donor.findOne({ $or: [{ email }, { mobileNumber }] });
    if (donorExists) {
      return res.status(400).json({ message: 'Donor already exists' });
    }

    // Create donor
    const donor = await Donor.create({
      fullName,
      age,
      gender,
      bloodGroup,
      mobileNumber,
      email,
      password,
      location: {
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude
      },
      isEligible: true, // New donors are eligible by default
      isInDonorList: false // Not in donor list until they confirm eligibility
    });

    if (donor) {
      res.status(201).json({
        _id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
        isEligible: donor.isEligible,
        isInDonorList: donor.isInDonorList,
        token: generateToken(donor._id)
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login donor
export const loginDonor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const donor = await Donor.findOne({ email });
    if (!donor) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await donor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token with donor ID
    const token = generateToken(donor._id);

    res.json({
      _id: donor._id,
      fullName: donor.fullName,
      email: donor.email,
      mobileNumber: donor.mobileNumber,
      bloodGroup: donor.bloodGroup,
      age: donor.age,
      gender: donor.gender,
      location: donor.location,
      isEligible: donor.isEligible,
      isInDonorList: donor.isInDonorList,
      lastDonation: donor.lastDonation,
      donationHistory: donor.donationHistory,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update last donation date and check eligibility
export const updateLastDonation = async (req, res) => {
  try {
    const { months } = req.body;
    const donor = await Donor.findById(req.user.id);

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Validate location coordinates
    if (!donor.location || !donor.location.latitude || !donor.location.longitude) {
      return res.status(400).json({ 
        message: 'Location coordinates are required. Please update your profile with valid location coordinates.' 
      });
    }

    // Calculate last donation date based on months
    const lastDonation = new Date();
    lastDonation.setMonth(lastDonation.getMonth() - months);
    donor.lastDonation = lastDonation;

    // Check eligibility based on gender
    const isEligible = donor.checkEligibility();
    donor.isEligible = isEligible;
    donor.isInDonorList = isEligible; // Synchronize isInDonorList with isEligible

    // If eligible, add to donor list
    if (isEligible) {
      // Check if donor already exists in donor list
      const existingDonor = await DonorList.findOne({ donorId: donor._id });
      
      if (!existingDonor) {
        // Create new donor list entry
        const donorListEntry = new DonorList({
          donorId: donor._id,
          fullName: donor.fullName,
          bloodGroup: donor.bloodGroup,
          location: {
            type: 'Point',
            coordinates: [
              parseFloat(donor.location.longitude),
              parseFloat(donor.location.latitude)
            ],
            address: donor.location.address
          },
          lastDonation: donor.lastDonation,
          isAvailable: true
        });

        await donorListEntry.save();
      }
    } else {
      // If not eligible, remove from donor list if exists
      await DonorList.findOneAndDelete({ donorId: donor._id });
    }

    await donor.save();

    res.json({
      message: isEligible ? 'You are eligible to donate and have been added to the donor list!' : 'You are not eligible to donate at this time.',
      donor: {
        ...donor.toObject(),
        password: undefined
      }
    });
  } catch (error) {
    console.error('Error updating last donation:', error);
    res.status(500).json({ message: 'Failed to update last donation date' });
  }
};

// Get donor profile
export const getDonorProfile = async (req, res) => {
  try {
    // Check if user ID exists in request
    if (!req.user || !req.user.id) {
      console.error('No user ID in request:', req.user);
      return res.status(401).json({ message: 'Unauthorized - No user ID' });
    }

    console.log('Fetching profile for user ID:', req.user.id);

    const donor = await Donor.findById(req.user.id).select('-password');
    if (!donor) {
      console.error('Donor not found for ID:', req.user.id);
      return res.status(404).json({ message: 'Donor not found' });
    }

    console.log('Donor profile found:', {
      id: donor._id,
      name: donor.fullName,
      email: donor.email
    });

    res.json({
      _id: donor._id,
      fullName: donor.fullName,
      email: donor.email,
      mobileNumber: donor.mobileNumber,
      bloodGroup: donor.bloodGroup,
      age: donor.age,
      gender: donor.gender,
      location: donor.location,
      isEligible: donor.isEligible,
      isInDonorList: donor.isInDonorList,
      lastDonation: donor.lastDonation,
      donationHistory: donor.donationHistory
    });
  } catch (error) {
    console.error('Error fetching donor profile:', error);
    res.status(500).json({ 
      message: 'Failed to fetch donor profile',
      error: error.message 
    });
  }
};

// Update donor profile
export const updateDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findById(req.user._id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    donor.fullName = req.body.fullName || donor.fullName;
    donor.email = req.body.email || donor.email;
    donor.mobileNumber = req.body.mobileNumber || donor.mobileNumber;
    donor.location = req.body.location || donor.location;

    if (req.body.password) {
      donor.password = req.body.password;
    }

    const updatedDonor = await donor.save();
    res.json({
      _id: updatedDonor._id,
      fullName: updatedDonor.fullName,
      email: updatedDonor.email,
      bloodGroup: updatedDonor.bloodGroup,
      isEligible: updatedDonor.isEligible,
      isInDonorList: updatedDonor.isInDonorList,
      token: generateToken(updatedDonor._id)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get donation history
export const getDonationHistory = async (req, res) => {
  try {
    const donor = await Donor.findById(req.user._id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    res.json(donor.donationHistory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Find nearby eligible donors
export const findNearbyDonors = async (req, res) => {
  try {
    const { latitude, longitude, bloodGroup, maxDistance = 5 } = req.body;

    // Find eligible donors within radius
    const donors = await DonorList.find({
      isAvailable: true,
      bloodGroup,
      'location.coordinates': {
        $geoWithin: {
          $centerSphere: [
            [longitude, latitude],
            maxDistance / 3963.2 // Convert miles to radians
          ]
        }
      }
    }).select('-__v');

    // Send SMS to eligible donors
    for (const donor of donors) {
      try {
        await client.messages.create({
          body: 'Urgent blood requirement. Please login to your LifeLink portal to confirm availability.',
          to: donor.mobileNumber,
          from: process.env.TWILIO_PHONE_NUMBER
        });
      } catch (error) {
        console.error('Error sending SMS:', error);
      }
    }

    res.json(donors);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 