import { Settings, ISettings } from '../models/Settings';

export class SettingsService {
  // Get settings
  static async getSettings() {
    try {
      let settings = await Settings.findOne();
      
      if (!settings) {
        // Create default settings if none exist
        settings = await Settings.create({
          pgName: 'Sunflower PG',
          address: '123 Main Street, City, State 12345',
          contactNumber: '+91 9876543210',
          email: 'info@sunflowerpg.com',
          bankDetails: {
            accountNumber: '1234567890',
            ifscCode: 'SBIN0001234',
            bankName: 'State Bank of India',
            accountHolderName: 'Sunflower PG'
          },
          rentDueDate: 5,
          lateFeePercentage: 5,
          maintenanceFee: 0,
          amenities: [
            'Wi-Fi',
            'AC',
            'Food',
            'Laundry',
            'Security',
            'Parking'
          ],
          policies: [
            'No smoking',
            'No pets',
            'Quiet hours after 10 PM',
            'Guests allowed till 8 PM'
          ]
        });
      }

      return { success: true, data: settings };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { success: false, error: 'Failed to fetch settings' };
    }
  }

  // Update settings
  static async updateSettings(updateData: Partial<ISettings>) {
    try {
      const settings = await Settings.findOneAndUpdate(
        {},
        updateData,
        { new: true, runValidators: true, upsert: true }
      );

      return { success: true, data: settings };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error: 'Failed to update settings' };
    }
  }

  // Update specific setting sections
  static async updatePGSettings(pgData: {
    pgName?: string;
    address?: string;
    contactNumber?: string;
    email?: string;
    gstNumber?: string;
  }) {
    try {
      const settings = await Settings.findOneAndUpdate(
        {},
        pgData,
        { new: true, runValidators: true, upsert: true }
      );

      return { success: true, data: settings };
    } catch (error) {
      console.error('Error updating PG settings:', error);
      return { success: false, error: 'Failed to update PG settings' };
    }
  }

  static async updateBankSettings(bankData: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  }) {
    try {
      const settings = await Settings.findOneAndUpdate(
        {},
        { bankDetails: bankData },
        { new: true, runValidators: true, upsert: true }
      );

      return { success: true, data: settings };
    } catch (error) {
      console.error('Error updating bank settings:', error);
      return { success: false, error: 'Failed to update bank settings' };
    }
  }

  static async updateRentSettings(rentData: {
    rentDueDate?: number;
    lateFeePercentage?: number;
    maintenanceFee?: number;
  }) {
    try {
      const settings = await Settings.findOneAndUpdate(
        {},
        rentData,
        { new: true, runValidators: true, upsert: true }
      );

      return { success: true, data: settings };
    } catch (error) {
      console.error('Error updating rent settings:', error);
      return { success: false, error: 'Failed to update rent settings' };
    }
  }

  static async updateAmenities(amenities: string[]) {
    try {
      const settings = await Settings.findOneAndUpdate(
        {},
        { amenities },
        { new: true, runValidators: true, upsert: true }
      );

      return { success: true, data: settings };
    } catch (error) {
      console.error('Error updating amenities:', error);
      return { success: false, error: 'Failed to update amenities' };
    }
  }

  static async updatePolicies(policies: string[]) {
    try {
      const settings = await Settings.findOneAndUpdate(
        {},
        { policies },
        { new: true, runValidators: true, upsert: true }
      );

      return { success: true, data: settings };
    } catch (error) {
      console.error('Error updating policies:', error);
      return { success: false, error: 'Failed to update policies' };
    }
  }

  static async updateTheme(theme: {
    primaryColor: string;
    secondaryColor: string;
  }) {
    try {
      const settings = await Settings.findOneAndUpdate(
        {},
        { theme },
        { new: true, runValidators: true, upsert: true }
      );

      return { success: true, data: settings };
    } catch (error) {
      console.error('Error updating theme:', error);
      return { success: false, error: 'Failed to update theme' };
    }
  }

  static async updateNotifications(notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  }) {
    try {
      const settings = await Settings.findOneAndUpdate(
        {},
        { notifications },
        { new: true, runValidators: true, upsert: true }
      );

      return { success: true, data: settings };
    } catch (error) {
      console.error('Error updating notifications:', error);
      return { success: false, error: 'Failed to update notifications' };
    }
  }
} 