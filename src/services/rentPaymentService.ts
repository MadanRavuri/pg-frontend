// Removed: This file contained backend logic and should not be in the frontend repo.
import { RentPayment, IRentPayment } from '../models/RentPayment';
import { Tenant } from '../models/Tenant';
import { Room } from '../models/Room';
import { format, parseISO } from 'date-fns';

export class RentPaymentService {
  private static calculateStatus(amount: number, paidAmount: number, dueDate: Date): IRentPayment['status'] {
    if (paidAmount >= amount && paidAmount > 0) {
      return 'paid';
    } else if (paidAmount > 0 && paidAmount < amount) {
      return 'partial';
    } else {
      const now = new Date();
      return now > dueDate ? 'overdue' : 'pending';
    }
  }

  static async getAllRentPayments(filters?: {
    status?: string;
    wing?: string;
    month?: string;
    search?: string;
  }) {
    try {
      let query: any = {};

      if (filters?.status && filters.status !== 'all') {
        query.status = filters.status;
      }

      if (filters?.wing && filters.wing !== 'all') {
        query.wing = filters.wing;
      }

      if (filters?.month) {
        query.month = filters.month;
      }

      if (filters?.search) {
        const tenants = await Tenant.find({
          $or: [
            { name: { $regex: filters.search, $options: 'i' } },
            { email: { $regex: filters.search, $options: 'i' } }
          ]
        });
        const tenantIds = tenants.map(t => t._id);
        query.tenantId = { $in: tenantIds };
      }

      const payments = await RentPayment.find(query)
        .populate('tenantId', 'name email phone')
        .populate('roomId', 'roomNumber floor wing')
        .sort({ month: -1, createdAt: -1 });

      return { success: true, data: payments };
    } catch (error) {
      console.error('Error fetching rent payments:', error);
      return { success: false, error: 'Failed to fetch rent payments' };
    }
  }

  static async getRentPaymentById(id: string) {
    try {
      const payment = await RentPayment.findById(id)
        .populate('tenantId', 'name email phone emergencyContact')
        .populate('roomId', 'roomNumber floor wing type');
      
      if (!payment) {
        return { success: false, error: 'Rent payment not found' };
      }

      return { success: true, data: payment };
    } catch (error) {
      console.error('Error fetching rent payment:', error);
      return { success: false, error: 'Failed to fetch rent payment' };
    }
  }

  static async createRentPayment(paymentData: Partial<IRentPayment>) {
    try {
      const existingPayment = await RentPayment.findOne({
        tenantId: paymentData.tenantId,
        month: paymentData.month
      });

      if (existingPayment) {
        return { success: false, error: 'Payment already exists for this tenant and month' };
      }

      const tenant = await Tenant.findById(paymentData.tenantId);
      if (!tenant) {
        return { success: false, error: 'Tenant not found' };
      }

      const paidAmount = paymentData.paidAmount ?? 0;
      const amount = paymentData.amount ?? tenant.rent ?? 0;
      const dueDate = paymentData.dueDate ?? new Date(`${paymentData.month}-05`);
      const status = this.calculateStatus(amount, paidAmount, dueDate);

      const payment = new RentPayment({
        ...paymentData,
        paidAmount,
        amount,
        status,
        wing: tenant.wing,
      });

      await payment.save();

      const populatedPayment = await RentPayment.findById(payment._id)
        .populate('tenantId', 'name email phone')
        .populate('roomId', 'roomNumber floor wing');

      return { success: true, data: populatedPayment };
    } catch (error) {
      console.error('Error creating rent payment:', error);
      return { success: false, error: 'Failed to create rent payment' };
    }
  }

  static async updateRentPayment(id: string, updateData: Partial<IRentPayment>) {
    try {
      const existingPayment = await RentPayment.findById(id);
      if (!existingPayment) {
        return { success: false, error: 'Rent payment not found' };
      }

      const amount = updateData.amount ?? existingPayment.amount;
      const paidAmount = updateData.paidAmount ?? existingPayment.paidAmount ?? 0;
      const dueDate = updateData.dueDate ?? existingPayment.dueDate;
      const status = this.calculateStatus(amount, paidAmount, dueDate);

      const payment = await RentPayment.findByIdAndUpdate(
        id,
        { ...updateData, amount, paidAmount, status },
        { new: true, runValidators: true }
      )
        .populate('tenantId', 'name email phone')
        .populate('roomId', 'roomNumber floor wing');

      if (!payment) {
        return { success: false, error: 'Rent payment not found' };
      }

      return { success: true, data: payment };
    } catch (error) {
      console.error('Error updating rent payment:', error);
      return { success: false, error: 'Failed to update rent payment' };
    }
  }

  static async markAsPaid(id: string, paymentDetails: {
    paymentMethod: string;
    transactionId?: string;
    paidDate?: Date;
    notes?: string;
    paidAmount?: number;
  }) {
    try {
      const existingPayment = await RentPayment.findById(id);
      if (!existingPayment) {
        return { success: false, error: 'Rent payment not found' };
      }

      const amount = existingPayment.amount;
      const paidAmount = paymentDetails.paidAmount ?? amount;
      const status = this.calculateStatus(amount, paidAmount, existingPayment.dueDate);

      const updateData = {
        status,
        paidDate: paymentDetails.paidDate || new Date(),
        paymentMethod: paymentDetails.paymentMethod,
        transactionId: paymentDetails.transactionId,
        notes: paymentDetails.notes,
        paidAmount,
      };

      const payment = await RentPayment.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('tenantId', 'name email phone')
        .populate('roomId', 'roomNumber floor wing');

      if (!payment) {
        return { success: false, error: 'Rent payment not found' };
      }

      return { success: true, data: payment };
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      return { success: false, error: 'Failed to mark payment as paid' };
    }
  }

  static async deleteRentPayment(id: string) {
    try {
      const payment = await RentPayment.findById(id);
      if (!payment) {
        return { success: false, error: 'Rent payment not found' };
      }

      await RentPayment.findByIdAndDelete(id);
      return { success: true, message: 'Rent payment deleted successfully' };
    } catch (error) {
      console.error('Error deleting rent payment:', error);
      return { success: false, error: 'Failed to delete rent payment' };
    }
  }

  static async getRentPaymentStats(month?: string) {
    try {
      let query: any = {};
      if (month) {
        query.month = month;
      }

      const total = await RentPayment.countDocuments(query);
      const paid = await RentPayment.countDocuments({ ...query, status: 'paid' });
      const pending = await RentPayment.countDocuments({ ...query, status: 'pending' });
      const overdue = await RentPayment.countDocuments({ ...query, status: 'overdue' });
      const partial = await RentPayment.countDocuments({ ...query, status: 'partial' });

      const totalAmount = await RentPayment.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const collectedAmount = await RentPayment.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
      ]);

      const pendingAmount = await RentPayment.aggregate([
        { $match: { ...query, status: { $in: ['pending', 'partial'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } }
      ]);

      const overdueAmount = await RentPayment.aggregate([
        { $match: { ...query, status: 'overdue' } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } }
      ]);

      return {
        success: true,
        data: {
          total,
          paid,
          pending,
          overdue,
          partial,
          totalAmount: totalAmount[0]?.total || 0,
          collectedAmount: collectedAmount[0]?.total || 0,
          pendingAmount: pendingAmount[0]?.total || 0,
          overdueAmount: overdueAmount[0]?.total || 0,
          collectionRate: totalAmount[0]?.total > 0 
            ? Math.round((collectedAmount[0]?.total || 0) / totalAmount[0].total * 100) 
            : 0
        }
      };
    } catch (error) {
      console.error('Error fetching rent payment stats:', error);
      return { success: false, error: 'Failed to fetch rent payment statistics' };
    }
  }

  static async generateMonthlyPayments(month: string, year: number) {
    try {
      const activeTenants = await Tenant.find({ status: 'active' })
        .populate('roomId', 'roomNumber floor wing');

      const payments = [];
      const monthName = format(parseISO(`${year}-${month}-01`), 'MMMM');

      for (const tenant of activeTenants) {
        const existingPayment = await RentPayment.findOne({
          tenantId: tenant._id,
          month: `${year}-${month}`
        });

        if (!existingPayment) {
          const dueDate = new Date(year, parseInt(month) - 1, 5);

          const payment = new RentPayment({
            tenantId: tenant._id,
            roomId: tenant.roomId,
            month: `${year}-${month}`,
            year,
            monthName,
            amount: tenant.rent,
            paidAmount: 0,
            dueDate,
            status: 'pending',
            wing: tenant.wing
          });

          payments.push(payment);
        }
      }

      if (payments.length > 0) {
        await RentPayment.insertMany(payments);
      }

      return { 
        success: true, 
        message: `Generated ${payments.length} new rent payments for ${monthName} ${year}`,
        count: payments.length
      };
    } catch (error) {
      console.error('Error generating monthly payments:', error);
      return { success: false, error: 'Failed to generate monthly payments' };
    }
  }
}