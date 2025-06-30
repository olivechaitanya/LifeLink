import EmergencyRequest from '../models/emergencyRequest.model.js';
import Donor from '../models/donor.model.js';
import DonorList from '../models/donorList.model.js';
import { sendSMS } from '../utils/fast2sms.js';

export const createEmergencyRequest = async (req, res) => {
  try {
    const { bloodGroup, units, location, fullName, mobileNumber } = req.body;
    const requesterId = req.user.id;

    console.log('Creating emergency request with data:', {
      bloodGroup,
      units,
      location,
      fullName,
      mobileNumber,
      requesterId
    });

    // Validate required fields
    if (!bloodGroup || !units || !location || !location.address || !fullName || !mobileNumber) {
      return res.status(400).json({
        message: 'Missing required fields',
        details: {
          bloodGroup: !bloodGroup ? 'Blood group is required' : null,
          units: !units ? 'Units are required' : null,
          location: !location ? 'Location is required' : null,
          address: !location?.address ? 'Address is required' : null,
          fullName: !fullName ? 'Full name is required' : null,
          mobileNumber: !mobileNumber ? 'Mobile number is required' : null
        }
      });
    }

    // Create the emergency request
    const emergencyRequest = new EmergencyRequest({
      requesterId,
      bloodGroup,
      units,
      location: {
        type: 'Point',
        coordinates: [0, 0],
        address: location.address
      },
      requesterName: fullName,
      requesterMobile: mobileNumber
    });

    console.log('Saving emergency request...');
    await emergencyRequest.save();
    console.log('Emergency request saved successfully');

    // Find eligible donors from donor list with matching blood group
    console.log('Finding eligible donors from donor list with blood group:', bloodGroup);
    const eligibleDonors = await DonorList.find({
      bloodGroup,
      isAvailable: true
    }).populate('donorId', 'fullName mobileNumber location');

    console.log(`Found ${eligibleDonors.length} eligible donors in donor list`);

    // Filter donors based on address matching
    const requestAddress = location.address.toLowerCase().trim();
    console.log('Request address to match:', requestAddress);

    const nearbyDonors = eligibleDonors.filter(donor => {
      if (!donor.donorId || !donor.donorId.location || !donor.donorId.location.address) {
        console.log(`Donor ${donor._id} has no address in profile`);
        return false;
      }
      
      const donorAddress = donor.donorId.location.address.toLowerCase().trim();
      console.log(`Comparing addresses for donor ${donor.fullName}:`);
      console.log(`- Request address: "${requestAddress}"`);
      console.log(`- Donor address: "${donorAddress}"`);
      
      // Check for exact match or if one address contains the other
      const isMatch = donorAddress === requestAddress || 
                     donorAddress.includes(requestAddress) || 
                     requestAddress.includes(donorAddress);
      
      console.log(`- Match result: ${isMatch}`);
      
      return isMatch;
    });

    console.log('Nearby donors after address matching:', nearbyDonors.map(donor => ({
      id: donor._id,
      name: donor.fullName,
      address: donor.donorId.location.address
    })));

    // Send SMS to eligible donors
    let smsSentCount = 0;
    for (const donor of nearbyDonors) {
      try {
        if (!donor.donorId.mobileNumber) {
          console.log(`Skipping donor ${donor.fullName} - no mobile number`);
          continue;
        }

        const message = `URGENT: Blood required at ${location.address}. Blood Group: ${bloodGroup}, Units: ${units}. Requester: ${fullName} (${mobileNumber}). Please login to your portal and accept/reject the request.`;
        
        console.log(`Attempting to send SMS to donor ${donor.fullName} at ${donor.donorId.mobileNumber}`);
        await sendSMS(
          donor.donorId.mobileNumber,
          message
        );
        
        emergencyRequest.notifiedDonors.push(donor.donorId._id);
        smsSentCount++;
        
        console.log(`SMS sent successfully to donor ${donor.fullName}`);
      } catch (error) {
        console.error(`Failed to send SMS to donor ${donor._id}:`, error.message);
      }
    }

    console.log(`SMS sending summary: ${smsSentCount} out of ${nearbyDonors.length} nearby donors notified`);

    await emergencyRequest.save();

    res.status(201).json({
      message: 'Emergency request created successfully',
      request: emergencyRequest,
      notifiedDonors: smsSentCount,
      totalEligibleDonors: eligibleDonors.length,
      nearbyDonors: nearbyDonors.length,
      matchingDetails: {
        requestAddress,
        matchedDonors: nearbyDonors.map(donor => ({
          id: donor._id,
          name: donor.fullName,
          address: donor.donorId.location.address
        }))
      }
    });
  } catch (error) {
    console.error('Error creating emergency request:', {
      message: error.message,
      stack: error.stack,
      details: error.response?.data || 'No additional details'
    });
    res.status(500).json({ 
      message: 'Failed to create emergency request',
      error: error.message
    });
  }
};

export const getEmergencyRequests = async (req, res) => {
  try {
    const requests = await EmergencyRequest.find()
      .populate('requesterId', 'fullName mobileNumber')
      .populate('acceptedBy.donorId', 'fullName mobileNumber bloodGroup')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching emergency requests:', error);
    res.status(500).json({ message: 'Failed to fetch emergency requests' });
  }
};

export const acceptEmergencyRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const donorId = req.user.id;

    const request = await EmergencyRequest.findById(requestId)
      .populate('requesterId', 'fullName mobileNumber email location')
      .populate('acceptedBy.donorId', 'fullName mobileNumber email bloodGroup location');

    if (!request) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request is no longer pending' });
    }

    // Check if donor has already accepted
    const alreadyAccepted = request.acceptedBy.some(
      acceptance => acceptance.donorId.toString() === donorId.toString()
    );

    if (alreadyAccepted) {
      return res.status(400).json({ message: 'You have already responded to this request' });
    }

    // Add donor to acceptedBy array
    request.acceptedBy.push({
      donorId,
      status: 'accepted',
      acceptedAt: new Date()
    });

    // Update request status if enough donors have accepted
    const totalAccepted = request.acceptedBy.filter(a => a.status === 'accepted').length;
    if (totalAccepted >= request.units) {
      request.status = 'accepted';
    }

    await request.save();

    // Get donor details
    const donor = await Donor.findById(donorId).select('-password');

    // Send SMS to requester about acceptance
    try {
      const message = `Your blood request has been accepted by ${donor.fullName} (${donor.mobileNumber}). Blood Group: ${donor.bloodGroup}. Please contact them immediately.`;
      await sendSMS(request.requesterMobile, message);
    } catch (error) {
      console.error('Error sending SMS to requester:', error);
    }

    // Send SMS to donor with requester details
    try {
      const message = `You have accepted a blood request from ${request.requesterName} (${request.requesterMobile}). Location: ${request.location.address}. Please contact them immediately.`;
      await sendSMS(donor.mobileNumber, message);
    } catch (error) {
      console.error('Error sending SMS to donor:', error);
    }

    res.json({
      message: 'Request accepted successfully',
      request,
      requester: {
        name: request.requesterName,
        mobile: request.requesterMobile,
        location: request.location.address
      },
      donor: {
        name: donor.fullName,
        mobile: donor.mobileNumber,
        bloodGroup: donor.bloodGroup,
        location: donor.location.address
      }
    });
  } catch (error) {
    console.error('Error accepting emergency request:', error);
    res.status(500).json({ message: 'Failed to accept emergency request' });
  }
};

export const getDonorRequests = async (req, res) => {
  try {
    const donorId = req.user.id;

    // Find requests where donor is in notifiedDonors array
    const requests = await EmergencyRequest.find({
      notifiedDonors: donorId,
      status: 'pending'
    })
    .populate('requesterId', 'fullName mobileNumber')
    .sort({ createdAt: -1 });

    // Format the response to include requester details
    const formattedRequests = requests.map(request => ({
      _id: request._id,
      bloodGroup: request.bloodGroup,
      units: request.units,
      location: request.location,
      status: request.status,
      createdAt: request.createdAt,
      requester: {
        name: request.requesterName,
        mobile: request.requesterMobile,
        location: request.location.address
      }
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching donor requests:', error);
    res.status(500).json({ message: 'Failed to fetch donor requests' });
  }
};

export const declineEmergencyRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const donorId = req.user.id;

    const request = await EmergencyRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request is no longer pending' });
    }

    // Check if donor has already responded
    const alreadyResponded = request.acceptedBy.some(
      acceptance => acceptance.donorId.toString() === donorId.toString()
    );

    if (alreadyResponded) {
      return res.status(400).json({ message: 'You have already responded to this request' });
    }

    // Add donor to acceptedBy array with declined status
    request.acceptedBy.push({
      donorId,
      status: 'rejected',
      acceptedAt: new Date()
    });

    await request.save();

    res.json({
      message: 'Request declined successfully',
      request
    });
  } catch (error) {
    console.error('Error declining emergency request:', error);
    res.status(500).json({ message: 'Failed to decline emergency request' });
  }
}; 