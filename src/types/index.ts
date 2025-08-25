export interface Room {
  _id: string;
  number: string;
  floor: string;
  type: 'single' | 'shared';
  capacity: number;
  currentOccupancy: number;
  rent: number;
  amenities: string[];
  status: 'available' | 'occupied' | 'maintenance';
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  _id: string;
  name: string;
  email: string;
  phone: string;
  roomId: string;
  joinDate: Date;
  rent: number;
  deposit: number;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  documents: {
    idProof: string;
    photo: string;
  };
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface RentPayment {
  _id: string;
  tenantId: string;
  roomId: string;
  month: string; // Format: "2024-01" (YYYY-MM)
  year: number;
  monthName: string; // "January", "February", etc.
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod?: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  transactionId?: string;
  lateFee?: number;
  discount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RentSummary {
  totalRent: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  totalTenants: number;
  paidTenants: number;
  pendingTenants: number;
  overdueTenants: number;
}

export interface Booking {
  _id: string;
  name: string;
  email: string;
  phone: string;
  roomType: string;
  message: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}

export interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  totalTenants: number;
  monthlyRevenue: number;
  availableRooms: number;
  pendingBookings: number;
}