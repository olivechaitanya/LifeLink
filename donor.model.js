import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const donorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 65
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  isEligible: {
    type: Boolean,
    default: false
  },
  lastDonation: {
    type: Date,
    default: null
  },
  isInDonorList: {
    type: Boolean,
    default: false
  },
  donationHistory: [{
    date: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['completed', 'cancelled', 'pending'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
donorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
donorSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check eligibility
donorSchema.methods.checkEligibility = function() {
  // Check age restrictions first
  if (this.age < 18 || this.age > 60) {
    return false;
  }

  // If no last donation, they are eligible
  if (!this.lastDonation) {
    return true;
  }

  const today = new Date();
  const lastDonationDate = new Date(this.lastDonation);
  const monthsSinceLastDonation = (today.getFullYear() - lastDonationDate.getFullYear()) * 12 + 
    (today.getMonth() - lastDonationDate.getMonth());

  // Check based on gender
  const minMonths = this.gender === 'Female' ? 4 : 3;
  return monthsSinceLastDonation >= minMonths;
};

const Donor = mongoose.model('Donor', donorSchema);

export default Donor; 