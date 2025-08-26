export class TenantService {
  // Get all tenants with optional filtering
  static async getAllTenants(filters?: {
    status?: string;
    wing?: string;
    search?: string;
  }) {
    try {
      let query: any = {};
      if (filters?.status && filters.status !== 'all') query.status = filters.status;
      if (filters?.wing && filters.wing !== 'all') query.wing = filters.wing;
      if (filters?.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
          { phone: { $regex: filters.search, $options: 'i' } }
        ];
      }
      // @ts-ignore: Tenant model should be imported from backend
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
      // @ts-ignore: Tenant model should be imported from backend
      const tenant = await Tenant.findById(id)
        .populate('roomId', 'roomNumber floor wing type amenities');
      if (!tenant) return { success: false, error: 'Tenant not found' };
      return { success: true, data: tenant };
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return { success: false, error: 'Failed to fetch tenant' };
    }
  }
}

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
}
export class TenantService {
  // Get all tenants with optional filtering
  static async getAllTenants(filters?: {
    status?: string;
    wing?: string;
    search?: string;
  }) {
    try {

      import { Tenant } from '../models/Tenant';

      export class TenantService {
        // Get all tenants with optional filtering
        static async getAllTenants(filters?: {
          status?: string;
          wing?: string;
          search?: string;
        }) {
          try {
            let query: any = {};
            if (filters?.status && filters.status !== 'all') query.status = filters.status;
            if (filters?.wing && filters.wing !== 'all') query.wing = filters.wing;
            if (filters?.search) {
              query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { email: { $regex: filters.search, $options: 'i' } },
                { phone: { $regex: filters.search, $options: 'i' } }
              ];
            }
            // @ts-ignore: Tenant model should be imported from backend
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
            // @ts-ignore: Tenant model should be imported from backend
            const tenant = await Tenant.findById(id)
              .populate('roomId', 'roomNumber floor wing type amenities');
            if (!tenant) return { success: false, error: 'Tenant not found' };
            return { success: true, data: tenant };
          } catch (error) {
            console.error('Error fetching tenant:', error);
            return { success: false, error: 'Failed to fetch tenant' };
          }
        }
      }
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
}



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
