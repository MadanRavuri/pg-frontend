import mongoose, { Document, Schema } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  email: string;
  phone: string;
  roomId: mongoose.Types.ObjectId;
  rent: number;
  deposit: number;
  status: 'active' | 'inactive' | 'pending';
  joinDate: Date;
  leaveDate?: Date;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  documents: {
    aadhar?: string;
    pan?: string;
    agreement?: string;
  };
  wing: 'A' | 'B';
  floor: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  rent: {
    type: Number,
    required: true,
    min: 0
  },
  deposit: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  joinDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  leaveDate: {
    type: Date
  },
  emergencyContact: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    relation: {
      type: String,
      required: true,
      trim: true
    }
  },
  documents: {
    aadhar: String,
    pan: String,
    agreement: String
  },
  wing: {
    type: String,
    enum: ['A', 'B'],
    required: true
  },
  floor: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema); 