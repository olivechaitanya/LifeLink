import DonorList from '../models/donorList.model.js';
import Donor from '../models/donor.model.js';

// Add donor to the list
export const addToDonorList = async (req, res) => {
  try {
    const { donorId, bloodGroup, location, lastDonation } = req.body;

    // Check if donor already exists in the list
    const existingDonor = await DonorList.findOne({ donorId });
    if (existingDonor) {
      return res.status(400).json({ message: 'Donor already exists in the list' });
    }

    // Get donor details
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Create new donor list entry
    const donorListEntry = new DonorList({
      donorId,
      fullName: donor.fullName,
      bloodGroup,
      location,
      lastDonation,
      isAvailable: true
    });

    await donorListEntry.save();

    res.status(201).json({
      message: 'Donor added to the list successfully',
      donorListEntry
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding donor to list', error: error.message });
  }
};

// Remove donor from the list
export const removeFromDonorList = async (req, res) => {
  try {
    const { donorId } = req.params;

    const result = await DonorList.findOneAndDelete({ donorId });
    if (!result) {
      return res.status(404).json({ message: 'Donor not found in the list' });
    }

    res.json({ message: 'Donor removed from the list successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing donor from list', error: error.message });
  }
};

// Update donor availability
export const updateAvailability = async (req, res) => {
  try {
    const { donorId } = req.params;
    const { isAvailable } = req.body;

    const donor = await DonorList.findOneAndUpdate(
      { donorId },
      { isAvailable },
      { new: true }
    );

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found in the list' });
    }

    res.json({
      message: 'Donor availability updated successfully',
      donor
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating donor availability', error: error.message });
  }
};

// Get all available donors
export const getAvailableDonors = async (req, res) => {
  try {
    const donors = await DonorList.find({ isAvailable: true })
      .select('-__v')
      .sort({ addedAt: -1 });

    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available donors', error: error.message });
  }
};

// Get donors by blood group
export const getDonorsByBloodGroup = async (req, res) => {
  try {
    const { bloodGroup } = req.params;
    const donors = await DonorList.find({ 
      bloodGroup,
      isAvailable: true 
    }).select('-__v');

    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donors by blood group', error: error.message });
  }
};

// Get nearby donors
export const getNearbyDonors = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10, bloodGroup } = req.query;

    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(maxDistance) * 1000 // Convert km to meters
        }
      },
      isAvailable: true
    };

    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    const donors = await DonorList.find(query)
      .select('-__v')
      .limit(20);

    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching nearby donors', error: error.message });
  }
};

// Get all eligible donors
export const getAllDonors = async (req, res) => {
  try {
    const donors = await DonorList.find({ isAvailable: true })
      .select('-__v')
      .sort({ addedAt: -1 });

    res.json({
      count: donors.length,
      donors
    });
  } catch (error) {
    console.error('Error fetching donor list:', error);
    res.status(500).json({ message: 'Failed to fetch donor list' });
  }
};

// Get specific donor from list
export const getDonorById = async (req, res) => {
  try {
    const donor = await DonorList.findById(req.params.id)
      .select('-__v');

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found in list' });
    }

    res.json(donor);
  } catch (error) {
    console.error('Error fetching donor:', error);
    res.status(500).json({ message: 'Failed to fetch donor details' });
  }
};

// Update donor availability
export const updateDonorAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    const donor = await DonorList.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found in list' });
    }

    donor.isAvailable = isAvailable;
    await donor.save();

    // Update the main donor record as well
    await Donor.findByIdAndUpdate(donor.donorId, {
      isInDonorList: isAvailable
    });

    res.json({
      message: isAvailable ? 'Donor marked as available' : 'Donor marked as unavailable',
      donor
    });
  } catch (error) {
    console.error('Error updating donor availability:', error);
    res.status(500).json({ message: 'Failed to update donor availability' });
  }
};

// Remove donor from list
export const removeFromList = async (req, res) => {
  try {
    const donor = await DonorList.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found in list' });
    }

    // Update the main donor record
    await Donor.findByIdAndUpdate(donor.donorId, {
      isInDonorList: false
    });

    // Remove from donor list
    await donor.deleteOne();

    res.json({ message: 'Donor removed from list successfully' });
  } catch (error) {
    console.error('Error removing donor from list:', error);
    res.status(500).json({ message: 'Failed to remove donor from list' });
  }
}; 