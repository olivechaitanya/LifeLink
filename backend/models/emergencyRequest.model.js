import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  requesterName: {
    type: String,
    required: true
  },
  requesterMobile: {
    type: String,
    required: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  units: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]  // Default coordinates
    },
    address: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'cancelled'],
    default: 'pending'
  },
  acceptedBy: [{
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor'
    },
    status: {
      type: String,
      enum: ['accepted', 'rejected'],
      required: true
    },
    acceptedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notifiedDonors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor'
  }]
}, {
  timestamps: true
});

// Create 2dsphere index for location-based queries
emergencyRequestSchema.index({ 'location': '2dsphere' });

const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);

export default EmergencyRequest; 