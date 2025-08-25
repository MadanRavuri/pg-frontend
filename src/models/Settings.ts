import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  pgName: string;
  address: string;
  contactNumber: string;
  email: string;
  gstNumber: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  rentDueDate: number;
  lateFeePercentage: number;
  maintenanceFee: number;
  amenities: string[];
  policies: string[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>({
  pgName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  gstNumber: {
    type: String,
    required: true,
    trim: true
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: true,
      trim: true
    },
    ifscCode: {
      type: String,
      required: true,
      trim: true
    },
    bankName: {
      type: String,
      required: true,
      trim: true
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true
    }
  },
  rentDueDate: {
    type: Number,
    required: true,
    min: 1,
    max: 31,
    default: 5
  },
  lateFeePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 5
  },
  maintenanceFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  amenities: [{
    type: String,
    trim: true
  }],
  policies: [{
    type: String,
    trim: true
  }],
  theme: {
    primaryColor: {
      type: String,
      required: true,
      default: '#fbbf24'
    },
    secondaryColor: {
      type: String,
      required: true,
      default: '#92400e'
    }
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema); 