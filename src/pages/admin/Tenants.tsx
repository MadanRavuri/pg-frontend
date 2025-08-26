import React, { useState, useEffect } from 'react';
import { useAdminView } from '../../context/AdminViewContext';
import { Plus, Edit, Trash2, Eye, Search, X, Save, UserMinus, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { apiService } from '../../services/apiService';
import { useDataRefresh } from '../../context/DataRefreshContext';

interface Tenant {
  _id: string;
  name: string;
  email: string;
  phone: string;
  roomId: string | { _id: string; roomNumber: string; floor: number; wing: string };
  floor: number;
  wing: 'A' | 'B';
  joinDate: Date;
  rent: number;
  deposit: number;
  status: 'active' | 'inactive' | 'pending';
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
}

interface Room {
  _id: string;
  roomNumber: string;
  floor: number;
  wing: 'A' | 'B';
  status: 'available' | 'occupied' | 'maintenance';
}

const Tenants: React.FC = () => {
  try {
    // Get data refresh functions
    const { refreshRooms, refreshRentPayments, refreshTrigger } = useDataRefresh();
    
  // Basic state management
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [floorFilter, setFloorFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Get selected view (dashboard, wingA, wingB)
  const { view } = useAdminView();

  // Helper: calculate current occupancy for a room
  const getCurrentOccupancy = (roomId: string) => {
    return tenants.filter(
      t => (typeof t.roomId === 'object' ? t.roomId._id : t.roomId) === roomId && t.status === 'active'
    ).length;
  };

  // Helper: get capacity for a room (fallback to type if missing)
  const getRoomCapacity = (room: Room) => {
    if ((room as any).capacity !== undefined) return (room as any).capacity;
    if ((room as any).type === 'single') return 1;
    if ((room as any).type === 'double') return 2;
    if ((room as any).type === 'triple') return 3;
    return 1;
  };
    // Form state
    const [tenantForm, setTenantForm] = useState({
      name: '',
      email: '',
      phone: '',
      roomId: '',
      floor: '',
      wing: 'A' as 'A' | 'B',
      joinDate: format(new Date(), 'yyyy-MM-dd'),
      rent: '',
      deposit: '',
      address: { line1: '', line2: '', city: '', state: '', zip: '' },
      idProof: { type: 'aadhar', number: '', image: '' },
      emergencyContact: {
        name: '',
        phone: '',
        relation: ''
      }
    });



    // Fetch tenants from real API
    const fetchTenants = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getTenants();
        
        if (response && response.success) {
          setTenants(response.data);
        } else {
          console.error('API returned unsuccessful response');
          setError('Failed to fetch tenants from database');
        }
      } catch (err) {
        console.error('Error fetching tenants:', err);
        setError('Failed to connect to database');
      } finally {
        setLoading(false);
      }
    };

    // Fetch rooms from real API
    const fetchRooms = async () => {
      try {
        const response = await apiService.getRooms();
        
        if (response && response.success) {
          setRooms(response.data);
        } else {
          console.error('Rooms API failed');
          setError('Failed to fetch rooms from database');
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
        setError('Failed to connect to database');
      }
    };

    useEffect(() => {
      fetchTenants();
      fetchRooms();
    }, [refreshTrigger]); // Refetch when refreshTrigger changes

    // Filter tenants based on search and status
    // Filter tenants by wing selection
    const filteredTenants = tenants.filter(tenant => {
      const matchesSearch = tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (typeof tenant.roomId === 'string' ? tenant.roomId : tenant.roomId?.roomNumber)?.toString().includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      const matchesWing = view === 'dashboard' || tenant.wing === (view === 'wingA' ? 'A' : view === 'wingB' ? 'B' : tenant.wing);
      const matchesFloor = floorFilter === 'all' || (tenant.floor?.toString() === floorFilter);
      const matchesRoom = roomFilter === 'all' || ((typeof tenant.roomId === 'object' ? tenant.roomId.roomNumber : tenant.roomId)?.toString() === roomFilter);
      return matchesSearch && matchesStatus && matchesWing && matchesFloor && matchesRoom;
    });

    const handleAddTenant = () => {
      setIsEditing(false);
      setEditingTenant(null);
      setTenantForm({
        name: '',
        email: '',
        phone: '',
        roomId: '',
        floor: '',
        wing: 'A',
        joinDate: format(new Date(), 'yyyy-MM-dd'),
        rent: '',
        deposit: '',
        address: { line1: '', line2: '', city: '', state: '', zip: '' },
        idProof: { type: 'aadhar', number: '', image: '' },
        emergencyContact: {
          name: '',
          phone: '',
          relation: ''
        }
      });
      setShowAddModal(true);
    };

    const handleEditTenant = (tenant: Tenant) => {
      setIsEditing(true);
      setEditingTenant(tenant);
      setTenantForm({
        name: tenant.name || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        roomId: typeof tenant.roomId === 'object' ? tenant.roomId._id : tenant.roomId || '',
        floor: tenant.floor?.toString() || '',
        wing: tenant.wing || 'A',
        joinDate: tenant.joinDate ? format(new Date(tenant.joinDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        rent: tenant.rent?.toString() || '',
        deposit: tenant.deposit?.toString() || '',
        address: (tenant as any).address || { line1: '', line2: '', city: '', state: '', zip: '' },
        idProof: (tenant as any).idProof || { type: 'aadhar', number: '', image: '' },
        emergencyContact: tenant.emergencyContact || {
          name: '',
          phone: '',
          relation: ''
        }
      });
      setShowAddModal(true);
    };

    const handleDeleteTenant = async (id: string) => {
      console.log('Delete tenant clicked:', id);
      if (confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
                try {

          setError(null);
          const response = await apiService.deleteTenant(id);
          
          if (response && response.success) {
            // Remove tenant from local state
            setTenants(tenants.filter(tenant => tenant._id !== id));
            alert('Tenant deleted successfully!');
            // Trigger refresh in other components
            refreshRooms();
            refreshRentPayments();
          } else {
            setError('Failed to delete tenant from server');
          }
        } catch (err) {
          console.error('Error deleting tenant:', err);
          setError(err instanceof Error ? err.message : 'Failed to delete tenant');
        }
      }
    };

    const handleSaveTenant = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        setSaving(true);
        setError(null);
        
        // Prepare tenant data with all required fields
        const tenantData = {
          name: tenantForm.name,
          email: tenantForm.email,
          phone: tenantForm.phone,
          roomId: tenantForm.roomId,
          floor: parseInt(tenantForm.floor) || 1,
          wing: tenantForm.wing,
          joinDate: new Date(tenantForm.joinDate),
          rent: parseInt(tenantForm.rent) || 0,
          deposit: parseInt(tenantForm.deposit) || 0,
          address: tenantForm.address,
          idProof: tenantForm.idProof,
          emergencyContact: tenantForm.emergencyContact
        };
        

        
        if (isEditing && editingTenant) {
          // Update existing tenant via API
          const response = await apiService.updateTenant(editingTenant._id, tenantData);
          
          if (response && response.success) {
            // Update tenant in local state
            setTenants(tenants.map(tenant => 
              tenant._id === editingTenant._id 
                ? { ...tenant, ...tenantData }
                : tenant
            ));
            alert('Tenant updated successfully!');
            // Trigger refresh in other components
            refreshRooms();
            refreshRentPayments();
          } else {
            setError('Failed to update tenant on server');
            return;
          }
        } else {
          // Create new tenant via API
          const response = await apiService.createTenant(tenantData);
          
          if (response && response.success) {
            // Add new tenant to local state
            setTenants([...tenants, response.data]);
            alert('Tenant added successfully!');
            // Trigger refresh in other components
            refreshRooms();
            refreshRentPayments();
          } else {
            setError('Failed to create tenant on server');
            return;
          }
        }
        
        setShowAddModal(false);
        setIsEditing(false);
        setEditingTenant(null);
      } catch (err) {
        console.error('Error saving tenant:', err);
        setError(err instanceof Error ? err.message : 'Failed to save tenant');
      } finally {
        setSaving(false);
      }
    };

    const handleRoomSelection = (roomId: string) => {
      const selectedRoom = rooms.find(room => room._id === roomId);
      if (selectedRoom) {
        setTenantForm({
          ...tenantForm,
          roomId,
          floor: selectedRoom.floor.toString(),
          wing: selectedRoom.wing
        });
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading tenants from database...</div>
        </div>
      );
    }

    if (error && tenants.length === 0) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="mb-4">{error}</p>
            <button 
              onClick={fetchTenants}
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
          <h1 className="text-3xl font-bold text-gray-900">Tenants Management</h1>
          <div className="flex space-x-2">
            <button 
              onClick={handleAddTenant}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tenant</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{filteredTenants.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{filteredTenants.filter(t => t.status === 'active').length}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{filteredTenants.filter(t => t.status === 'inactive').length}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{filteredTenants.filter(t => t.status === 'pending').length}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">All Floors</option>
                {[...new Set(rooms.map(r => r.floor))].sort((a,b)=>a-b).map(f => (
                  <option key={f} value={String(f)}>{f} Floor</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">All Rooms</option>
                {[...new Set(rooms.map(r => r.roomNumber))].map(rn => (
                  <option key={String(rn)} value={String(rn)}>{String(rn)}</option>
                ))}
              </select>
            </div>
            <div />
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Tenants ({filteredTenants.length})
            </h3>
          </div>
          
          {filteredTenants.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {tenants.length === 0 ? 'No tenants found in the database.' : 'No tenants match your search criteria.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rent
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
                  {filteredTenants.map((tenant) => (
                    <tr
                      key={tenant._id}
                      className="hover:bg-yellow-50 cursor-pointer"
                      onClick={() => handleEditTenant(tenant)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                          <div className="text-sm text-gray-500">{tenant.email}</div>
                          <div className="text-sm text-gray-500">{tenant.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Room {typeof tenant.roomId === 'object' ? tenant.roomId?.roomNumber || 'N/A' : tenant.roomId}
                        {tenant.wing && (
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            tenant.wing === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            Wing {tenant.wing}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tenant.joinDate ? format(new Date(tenant.joinDate), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{tenant.rent ? tenant.rent.toLocaleString() : '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {tenant.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          onClick={e => {
                            e.stopPropagation();
                            handleEditTenant(tenant);
                          }}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit Tenant"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async e => {
                            e.stopPropagation();
                            try {
                              setSaving(true);
                              const newStatus = tenant.status === 'active' ? 'inactive' : 'active';
                              const res = await apiService.updateTenant(tenant._id, { status: newStatus });
                              if (res && (res as any).success) {
                                setTenants(prev => prev.map(t => t._id === tenant._id ? { ...t, status: newStatus } as any : t));
                              }
                            } finally {
                              setSaving(false);
                            }
                          }}
                          className={`px-2 py-1 rounded ${tenant.status==='active' ? 'text-blue-600 hover:text-blue-900 bg-blue-50' : 'text-green-700 hover:text-green-900 bg-green-50'}`}
                          title={tenant.status === 'active' ? 'Make Inactive' : 'Make Active'}
                        >
                          {tenant.status === 'active' ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteTenant(tenant._id);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Tenant"
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

        {/* Add/Edit Tenant Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Tenant' : 'Add New Tenant'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setIsEditing(false);
                    setEditingTenant(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSaveTenant} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800">{error}</div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={tenantForm.name}
                      onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={tenantForm.email}
                      onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={tenantForm.phone}
                      onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room Number *</label>
                    <select
                      value={tenantForm.roomId}
                      onChange={(e) => handleRoomSelection(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Room</option>
                      {rooms.filter(room => {
                        const capacity = getRoomCapacity(room);
                        const occupancy = getCurrentOccupancy(room._id);
                        // Show if not full, or if editing and this is the current room
                        return (occupancy < capacity) || (isEditing && tenantForm.roomId === room._id);
                      }).map(room => {
                        const capacity = getRoomCapacity(room);
                        const occupancy = getCurrentOccupancy(room._id);
                        return (
                          <option key={room._id} value={room._id}>
                            Room {room.roomNumber} - {room.floor} Floor - Wing {room.wing} (Occupied: {occupancy}/{capacity})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
                    <input
                      type="text"
                      value={tenantForm.floor}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Auto-filled from room selection"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wing</label>
                    <select
                      value={tenantForm.wing}
                      onChange={(e) => setTenantForm({ ...tenantForm, wing: e.target.value as 'A' | 'B' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                    >
                      <option value="A">Wing A</option>
                      <option value="B">Wing B</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Join Date *</label>
                    <input
                      type="date"
                      value={tenantForm.joinDate}
                      onChange={(e) => setTenantForm({ ...tenantForm, joinDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent (₹) *</label>
                    <input
                      type="number"
                      value={tenantForm.rent}
                      onChange={(e) => setTenantForm({ ...tenantForm, rent: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                      min="0"
                      placeholder="Enter rent amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit (₹) *</label>
                    <input
                      type="number"
                      value={tenantForm.deposit}
                      onChange={(e) => setTenantForm({ ...tenantForm, deposit: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                      min="0"
                      placeholder="Enter deposit amount"
                    />
                  </div>
                  <div className="md:col-span-2 border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input placeholder="Address Line 1" className="px-4 py-2 border rounded" value={tenantForm.address.line1} onChange={e=>setTenantForm({...tenantForm, address:{...tenantForm.address, line1:e.target.value}})} />
                      <input placeholder="Address Line 2" className="px-4 py-2 border rounded" value={tenantForm.address.line2} onChange={e=>setTenantForm({...tenantForm, address:{...tenantForm.address, line2:e.target.value}})} />
                      <input placeholder="City" className="px-4 py-2 border rounded" value={tenantForm.address.city} onChange={e=>setTenantForm({...tenantForm, address:{...tenantForm.address, city:e.target.value}})} />
                      <input placeholder="State" className="px-4 py-2 border rounded" value={tenantForm.address.state} onChange={e=>setTenantForm({...tenantForm, address:{...tenantForm.address, state:e.target.value}})} />
                      <input placeholder="PIN/ZIP" className="px-4 py-2 border rounded" value={tenantForm.address.zip} onChange={e=>setTenantForm({...tenantForm, address:{...tenantForm.address, zip:e.target.value}})} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Identity Proof</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select value={tenantForm.idProof.type} onChange={e=>setTenantForm({...tenantForm, idProof:{...tenantForm.idProof, type:e.target.value as any}})} className="px-4 py-2 border rounded">
                        <option value="aadhar">Aadhar</option>
                        <option value="passport">Passport</option>
                        <option value="pancard">PAN Card</option>
                        <option value="other">Other</option>
                      </select>
                      <input placeholder="Proof Number" value={tenantForm.idProof.number} onChange={e=>setTenantForm({...tenantForm, idProof:{...tenantForm.idProof, number:e.target.value}})} className="px-4 py-2 border rounded" />
                      <div>
                        <input type="file" accept="image/*" onChange={(e)=>{
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const base64 = reader.result as string;
                            setTenantForm({...tenantForm, idProof:{...tenantForm.idProof, image: base64}});
                          };
                          reader.readAsDataURL(file);
                        }} className="block w-full text-sm text-gray-700" />
                        {tenantForm.idProof.image && (
                          <img src={tenantForm.idProof.image} alt="ID Preview" className="mt-2 h-16 object-cover rounded border cursor-pointer" onClick={()=>setImagePreview(tenantForm.idProof.image)} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
                      <input
                        type="text"
                        value={tenantForm.emergencyContact.name}
                        onChange={(e) => setTenantForm({
                          ...tenantForm,
                          emergencyContact: { ...tenantForm.emergencyContact, name: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone *</label>
                      <input
                        type="tel"
                        value={tenantForm.emergencyContact.phone}
                        onChange={(e) => setTenantForm({
                          ...tenantForm,
                          emergencyContact: { ...tenantForm.emergencyContact, phone: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
                      <select
                        value={tenantForm.emergencyContact.relation}
                        onChange={(e) => setTenantForm({
                          ...tenantForm,
                          emergencyContact: { ...tenantForm.emergencyContact, relation: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Relationship</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Friend">Friend</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setIsEditing(false);
                      setEditingTenant(null);
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
                    <span>{saving ? 'Saving...' : (isEditing ? 'Update Tenant' : 'Add Tenant')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {imagePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={()=>setImagePreview(null)}>
            <div className="bg-white p-3 rounded shadow max-w-3xl w-full mx-4" onClick={e=>e.stopPropagation()}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">ID Proof</h4>
                <button className="text-gray-500 hover:text-gray-700" onClick={()=>setImagePreview(null)}>✕</button>
              </div>
              <div className="max-h-[70vh] overflow-auto flex justify-center">
                <img src={imagePreview} alt="ID Full" className="max-h-[70vh] object-contain" />
              </div>
              <div className="mt-3 text-right">
                <a href={imagePreview} download={`id-proof-${Date.now()}.png`} className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded">Download</a>
              </div>
            </div>
          </div>
        )}
 
 
      </div>
    );
  } catch (error) {
    console.error('Error in Tenants component:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="mb-4">The Tenants component encountered an error. Please check the console for details.</p>
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

export default Tenants;