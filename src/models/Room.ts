import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  roomNumber: string;
  floor: number;
  wing: 'A' | 'B';
  type: 'single' | 'double' | 'triple';
  rent: number;
  status: 'available' | 'occupied' | 'maintenance';
  amenities: string[];
  description?: string;
  tenantId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  floor: {
    type: Number,
    required: true,
    min: 1
  },
  wing: {
    type: String,
    enum: ['A', 'B'],
    required: true
  },
  type: {
    type: String,
    enum: ['single', 'double', 'triple'],
    required: true
  },
  rent: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available'
  },
  amenities: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant'
  }
}, {
  timestamps: true
});

export const Room = mongoose.model<IRoom>('Room', roomSchema); 