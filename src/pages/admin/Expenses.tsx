import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { apiService } from '../../services/apiService';
import { useDataRefresh } from '../../context/DataRefreshContext';

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  subcategory: string;
  date: Date;
  status: 'pending' | 'approved' | 'paid';
  notes?: string;
  receipt?: string;
  vendor: string;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  wing: 'A' | 'B' | 'common';
}

const Expenses: React.FC = () => {
  try {
    // Get data refresh functions
    const { refreshTenants, refreshRooms, refreshRentPayments, refreshTrigger } = useDataRefresh();
    
    // Basic state management
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [saving, setSaving] = useState(false);


    // Form state
    const [expenseForm, setExpenseForm] = useState({
      description: '',
      amount: '',
      category: '',
      subcategory: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'pending' as 'pending' | 'paid' | 'approved',
      notes: '',
      receipt: '',
      vendor: '',
      paymentMethod: '',
      wing: ''
    });



    // Fetch expenses from real API
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
        
      const response = await apiService.getExpenses();
        
        if (response && response.success) {
        setExpenses(response.data);
      } else {
          console.error('API returned unsuccessful response');
          setError('Failed to fetch expenses from database');
      }
    } catch (err) {
        console.error('Error fetching expenses:', err);
        setError('Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger]); // Listen for refreshTrigger

    // Filter expenses based on search, category, and status
  const filteredExpenses = expenses.filter(expense => {
      const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const pendingExpenses = expenses.filter(expense => expense.status === 'pending');
    const totalPending = pendingExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleAddExpense = () => {
    setIsEditing(false);
      setEditingExpense(null);
    setExpenseForm({
      description: '',
      amount: '',
      category: '',
      subcategory: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'pending',
      notes: '',
      receipt: '',
      vendor: '',
      paymentMethod: '',
      wing: ''
    });
      setShowAddModal(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setIsEditing(true);
      setEditingExpense(expense);
    setExpenseForm({
      description: expense.description || '',
      amount: expense.amount?.toString() || '',
      category: expense.category || '',
      subcategory: expense.subcategory || '',
      date: expense.date ? format(new Date(expense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      status: expense.status || 'pending',
      notes: expense.notes || '',
      receipt: expense.receipt || '',
      vendor: expense.vendor || '',
      paymentMethod: expense.paymentMethod || '',
      wing: expense.wing || ''
    });
      setShowAddModal(true);
    };

    const handleDeleteExpense = async (id: string) => {
      if (confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
        try {

          setError(null);
          const response = await apiService.deleteExpense(id);
          
          if (response && response.success) {
            // Remove expense from local state
            setExpenses(expenses.filter(expense => expense._id !== id));
            alert('Expense deleted successfully!');
            // Trigger refresh in other components
            refreshTenants();
            refreshRooms();
            refreshRentPayments();
          } else {
            setError('Failed to delete expense from server');
          }
        } catch (err) {
          console.error('Error deleting expense:', err);
          setError(err instanceof Error ? err.message : 'Failed to delete expense');
        }
      }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
      
    try {
      setSaving(true);
      setError(null);
      
        // Prepare expense data with all required fields
        const expenseData = {
          description: expenseForm.description,
          amount: parseFloat(expenseForm.amount) || 0,
          category: expenseForm.category,
          subcategory: expenseForm.subcategory,
          date: new Date(expenseForm.date),
          status: expenseForm.status,
          notes: expenseForm.notes,
          receipt: expenseForm.receipt,
          vendor: expenseForm.vendor,
          paymentMethod: expenseForm.paymentMethod,
          wing: expenseForm.wing
        };
        

        
        if (isEditing && editingExpense) {
          // Update existing expense via API
          const response = await apiService.updateExpense(editingExpense._id, expenseData);
          
          if (response && response.success) {
            // Update expense in local state
            setExpenses(expenses.map(expense => 
              expense._id === editingExpense._id 
                ? { ...expense, ...expenseData } as Expense
                : expense
            ));
            alert('Expense updated successfully!');
            // Trigger refresh in other components
            refreshTenants();
            refreshRooms();
            refreshRentPayments();
          } else {
            setError('Failed to update expense on server');
            return;
          }
        } else {
          // Create new expense via API
          const response = await apiService.createExpense(expenseData);
          
          if (response && response.success) {
            // Add new expense to local state
            setExpenses([...expenses, response.data]);
            alert('Expense added successfully!');
            // Trigger refresh in other components
            refreshTenants();
            refreshRooms();
            refreshRentPayments();
          } else {
            setError('Failed to create expense on server');
            return;
          }
        }
      
        setShowAddModal(false);
        setIsEditing(false);
        setEditingExpense(null);
    } catch (err) {
        console.error('Error saving expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading expenses from database...</div>
      </div>
    );
  }

    if (error && expenses.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="mb-4">{error}</p>
        <button 
          onClick={fetchExpenses}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Expenses Management</h1>
          <div className="flex space-x-2">
            <button 
              onClick={handleAddExpense}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>



      {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-semibold text-gray-900">₹{totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                {/* Removed TrendingUp icon */}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-semibold text-gray-900">₹{totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-semibold text-gray-900">{expenses.length}</p>
            </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Filter</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
                <option value="Utilities">Utilities</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Supplies">Supplies</option>
                <option value="Repairs">Repairs</option>
                <option value="Insurance">Insurance</option>
                <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
              Expenses ({filteredExpenses.length})
          </h3>
        </div>
        
        {filteredExpenses.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
              {expenses.length === 0 ? 'No expenses found in the database.' : 'No expenses match your search criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                          <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                          {expense.notes && (
                            <div className="text-sm text-gray-500">{expense.notes}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{expense.amount?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.date ? format(new Date(expense.date), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                          expense.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit Expense"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
        {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button
                  onClick={() => {
                    setShowAddModal(false);
                    setIsEditing(false);
                    setEditingExpense(null);
                  }}
                className="text-gray-400 hover:text-gray-600"
              >
                  <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveExpense} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-red-800">{error}</div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Repairs">Repairs</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory *</label>
                  <input
                    type="text"
                    value={expenseForm.subcategory}
                    onChange={(e) => setExpenseForm({ ...expenseForm, subcategory: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                    placeholder="Enter subcategory"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select
                    value={expenseForm.status}
                    onChange={(e) => setExpenseForm({ ...expenseForm, status: e.target.value as 'pending' | 'paid' | 'approved' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendor *</label>
                  <input
                    type="text"
                    value={expenseForm.vendor}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                    placeholder="Enter vendor name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Payment Method</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wing *</label>
                  <select
                    value={expenseForm.wing}
                    onChange={(e) => setExpenseForm({ ...expenseForm, wing: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Wing</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="common">Common</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Receipt URL</label>
                  <input
                    type="url"
                    value={expenseForm.receipt}
                    onChange={(e) => setExpenseForm({ ...expenseForm, receipt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="https://example.com/receipt.pdf"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Additional notes about this expense..."
                />
              </div>
              
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setIsEditing(false);
                      setEditingExpense(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  disabled={saving}
                >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                </button>
                <button
                  type="submit"
                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50"
                  disabled={saving}
                >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : (isEditing ? 'Update Expense' : 'Add Expense')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      </div>
    );
  } catch (error) {
    console.error('Error in Expenses component:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="mb-4">The Expenses component encountered an error. Please check the console for details.</p>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">Error Details</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
              {error instanceof Error ? error.message : String(error)}
            </pre>
          </details>
        </div>
    </div>
  );
  }
};

export default Expenses;