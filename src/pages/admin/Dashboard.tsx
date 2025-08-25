import React, { useState, useEffect } from 'react';
import { Users, Building, DollarSign, Clock, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useAdminView } from '../../context/AdminViewContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { useDataRefresh } from '../../context/DataRefreshContext';

interface Tenant {
  _id: string;
  name: string;
  wing: 'A' | 'B';
  status: 'active' | 'inactive' | 'pending';
  joinDate: Date;
}

interface Room {
  _id: string;
  roomNumber: string;
  wing: 'A' | 'B';
  status: 'available' | 'occupied' | 'maintenance';
  floor: number;
}

interface RentPayment {
  _id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  wing: 'A' | 'B';
}

const Dashboard: React.FC = () => {
  const { view } = useAdminView();
  const navigate = useNavigate();
  const { refreshTrigger } = useDataRefresh();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // State for real data
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);



  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tenantsResponse, roomsResponse, paymentsResponse] = await Promise.all([
        apiService.getTenants(),
        apiService.getRooms(),
        apiService.getRentPayments()
      ]);

      if (tenantsResponse?.success) {
        setTenants(tenantsResponse.data);
      } else {
        console.error('Tenants API failed');
        setError('Failed to fetch tenants from database');
      }

      if (roomsResponse?.success) {
        setRooms(roomsResponse.data);
      } else {
        console.error('Rooms API failed');
        setError('Failed to fetch rooms from database');
      }

      if (paymentsResponse?.success) {
        setRentPayments(paymentsResponse.data);
      } else {
        console.error('Rent payments API failed');
        setError('Failed to fetch rent payments from database');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]); // Refetch when refreshTrigger changes

  // Filter data by wing selection
  const filteredTenants = tenants.filter(t =>
    view === 'dashboard' || (view === 'wingA' && t.wing === 'A') || (view === 'wingB' && t.wing === 'B')
  );
  const filteredRooms = rooms.filter(r =>
    view === 'dashboard' || (view === 'wingA' && r.wing === 'A') || (view === 'wingB' && r.wing === 'B')
  );
  const filteredRentPayments = rentPayments.filter(p =>
    view === 'dashboard' || (view === 'wingA' && p.wing === 'A') || (view === 'wingB' && p.wing === 'B')
  );

  function getOccupancyPercent(rooms: { status: string }[]): number {
    const total = rooms.length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    return total === 0 ? 0 : Math.round((occupied / total) * 100);
  }

  // ...existing code...

  // Calculate statistics
  const totalRooms = filteredRooms.length;
  const occupiedRooms = filteredRooms.filter(r => r.status === 'occupied').length;
  // ...existing code...
  const occupancyPercent = getOccupancyPercent(filteredRooms);
  // Total revenue should match collected amount (sum of paidAmount for paid/partial rows)
  const totalRevenue = (rentPayments as any[])
    .filter(p => (view === 'dashboard' || (view === 'wingA' && p.wing === 'A') || (view === 'wingB' && p.wing === 'B')))
    .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const paidCount = filteredRentPayments.filter(p => p.status === 'paid').length;
  const pendingCount = filteredRentPayments.filter(p => p.status === 'pending').length;
  const overdueCount = filteredRentPayments.filter(p => p.status === 'overdue').length;
  const totalRents = filteredRentPayments.length;
  const paidPercent = totalRents === 0 ? 0 : Math.round((paidCount / totalRents) * 100);

  const totalTenants = filteredTenants.length;
  const activeTenants = filteredTenants.filter(t => t.status === 'active').length;
  // ...existing code...
  const activePercent = totalTenants === 0 ? 0 : Math.round((activeTenants / totalTenants) * 100);

  // Recent activity data - generate from real data
  const recentActivity = [
    ...rentPayments
      .filter(payment => payment.status === 'paid')
      .slice(0, 2)
      .map((payment, index) => ({
        id: index + 1,
        type: 'payment' as const,
        message: `${payment.tenantName || 'Tenant'} paid rent for Room ${payment.roomNumber}`,
        time: 'Recently',
        status: 'success' as const
      })),
    ...tenants
      .filter(tenant => tenant.status === 'active')
      .slice(0, 1)
      .map((tenant, index) => ({
        id: index + 3,
        type: 'tenant' as const,
        message: `Active tenant ${tenant.name} in the system`,
        time: 'Recently',
        status: 'info' as const
      })),
    ...rentPayments
      .filter(payment => payment.status === 'overdue')
      .slice(0, 1)
      .map((payment, index) => ({
        id: index + 4,
        type: 'payment' as const,
        message: `${payment.tenantName || 'Tenant'} overdue on rent payment`,
        time: 'Recently',
        status: 'error' as const
      }))
  ].slice(0, 4); // Limit to 4 items

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard data...</div>
      </div>
    );
  }

  if (error && tenants.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back! Here's what's happening with your PG today.
            </p>
          </div>
          <div className="flex space-x-2">
            {/* Removed refresh button */}
            <button
              onClick={() => navigate('/admin/tenants')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Add Tenant</span>
            </button>
          </div>
        </div>

        {/* API Status Indicator */}

      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+12.5%</span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Tenants Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalTenants}</p>
                <div className="flex items-center mt-2">
                  <Users className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600 font-medium">{activeTenants} active</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Occupied Rooms Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupied Rooms</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{occupiedRooms}/{totalRooms}</p>
                <div className="flex items-center mt-2">
                  <Building className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600 font-medium">{occupancyPercent}% occupancy</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Pending Payments Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingCount}</p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-600 font-medium">{overdueCount} overdue</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Quick Overview</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate('/admin/rent')}
                  className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Rent Collection Progress */}
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-green-500"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={`${paidPercent}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">{paidPercent}%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">Rent Collected</p>
                <p className="text-xs text-gray-500 mt-1">{paidCount} of {totalRents} payments</p>
              </div>

              {/* Occupancy Rate */}
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-blue-500"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={`${occupancyPercent}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">{occupancyPercent}%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">Occupancy Rate</p>
                <p className="text-xs text-gray-500 mt-1">{occupiedRooms} of {totalRooms} rooms</p>
              </div>

              {/* Tenant Activity */}
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-purple-500"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={`${activePercent}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">{activePercent}%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">Active Tenants</p>
                <p className="text-xs text-gray-500 mt-1">{activeTenants} of {totalTenants} tenants</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <button className="text-sm text-gray-500 hover:text-gray-700">
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/tenants')}
              className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors duration-200"
            >
              <Users className="w-5 h-5 text-gray-600 mr-3" />
              <span className="text-sm font-medium text-gray-700">Manage Tenants</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/rooms')}
              className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors duration-200"
            >
              <Building className="w-5 h-5 text-gray-600 mr-3" />
              <span className="text-sm font-medium text-gray-700">View Rooms</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/rent')}
              className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors duration-200"
            >
              <DollarSign className="w-5 h-5 text-gray-600 mr-3" />
              <span className="text-sm font-medium text-gray-700">Rent Payments</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/expenses')}
              className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors duration-200"
            >
              <TrendingUp className="w-5 h-5 text-gray-600 mr-3" />
              <span className="text-sm font-medium text-gray-700">Track Expenses</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;