import { Tenant, ITenant } from '../models/Tenant';
import { Room } from '../models/Room';
import mongoose from 'mongoose';

export class TenantService {
  // Get all tenants with optional filtering
  static async getAllTenants(filters?: {
    status?: string;
    wing?: string;
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

      if (filters?.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
          { phone: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const tenants = await Tenant.find(query)
        .populate('roomId', 'roomNumber floor wing')
        .sort({ createdAt: -1 });

      return { success: true, data: tenants };
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return { success: false, error: 'Failed to fetch tenants' };
    }
  }

  // Get tenant by ID
  static async getTenantById(id: string) {
    try {
      const tenant = await Tenant.findById(id)
        .populate('roomId', 'roomNumber floor wing type amenities');
      
      if (!tenant) {
        return { success: false, error: 'Tenant not found' };
      }

      return { success: true, data: tenant };
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return { success: false, error: 'Failed to fetch tenant' };
    }
  }

  // Create new tenant
  static async createTenant(tenantData: Partial<ITenant>) {
    try {
      // Check if room is available
      const room = await Room.findById(tenantData.roomId);
      if (!room) {
        return { success: false, error: 'Room not found' };
      }

      if (room.status !== 'available') {
        return { success: false, error: 'Room is not available' };
      }

      // Create tenant
      const tenant = new Tenant(tenantData);
      await tenant.save();

      // Update room status to occupied
      await Room.findByIdAndUpdate(tenantData.roomId, {
        status: 'occupied',
        tenantId: tenant._id
      });

      return { success: true, data: tenant };
    } catch (error) {
      console.error('Error creating tenant:', error);
      return { success: false, error: 'Failed to create tenant' };
    }
  }

  // Update tenant
  static async updateTenant(id: string, updateData: Partial<ITenant>) {
    try {
      const tenant = await Tenant.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('roomId', 'roomNumber floor wing');

      if (!tenant) {
        return { success: false, error: 'Tenant not found' };
      }

      // If tenant status is being updated to inactive, make the room available
      if (updateData.status === 'inactive' && tenant.roomId) {
        await Room.findByIdAndUpdate(tenant.roomId, { 
          status: 'available', 
          tenantId: null 
        });
      }
      // If tenant status is being updated to active and room is available, make it occupied
      else if (updateData.status === 'active' && tenant.roomId) {
        const room = await Room.findById(tenant.roomId);
        if (room && room.status === 'available') {
          await Room.findByIdAndUpdate(tenant.roomId, { 
            status: 'occupied', 
            tenantId: tenant._id 
          });
        }
      }

      return { success: true, data: tenant };
    } catch (error) {
      console.error('Error updating tenant:', error);
      return { success: false, error: 'Failed to update tenant' };
    }
  }

  // Delete tenant
  static async deleteTenant(id: string) {
    try {
      const tenant = await Tenant.findById(id);
      if (!tenant) {
        return { success: false, error: 'Tenant not found' };
      }

      // Update room status to available
      await Room.findByIdAndUpdate(tenant.roomId, {
        status: 'available',
        tenantId: null
      });

      await Tenant.findByIdAndDelete(id);
      return { success: true, message: 'Tenant deleted successfully' };
    } catch (error) {
      console.error('Error deleting tenant:', error);
      return { success: false, error: 'Failed to delete tenant' };
    }
  }

  // Get tenant statistics
  static async getTenantStats() {
    try {
      const stats = await Tenant.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const total = await Tenant.countDocuments();
      const active = await Tenant.countDocuments({ status: 'active' });
      const inactive = await Tenant.countDocuments({ status: 'inactive' });
      const pending = await Tenant.countDocuments({ status: 'pending' });

      return {
        success: true,
        data: {
          total,
          active,
          inactive,
          pending,
          stats
        }
      };
    } catch (error) {
      console.error('Error fetching tenant stats:', error);
      return { success: false, error: 'Failed to fetch tenant statistics' };
    }
  }
// Removed: This file contained backend logic and should not be in the frontend repo.