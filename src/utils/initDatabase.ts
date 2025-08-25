import { connectDB } from '../config/database';
import { User } from '../models/User';
import { Room } from '../models/Room';
import { Tenant } from '../models/Tenant';
import { RentPayment } from '../models/RentPayment';
import { Expense } from '../models/Expense';
import { Settings } from '../models/Settings';
import { format, parseISO } from 'date-fns';

export const initializeDatabase = async () => {
  try {
    await connectDB();

    // Check if data already exists
    const existingUsers = await User.countDocuments();
    const existingRooms = await Room.countDocuments();
    const existingTenants = await Tenant.countDocuments();

    if (existingUsers > 0 || existingRooms > 0 || existingTenants > 0) {
      console.log('✅ Database already has data, skipping initialization');
      return;
    }

    console.log('🚀 Initializing database with sample data...');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@sunflowerpg.com',
      password: 'admin123', // In production, this should be hashed
      role: 'admin',
      isActive: true
    });

    console.log('✅ Admin user created');

    // Create rooms
    const rooms = await Room.insertMany([
      {
        roomNumber: '101',
        floor: 1,
        wing: 'A',
        type: 'single',
        rent: 8000,
        status: 'occupied',
        amenities: ['AC', 'Wi-Fi', 'Food'],
        description: 'Single occupancy room with attached bathroom'
      },
      {
        roomNumber: '102',
        floor: 1,
        wing: 'A',
        type: 'double',
        rent: 12000,
        status: 'occupied',
        amenities: ['AC', 'Wi-Fi', 'Food'],
        description: 'Double occupancy room with attached bathroom'
      },
      {
        roomNumber: '201',
        floor: 2,
        wing: 'A',
        type: 'single',
        rent: 8500,
        status: 'available',
        amenities: ['AC', 'Wi-Fi', 'Food'],
        description: 'Single occupancy room with attached bathroom'
      },
      {
        roomNumber: '202',
        floor: 2,
        wing: 'A',
        type: 'triple',
        rent: 15000,
        status: 'occupied',
        amenities: ['AC', 'Wi-Fi', 'Food'],
        description: 'Triple occupancy room with attached bathroom'
      },
      {
        roomNumber: '101',
        floor: 1,
        wing: 'B',
        type: 'single',
        rent: 7500,
        status: 'available',
        amenities: ['AC', 'Wi-Fi'],
        description: 'Single occupancy room with attached bathroom'
      },
      {
        roomNumber: '102',
        floor: 1,
        wing: 'B',
        type: 'double',
        rent: 11000,
        status: 'occupied',
        amenities: ['AC', 'Wi-Fi'],
        description: 'Double occupancy room with attached bathroom'
      }
    ]);

    console.log('✅ Rooms created');

    // Create tenants
    const tenants = await Tenant.insertMany([
      {
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+91 9876543210',
        roomId: rooms[0]._id,
        rent: 8000,
        deposit: 16000,
        status: 'active',
        joinDate: new Date('2024-01-15'),
        emergencyContact: {
          name: 'Jane Doe',
          phone: '+91 9876543211',
          relation: 'Father'
        },
        wing: 'A',
        floor: 1
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@email.com',
        phone: '+91 9876543212',
        roomId: rooms[1]._id,
        rent: 12000,
        deposit: 24000,
        status: 'active',
        joinDate: new Date('2024-02-01'),
        emergencyContact: {
          name: 'Mike Wilson',
          phone: '+91 9876543213',
          relation: 'Brother'
        },
        wing: 'A',
        floor: 1
      },
      {
        name: 'Alice Smith',
        email: 'alice.smith@email.com',
        phone: '+91 9876543214',
        roomId: rooms[3]._id,
        rent: 15000,
        deposit: 30000,
        status: 'active',
        joinDate: new Date('2024-01-20'),
        emergencyContact: {
          name: 'Bob Smith',
          phone: '+91 9876543215',
          relation: 'Father'
        },
        wing: 'A',
        floor: 2
      },
      {
        name: 'David Brown',
        email: 'david.brown@email.com',
        phone: '+91 9876543216',
        roomId: rooms[5]._id,
        rent: 11000,
        deposit: 22000,
        status: 'active',
        joinDate: new Date('2024-03-01'),
        emergencyContact: {
          name: 'Emma Brown',
          phone: '+91 9876543217',
          relation: 'Mother'
        },
        wing: 'B',
        floor: 1
      }
    ]);

    console.log('✅ Tenants created');

    // Update room status for occupied rooms
    await Room.findByIdAndUpdate(rooms[0]._id, { 
      status: 'occupied', 
      tenantId: tenants[0]._id 
    });
    await Room.findByIdAndUpdate(rooms[1]._id, { 
      status: 'occupied', 
      tenantId: tenants[1]._id 
    });
    await Room.findByIdAndUpdate(rooms[3]._id, { 
      status: 'occupied', 
      tenantId: tenants[2]._id 
    });
    await Room.findByIdAndUpdate(rooms[5]._id, { 
      status: 'occupied', 
      tenantId: tenants[3]._id 
    });

    // Create rent payments
    const currentMonth = format(new Date(), 'yyyy-MM');
    const currentYear = new Date().getFullYear();
    const monthName = format(new Date(), 'MMMM');

    const rentPayments = await RentPayment.insertMany([
      {
        tenantId: tenants[0]._id,
        roomId: rooms[0]._id,
        month: currentMonth,
        year: currentYear,
        monthName,
        amount: 8000,
        dueDate: new Date(currentYear, new Date().getMonth(), 5),
        paidDate: new Date(currentYear, new Date().getMonth(), 3),
        status: 'paid',
        paymentMethod: 'upi',
        transactionId: 'UPI123456789',
        wing: 'A'
      },
      {
        tenantId: tenants[1]._id,
        roomId: rooms[1]._id,
        month: currentMonth,
        year: currentYear,
        monthName,
        amount: 12000,
        dueDate: new Date(currentYear, new Date().getMonth(), 5),
        status: 'pending',
        wing: 'A'
      },
      {
        tenantId: tenants[2]._id,
        roomId: rooms[3]._id,
        month: currentMonth,
        year: currentYear,
        monthName,
        amount: 15000,
        dueDate: new Date(currentYear, new Date().getMonth(), 5),
        status: 'overdue',
        lateFee: 750,
        wing: 'A'
      },
      {
        tenantId: tenants[3]._id,
        roomId: rooms[5]._id,
        month: currentMonth,
        year: currentYear,
        monthName,
        amount: 11000,
        dueDate: new Date(currentYear, new Date().getMonth(), 5),
        status: 'pending',
        wing: 'B'
      }
    ]);

    console.log('✅ Rent payments created');

    // Create expenses
    const expenses = await Expense.insertMany([
      {
        category: 'provisions',
        subcategory: 'groceries',
        description: 'Monthly grocery supplies',
        amount: 25000,
        date: new Date(),
        paymentMethod: 'cash',
        vendor: 'Local Grocery Store',
        status: 'paid',
        wing: 'common'
      },
      {
        category: 'maintenance',
        subcategory: 'plumbing',
        description: 'Water pump repair',
        amount: 5000,
        date: new Date(),
        paymentMethod: 'bank_transfer',
        vendor: 'ABC Plumbing Services',
        status: 'paid',
        wing: 'A'
      },
      {
        category: 'utilities',
        subcategory: 'electricity',
        description: 'Monthly electricity bill',
        amount: 15000,
        date: new Date(),
        paymentMethod: 'upi',
        vendor: 'State Electricity Board',
        status: 'paid',
        wing: 'common'
      },
      {
        category: 'cleaning',
        subcategory: 'supplies',
        description: 'Cleaning supplies and equipment',
        amount: 3000,
        date: new Date(),
        paymentMethod: 'cash',
        vendor: 'CleanPro Supplies',
        status: 'paid',
        wing: 'common'
      }
    ]);

    console.log('✅ Expenses created');

    // Create settings
    await Settings.create({
      pgName: 'Sunflower PG',
      address: '123 Main Street, Bangalore, Karnataka 560001',
      contactNumber: '+91 9876543210',
      email: 'info@sunflowerpg.com',
      gstNumber: '29ABCDE1234F1Z5',
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
        'Parking',
        '24/7 Water Supply',
        'Power Backup'
      ],
      policies: [
        'No smoking',
        'No pets',
        'Quiet hours after 10 PM',
        'Guests allowed till 8 PM',
        'No cooking in rooms',
        'Monthly rent due by 5th'
      ],
      theme: {
        primaryColor: '#fbbf24',
        secondaryColor: '#92400e'
      },
      notifications: {
        email: true,
        sms: false,
        push: false
      }
    });

    console.log('✅ Settings created');

    // --- Migration Script ---
    // 1. Set paidAmount: 0 where it does not exist
    await RentPayment.updateMany(
      { paidAmount: { $exists: false } },
      { $set: { paidAmount: 0 } }
    );

    // 2. Set status: 'partial' where paidAmount > 0 and amount > paidAmount
    await RentPayment.updateMany(
      { $expr: { $and: [
        { $gt: ["$paidAmount", 0] },
        { $gt: ["$amount", "$paidAmount"] }
      ] } },
      { $set: { status: 'partial' } }
    );

    console.log('✅ RentPayment migration completed');

    console.log('🎉 Database initialization completed successfully!');
    console.log(`📊 Created ${rooms.length} rooms, ${tenants.length} tenants, ${rentPayments.length} rent payments, and ${expenses.length} expenses`);

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}; 