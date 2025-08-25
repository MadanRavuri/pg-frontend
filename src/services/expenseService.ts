import { Expense, IExpense } from '../models/Expense';

export class ExpenseService {
  // Get all expenses with optional filtering
  static async getAllExpenses(filters?: {
    category?: string;
    status?: string;
    wing?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    search?: string;
  }) {
    try {
      let query: any = {};

      if (filters?.category && filters.category !== 'all') {
        query.category = filters.category;
      }

      if (filters?.status && filters.status !== 'all') {
        query.status = filters.status;
      }

      if (filters?.wing && filters.wing !== 'all') {
        query.wing = filters.wing;
      }

      if (filters?.dateRange) {
        query.date = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        };
      }

      if (filters?.search) {
        query.$or = [
          { description: { $regex: filters.search, $options: 'i' } },
          { vendor: { $regex: filters.search, $options: 'i' } },
          { category: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const expenses = await Expense.find(query)
        .populate('approvedBy', 'name')
        .sort({ date: -1 });

      return { success: true, data: expenses };
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return { success: false, error: 'Failed to fetch expenses' };
    }
  }

  // Get expense by ID
  static async getExpenseById(id: string) {
    try {
      const expense = await Expense.findById(id)
        .populate('approvedBy', 'name');
      
      if (!expense) {
        return { success: false, error: 'Expense not found' };
      }

      return { success: true, data: expense };
    } catch (error) {
      console.error('Error fetching expense:', error);
      return { success: false, error: 'Failed to fetch expense' };
    }
  }

  // Create new expense
  static async createExpense(expenseData: Partial<IExpense>) {
    try {
      const expense = new Expense(expenseData);
      await expense.save();

      const populatedExpense = await Expense.findById(expense._id)
        .populate('approvedBy', 'name');

      return { success: true, data: populatedExpense };
    } catch (error) {
      console.error('Error creating expense:', error);
      return { success: false, error: 'Failed to create expense' };
    }
  }

  // Update expense
  static async updateExpense(id: string, updateData: Partial<IExpense>) {
    try {
      const expense = await Expense.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('approvedBy', 'name');

      if (!expense) {
        return { success: false, error: 'Expense not found' };
      }

      return { success: true, data: expense };
    } catch (error) {
      console.error('Error updating expense:', error);
      return { success: false, error: 'Failed to update expense' };
    }
  }

  // Approve expense
  static async approveExpense(id: string, approvedBy: string) {
    try {
      const expense = await Expense.findByIdAndUpdate(
        id,
        {
          status: 'approved',
          approvedBy,
          approvedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('approvedBy', 'name');

      if (!expense) {
        return { success: false, error: 'Expense not found' };
      }

      return { success: true, data: expense };
    } catch (error) {
      console.error('Error approving expense:', error);
      return { success: false, error: 'Failed to approve expense' };
    }
  }

  // Delete expense
  static async deleteExpense(id: string) {
    try {
      const expense = await Expense.findById(id);
      if (!expense) {
        return { success: false, error: 'Expense not found' };
      }

      await Expense.findByIdAndDelete(id);
      return { success: true, message: 'Expense deleted successfully' };
    } catch (error) {
      console.error('Error deleting expense:', error);
      return { success: false, error: 'Failed to delete expense' };
    }
  }

  // Get expense statistics
  static async getExpenseStats(dateRange?: {
    start: Date;
    end: Date;
  }) {
    try {
      let query: any = {};
      if (dateRange) {
        query.date = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const total = await Expense.countDocuments(query);
      const totalAmount = await Expense.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const categoryStats = await Expense.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { total: -1 } }
      ]);

      const monthlyStats = await Expense.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } }
      ]);

      const wingStats = await Expense.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$wing',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        }
      ]);

      return {
        success: true,
        data: {
          total,
          totalAmount: totalAmount[0]?.total || 0,
          categoryStats,
          monthlyStats,
          wingStats
        }
      };
    } catch (error) {
      console.error('Error fetching expense stats:', error);
      return { success: false, error: 'Failed to fetch expense statistics' };
    }
  }

  // Get expense categories
  static async getExpenseCategories() {
    try {
      const categories = await Expense.distinct('category');
      return { success: true, data: categories };
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      return { success: false, error: 'Failed to fetch expense categories' };
    }
  }
} 