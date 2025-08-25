import mongoose, { Document, Schema } from 'mongoose';

export interface IRentPayment extends Document {
  tenantId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  month: string; // Format: YYYY-MM
  year: number;
  monthName: string;
  amount: number;
  paidAmount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paymentMethod?: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  transactionId?: string;
  lateFee?: number;
  discount?: number;
  notes?: string;
  wing: 'A' | 'B';
  createdAt: Date;
  updatedAt: Date;
}

const rentPaymentSchema = new Schema<IRentPayment>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  month: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/ // YYYY-MM format
  },
  year: {
    type: Number,
    required: true
  },
  monthName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue', 'partial'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque']
  },
  transactionId: {
    type: String,
    trim: true
  },
  lateFee: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  wing: {
    type: String,
    enum: ['A', 'B'],
    required: true
  }
}, {
  timestamps: true
});

// Compound index for tenant and month to prevent duplicate payments
rentPaymentSchema.index({ tenantId: 1, month: 1 }, { unique: true });

export const RentPayment = mongoose.model<IRentPayment>('RentPayment', rentPaymentSchema);