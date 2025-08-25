import { apiService } from './apiService';

export class RoomService {
  // Get all rooms with optional filtering
  static async getAllRooms(filters?: {
    status?: string;
    wing?: string;
    floor?: number;
    search?: string;
  }) {
    try {
      const response = await apiService.getRooms();
      
      if (!response.success) {
        return { success: false, error: 'Failed to fetch rooms' };
      }

      let rooms = response.data;

      // Apply client-side filtering
      if (filters?.status && filters.status !== 'all') {
        rooms = rooms.filter((room: any) => room.status === filters.status);
      }

      if (filters?.wing && filters.wing !== 'all') {
        rooms = rooms.filter((room: any) => room.wing === filters.wing);
      }

      if (filters?.floor) {
        rooms = rooms.filter((room: any) => room.floor === filters.floor);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        rooms = rooms.filter((room: any) => 
          room.roomNumber.toLowerCase().includes(searchLower) ||
          room.description?.toLowerCase().includes(searchLower)
        );
      }

      return { success: true, data: rooms };
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return { success: false, error: 'Failed to fetch rooms' };
    }
  }

  // Get room by ID
  static async getRoomById(id: string) {
    try {
      const response = await apiService.getRooms();
      
      if (!response.success) {
        return { success: false, error: 'Failed to fetch rooms' };
      }

      const room = response.data.find((r: any) => r._id === id);
      
      if (!room) {
        return { success: false, error: 'Room not found' };
      }

      return { success: true, data: room };
    } catch (error) {
      console.error('Error fetching room:', error);
      return { success: false, error: 'Failed to fetch room' };
    }
  }

  // Create new room
  static async createRoom(roomData: any) {
    try {
      const response = await apiService.createRoom(roomData);
      
      if (!response.success) {
        return { success: false, error: 'Failed to create room' };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating room:', error);
      return { success: false, error: 'Failed to create room' };
    }
  }

  // Update room
  static async updateRoom(id: string, updateData: any) {
    try {
      // For now, we'll need to implement this in the backend
      // For simplicity, we'll return an error
      return { success: false, error: 'Update functionality not implemented yet' };
    } catch (error) {
      console.error('Error updating room:', error);
      return { success: false, error: 'Failed to update room' };
    }
  }

  // Delete room
  static async deleteRoom(id: string) {
    try {
      // For now, we'll need to implement this in the backend
      // For simplicity, we'll return an error
      return { success: false, error: 'Delete functionality not implemented yet' };
    } catch (error) {
      console.error('Error deleting room:', error);
      return { success: false, error: 'Failed to delete room' };
    }
  }

  // Get room statistics
  static async getRoomStats() {
    try {
      const response = await apiService.getRooms();
      
      if (!response.success) {
        return { success: false, error: 'Failed to fetch room statistics' };
      }

      const rooms = response.data;
      const total = rooms.length;
      const available = rooms.filter((r: any) => r.status === 'available').length;
      const occupied = rooms.filter((r: any) => r.status === 'occupied').length;
      const maintenance = rooms.filter((r: any) => r.status === 'maintenance').length;

      // Calculate wing stats
      const wingStats = rooms.reduce((acc: any, room: any) => {
        if (!acc[room.wing]) {
          acc[room.wing] = { total: 0, available: 0, occupied: 0, maintenance: 0 };
        }
        acc[room.wing].total++;
        acc[room.wing][room.status]++;
        return acc;
      }, {});

      // Calculate floor stats
      const floorStats = rooms.reduce((acc: any, room: any) => {
        if (!acc[room.floor]) {
          acc[room.floor] = { total: 0, available: 0, occupied: 0 };
        }
        acc[room.floor].total++;
        acc[room.floor][room.status]++;
        return acc;
      }, {});

      return {
        success: true,
        data: {
          total,
          available,
          occupied,
          maintenance,
          occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
          wingStats: Object.entries(wingStats).map(([wing, stats]: [string, any]) => ({ _id: wing, ...stats })),
          floorStats: Object.entries(floorStats).map(([floor, stats]: [string, any]) => ({ _id: parseInt(floor), ...stats }))
        }
      };
    } catch (error) {
      console.error('Error fetching room stats:', error);
      return { success: false, error: 'Failed to fetch room statistics' };
    }
  }

  // Get available rooms for tenant assignment
  static async getAvailableRooms() {
    try {
      const response = await apiService.getRooms();
      
      if (!response.success) {
        return { success: false, error: 'Failed to fetch available rooms' };
      }

      const availableRooms = response.data
        .filter((room: any) => room.status === 'available')
        .map((room: any) => ({
          _id: room._id,
          roomNumber: room.roomNumber,
          floor: room.floor,
          wing: room.wing,
          type: room.type,
          rent: room.rent
        }))
        .sort((a: any, b: any) => a.roomNumber.localeCompare(b.roomNumber));

      return { success: true, data: availableRooms };
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      return { success: false, error: 'Failed to fetch available rooms' };
    }
  }
} 