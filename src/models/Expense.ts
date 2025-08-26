
import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  date: Date;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  vendor?: string;
  status: 'paid' | 'pending' | 'approved';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  receipt?: string;
  notes?: string;
  wing?: 'A' | 'B' | 'common';
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>({
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque'],
    required: true
  },
  vendor: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'approved'],
    default: 'paid'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  receipt: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  wing: {
    type: String,
    enum: ['A', 'B', 'common'],
    default: 'common'
  }
}, {
  timestamps: true
});

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
