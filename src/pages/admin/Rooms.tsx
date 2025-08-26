import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Users, Wrench, ArrowLeft, UserPlus, UserMinus, UserCheck, DollarSign, X, Save } from 'lucide-react';
import { useAdminView } from '../../context/AdminViewContext';
import { useLocation } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { useDataRefresh } from '../../context/DataRefreshContext';
import { format } from 'date-fns';

// Interfaces
interface Tenant {
  _id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: Date;
  rent: number;
  deposit: number;
  status: 'active' | 'inactive' | 'pending';
  roomId?: string | { _id: string; roomNumber: string; floor: number; wing: string };
  floor?: number;
  wing?: 'A' | 'B';
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  documents: {
    idProof?: string;
    photo?: string;
  };
}

interface Room {
  _id?: string;
  roomNumber: string;
  floor: number;
  type: string;
  capacity: number;
  currentOccupancy?: number;
  rent: number;
  status: 'available' | 'occupied' | 'maintenance';
  amenities: string[];
  tenantId?: Tenant;
  wing: 'A' | 'B';
  description?: string;
}

const Rooms: React.FC = () => {
  const [amenityInput, setAmenityInput] = useState('');
  const { view } = useAdminView();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialStatus = params.get('status') || 'all';
  
  // Get data refresh functions
  const { refreshTenants, refreshRentPayments, refreshTrigger } = useDataRefresh();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'floor'>('grid');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [roomForm, setRoomForm] = useState<Room>({
    roomNumber: '',
    floor: 1,
    type: '',
    capacity: 1,
    rent: 0,
    status: 'available',
    amenities: [],
    wing: 'A',
    description: '',
  });

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

  // Fetch all tenants from API
  const fetchAllTenants = async () => {
    try {
      const response = await apiService.getTenants();
      if (response && response.success) {
        setAllTenants(response.data);
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
    }
  };

  // Fetch rooms from API
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getRooms();
      if (response.success) {
        // Transform the data to match the frontend interface
        const transformedRooms = response.data.map((room: any) => {
          const capacity = room.capacity ?? (room.type === 'single' ? 1 : room.type === 'double' ? 2 : 3);
          // Count number of active tenants assigned to this room
          let currentOccupancy = 0;
          if (Array.isArray(room.tenants)) {
            currentOccupancy = room.tenants.filter((t: any) => t.status === 'active').length;
          } else if (room.tenantId && room.tenantId.status === 'active') {
            currentOccupancy = 1;
          } else if (room.tenantId) {
            currentOccupancy = 1;
          }
          // Status logic: occupied only if full, else available
          const status = currentOccupancy >= capacity ? 'occupied' : 'available';
          return {
            ...room,
            currentOccupancy,
            capacity,
            status,
          };
        });
        // Sort rooms by roomNumber (assuming numeric)
        transformedRooms.sort((a, b) => {
          const numA = parseInt(a.roomNumber, 10);
          const numB = parseInt(b.roomNumber, 10);
          return numA - numB;
        });
        setRooms(transformedRooms);
      } else {
        setError('Failed to fetch rooms');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchAllTenants();
  }, [refreshTrigger]); // Refetch when refreshTrigger changes

  // Get inactive tenants for the selected room
  const getInactiveTenantsForRoom = () => {
    if (!selectedRoom) return [];
    return allTenants.filter(tenant => 
      tenant.status === 'inactive' && 
      (typeof tenant.roomId === 'object' ? tenant.roomId._id : tenant.roomId) === selectedRoom._id
    );
  };

  // Handle room selection
  const handleRoomSelection = (roomId: string) => {
    const selectedRoomData = rooms.find(room => room._id === roomId);
    if (selectedRoomData) {
      setTenantForm({
        ...tenantForm,
        roomId,
        floor: selectedRoomData.floor.toString(),
        wing: selectedRoomData.wing,
        rent: selectedRoomData.rent.toString()
      });
    }
  };

  // Generate floors array dynamically
  const floors = Array.from({ length: 10 }, (_, i) => i + 1);

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.includes(searchTerm) ||
                         room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (room.tenantId && room.tenantId.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesFloor = selectedFloor === 'all' || room.floor.toString() === selectedFloor.replace('st', '').replace('nd', '').replace('rd', '').replace('th', '');
    const matchesType = selectedType === 'all' || room.type === selectedType;
    const matchesWing =
      view === 'dashboard' ||
      (view === 'wingA' && room.wing === 'A') ||
      (view === 'wingB' && room.wing === 'B');
    return matchesSearch && matchesStatus && matchesFloor && matchesType && matchesWing;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return '✓';
      case 'occupied': return '●';
      case 'maintenance': return '⚙️';
      default: return '⚪';
    }
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setViewMode('floor');
  };

  const handleAddTenant = () => {
    console.log('Adding tenant to room:', selectedRoom?.roomNumber); // Debug log
    
    if (!selectedRoom) {
      setError('Please select a room first');
      return;
    }

    // Reset form with room-specific data
    setTenantForm({
      name: '',
      email: '',
      phone: '',
      roomId: selectedRoom?._id || '',
      floor: selectedRoom?.floor?.toString() || '',
      wing: selectedRoom?.wing || 'A',
      joinDate: format(new Date(), 'yyyy-MM-dd'),
      rent: selectedRoom.rent?.toString() || '',
      deposit: '',
      address: { line1: '', line2: '', city: '', state: '', zip: '' },
      idProof: { type: 'aadhar', number: '', image: '' },
      emergencyContact: {
        name: '',
        phone: '',
        relation: ''
      }
    });
    
    setSelectedTenant(null);
    setIsEditing(false);
    setError(null); // Clear any previous errors
    setShowTenantModal(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    console.log('Editing tenant:', tenant.name); // Debug log
    
    setSelectedTenant(tenant);
    setIsEditing(true);
    setTenantForm({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      roomId: selectedRoom?._id || '',
      floor: tenant.floor?.toString() || '',
      wing: tenant.wing || 'A',
      joinDate: tenant.joinDate ? format(new Date(tenant.joinDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      rent: tenant.rent?.toString() || '',
      deposit: tenant.deposit?.toString() || '',
      address: (tenant as any).address || { line1: '', line2: '', city: '', state: '', zip: '' },
      idProof: (tenant as any).idProof || { type: 'aadhar', number: '', image: '' },
      emergencyContact: tenant.emergencyContact
    });
    setError(null);
    setShowTenantModal(true);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (confirm('Are you sure you want to delete this tenant?')) {
      try {
        setError(null);
        setSaving(true);
        const response = await apiService.deleteTenant(tenantId);
        if (response.success) {
          await fetchRooms(); // Refresh rooms data
          alert('Tenant deleted successfully');
        } else {
          setError('Failed to delete tenant');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete tenant');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving tenant:', tenantForm); // Debug log
    
    try {
      setSaving(true);
      setError(null);
      
      // Validate required fields
      if (!tenantForm.name || !tenantForm.email || !tenantForm.phone) {
        setError('Please fill in all required fields');
        return;
      }

      if (!tenantForm.emergencyContact.name || !tenantForm.emergencyContact.phone || !tenantForm.emergencyContact.relation) {
        setError('Please fill in all emergency contact fields');
        return;
      }

      // Prepare tenant data with room info
      const tenantData = {
        ...tenantForm,
        roomId: selectedRoom?._id,
        floor: selectedRoom?.floor,
        wing: selectedRoom?.wing,
        joinDate: new Date(),
      };

      if (isEditing && selectedTenant) {
        const response = await apiService.updateTenant(selectedTenant._id, tenantData);
        if (response.success) {
          await fetchRooms(); // Refresh rooms data
          alert('Tenant updated successfully');
          setShowTenantModal(false);
        } else {
          setError('Failed to update tenant');
          return;
        }
      } else {
        const response = await apiService.createTenant(tenantData);
        if (response.success) {
          await fetchRooms(); // Refresh rooms data
          alert('Tenant added successfully');
          setShowTenantModal(false);
        } else {
          setError('Failed to add tenant');
          return;
        }
      }
    } catch (err) {
      console.error('Error saving tenant:', err); // Debug log
      setError(err instanceof Error ? err.message : 'Failed to save tenant');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRoom = () => {
    console.log('Adding new room'); // Debug log
    
    setIsEditingRoom(false);
    setSelectedRoom(null); // Clear selected room for new room creation
    setRoomForm({
      roomNumber: '',
      floor: 1,
      type: 'single', // Default to single
      capacity: 1,
      rent: 0,
      status: 'available',
      amenities: [],
      wing: 'A',
      description: '',
    });
    setError(null);
    setShowRoomModal(true);
  };

  const handleEditRoom = (room: Room) => {
    console.log('Editing room:', room.roomNumber); // Debug log
    
    setIsEditingRoom(true);
    setSelectedRoom(room);
    setRoomForm({
      _id: room._id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      type: room.type,
      capacity: room.capacity,
      rent: room.rent,
      status: room.status,
      amenities: room.amenities || [],
      wing: room.wing,
      description: room.description || '',
    });
    setError(null);
    setShowRoomModal(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (confirm('Are you sure you want to delete this room? This will also remove any associated tenants.')) {
      try {
        setError(null);
        setSaving(true);
        const response = await apiService.deleteRoom(roomId);
        if (response.success) {
          await fetchRooms(); // Refresh rooms data
          alert('Room deleted successfully');
          // Trigger refresh in other components
          refreshTenants();
          refreshRentPayments();
        } else {
          setError('Failed to delete room');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete room');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving room:', roomForm); // Debug log
    
    try {
      setSaving(true);
      setError(null);
      
      // Validate required fields
      if (!roomForm.roomNumber || !roomForm.type || !roomForm.rent) {
        setError('Please fill in all required fields');
        return;
      }

      // Set capacity based on room type if not manually set
      const roomData = {
        ...roomForm,
        capacity: roomForm.type === 'single' ? 1 : roomForm.type === 'double' ? 2 : roomForm.type === 'triple' ? 3 : roomForm.capacity
      };
      
      if (isEditingRoom && selectedRoom?._id) {
        const response = await apiService.updateRoom(selectedRoom._id, roomData);
        if (response.success) {
          await fetchRooms(); // Refresh rooms data
          alert('Room updated successfully');
          setShowRoomModal(false);
          // Trigger refresh in other components
          refreshTenants();
          refreshRentPayments();
        } else {
          setError('Failed to update room');
          return;
        }
      } else {
        const response = await apiService.createRoom(roomData);
        if (response.success) {
          await fetchRooms(); // Refresh rooms data
          alert('Room added successfully');
          setShowRoomModal(false);
          // Trigger refresh in other components
          refreshTenants();
          refreshRentPayments();
        } else {
          setError('Failed to add room');
          return;
        }
      }
    } catch (err) {
      console.error('Error saving room:', err); // Debug log
      setError(err instanceof Error ? err.message : 'Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  const getTenantStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Reset filters function
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSelectedFloor('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading rooms...</div>
      </div>
    );
  }

  if (error && !showTenantModal && !showRoomModal) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">Error: {error}</div>
        <button 
          onClick={fetchRooms}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (viewMode === 'floor' && selectedRoom) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setViewMode('grid');
              setSelectedRoom(null);
            }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Rooms</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Room {selectedRoom.roomNumber} - {selectedRoom.floor} Floor</h1>
        </div>

        {/* Room Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room Number:</span>
                  <span className="font-medium">{selectedRoom.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Floor:</span>
                  <span className="font-medium">{selectedRoom.floor} Floor</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{selectedRoom.type} Sharing</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{selectedRoom.currentOccupancy}/{selectedRoom.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rent:</span>
                  <span className="font-medium">₹{selectedRoom.rent.toLocaleString()}/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRoom.status)}`}>
                    {getStatusIcon(selectedRoom.status)}
                    <span className="ml-1">{selectedRoom.status}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {selectedRoom.amenities && selectedRoom.amenities.map((amenity, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleAddTenant}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving || (typeof selectedRoom.currentOccupancy === 'number' && typeof selectedRoom.capacity === 'number' ? selectedRoom.currentOccupancy >= selectedRoom.capacity : true)}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Tenant</span>
                </button>
                <button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                  onClick={() => handleEditRoom(selectedRoom)}
                  disabled={saving}
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Room</span>
                </button>
                <button
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                  onClick={() => {
                    if (selectedRoom && selectedRoom._id) {
                      handleDeleteRoom(selectedRoom._id);
                    } else {
                      setError('Room ID is missing.');
                    }
                  }}
                  disabled={saving}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Room</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tenants List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Active Tenants ({selectedRoom.tenantId ? 1 : 0})
            </h3>
          </div>
          
          {!selectedRoom.tenantId ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tenant in this room</p>
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
                      Join Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rent & Deposit
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
                  <tr
                    className="hover:bg-yellow-50 cursor-pointer"
                    onClick={() => handleEditTenant(selectedRoom.tenantId!)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{selectedRoom.tenantId.name}</div>
                        <div className="text-sm text-gray-500">{selectedRoom.tenantId.email}</div>
                        <div className="text-sm text-gray-500">{selectedRoom.tenantId.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {selectedRoom.tenantId.joinDate ? new Date(selectedRoom.tenantId.joinDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Rent: ₹{selectedRoom.tenantId.rent ? selectedRoom.tenantId.rent.toLocaleString() : '0'}</div>
                      <div className="text-sm text-gray-500">Deposit: ₹{selectedRoom.tenantId.deposit ? selectedRoom.tenantId.deposit.toLocaleString() : '0'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTenantStatusColor(selectedRoom.tenantId.status || 'unknown')}`}> 
                        {selectedRoom.tenantId.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <a
                        href={`/admin/rent?payTenantId=${selectedRoom.tenantId._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-700 hover:bg-green-500/20 border border-green-500/30"
                        onClick={(e)=>e.stopPropagation()}
                        title="Pay Rent"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">Pay</span>
                      </a>
                      <button 
                        onClick={e => {
                          e.stopPropagation();
                          handleEditTenant(selectedRoom.tenantId!);
                        }}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit Tenant"
                        disabled={saving}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async e => {
                          e.stopPropagation();
                          try {
                            setSaving(true);
                            const newStatus = (selectedRoom.tenantId as any).status === 'active' ? 'inactive' : 'active';
                            const res = await apiService.updateTenant((selectedRoom.tenantId as any)._id, { status: newStatus });
                            if (res && (res as any).success) await fetchRooms();
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className={`px-2 py-1 rounded ${(selectedRoom.tenantId as any).status === 'active' ? 'text-blue-600 hover:text-blue-900 bg-blue-50' : 'text-green-700 hover:text-green-900 bg-green-50'}`}
                        title={(selectedRoom.tenantId as any).status === 'active' ? 'Make Inactive' : 'Make Active'}
                        disabled={saving}
                      >
                        {(selectedRoom.tenantId as any).status === 'active' ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteTenant((selectedRoom.tenantId as any)._id);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Tenant"
                        disabled={saving}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inactive Tenants List */}
        {getInactiveTenantsForRoom().length > 0 && (
          <div className="bg-white rounded-lg shadow-md mt-6">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Inactive Tenants ({getInactiveTenantsForRoom().length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rent & Deposit
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
                  {getInactiveTenantsForRoom().map((tenant) => (
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
                        {tenant.joinDate ? new Date(tenant.joinDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Rent: ₹{tenant.rent ? tenant.rent.toLocaleString() : '0'}</div>
                        <div className="text-sm text-gray-500">Deposit: ₹{tenant.deposit ? tenant.deposit.toLocaleString() : '0'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTenantStatusColor(tenant.status || 'unknown')}`}> 
                          {tenant.status || 'unknown'}
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
                          disabled={saving}
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
                              if (res && (res as any).success) await fetchRooms();
                            } finally {
                              setSaving(false);
                            }
                          }}
                          className={`px-2 py-1 rounded ${tenant.status === 'active' ? 'text-blue-600 hover:text-blue-900 bg-blue-50' : 'text-green-700 hover:text-green-900 bg-green-50'}`}
                          title={tenant.status === 'active' ? 'Make Inactive' : 'Make Active'}
                          disabled={saving}
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
                          disabled={saving}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tenant Modal */}
        {showTenantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Tenant' : 'Add New Tenant'}
                </h3>
                <button
                  onClick={() => setShowTenantModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={saving}
                >
                  ×
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
                      disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room Number *</label>
                    <select
                      value={tenantForm.roomId}
                      onChange={(e) => handleRoomSelection(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                      disabled={saving}
                    >
                      <option value="">Select Room</option>
                      {rooms.map(room => (
                        <option key={room._id} value={room._id} disabled={room.status !== 'available'}>
                          Room {room.roomNumber} - {room.floor} Floor - Wing {room.wing} {room.status !== 'available' ? '(Occupied)' : ''}
                        </option>
                      ))}
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
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wing</label>
                    <select
                      value={tenantForm.wing}
                      onChange={(e) => setTenantForm({ ...tenantForm, wing: e.target.value as 'A' | 'B' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                      disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
                    />
                  </div>
                  <div className="md:col-span-2 border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input placeholder="Address Line 1" className="px-4 py-2 border rounded" value={tenantForm.address.line1} onChange={e=>setTenantForm({...tenantForm, address:{...tenantForm.address, line1:e.target.value}})} disabled={saving} />
                      <input placeholder="Address Line 2" className="px-4 py-2 border rounded" value={tenantForm.address.line2} onChange={e=>setTenantForm({...tenantForm, address:{...tenantForm.address, line2:e.target.value}})} disabled={saving} />
                      <input placeholder="City" className="px-4 py-2 border rounded" value={tenantForm.address.city} onChange={e=>setTenantForm({...tenantForm, address:{...tenantForm.address, city:e.target.value}})} disabled={saving} />
                      <input placeholder="State" className="px-4 py-2 border rounded" value={tenantForm.address.state} onChange={e=>setTenantForm({...tenantForm, address:{...tenantForm.address, state:e.target.value}})} disabled={saving} />
                      <input placeholder="PIN/ZIP" className="px-4 py-2 border rounded" value={tenantForm.address.zip} onChange={e=>setTenantForm({...tenantForm, address:{...tenantForm.address, zip:e.target.value}})} disabled={saving} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Identity Proof</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select value={tenantForm.idProof.type} onChange={e=>setTenantForm({...tenantForm, idProof:{...tenantForm.idProof, type:e.target.value as any}})} className="px-4 py-2 border rounded" disabled={saving}>
                        <option value="aadhar">Aadhar</option>
                        <option value="passport">Passport</option>
                        <option value="pancard">PAN Card</option>
                        <option value="other">Other</option>
                      </select>
                      <input placeholder="Proof Number" value={tenantForm.idProof.number} onChange={e=>setTenantForm({...tenantForm, idProof:{...tenantForm.idProof, number:e.target.value}})} className="px-4 py-2 border rounded" disabled={saving} />
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
                        }} className="block w-full text-sm text-gray-700" disabled={saving} />
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
                        disabled={saving}
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
                        disabled={saving}
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
                        disabled={saving}
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
                    onClick={() => setShowTenantModal(false)}
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
        
        {/* Room Modal for Add/Edit Room */}
        {showRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditingRoom ? 'Edit Room' : 'Add New Room'}
                </h3>
                <button
                  onClick={() => setShowRoomModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={saving}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSaveRoom} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800">{error}</div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room Number *</label>
                    <input
                      type="text"
                      value={roomForm.roomNumber}
                      onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Floor *</label>
                    <input
                      type="number"
                      value={roomForm.floor}
                      onChange={e => setRoomForm({ ...roomForm, floor: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                      min="1"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                    <select
                      value={roomForm.type}
                      onChange={e => setRoomForm({ ...roomForm, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                      disabled={saving}
                    >
                      <option value="">Select Type</option>
                      <option value="single">Single</option>
                      <option value="double">Double</option>
                      <option value="triple">Triple</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
                    <input
                      type="number"
                      value={roomForm.capacity}
                      onChange={e => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                      min="1"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rent (₹) *</label>
                    <input
                      type="number"
                      value={roomForm.rent}
                      onChange={e => setRoomForm({ ...roomForm, rent: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                      min="0"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <select
                      value={roomForm.status}
                      onChange={e => setRoomForm({ ...roomForm, status: e.target.value as 'available' | 'occupied' | 'maintenance' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                      disabled={saving}
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wing *</label>
                    <select
                      value={roomForm.wing}
                      onChange={e => setRoomForm({ ...roomForm, wing: e.target.value as 'A' | 'B' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                      disabled={saving}
                    >
                      <option value="A">Wing A</option>
                      <option value="B">Wing B</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amenities (comma separated)</label>
                    <input
                      type="text"
                      value={roomForm.amenities.join(', ')}
                      onChange={e => setRoomForm({ ...roomForm, amenities: e.target.value.split(',').map(a => a.trim()).filter(Boolean) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="e.g. AC, WiFi, Balcony"
                      disabled={saving}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={roomForm.description || ''}
                      onChange={e => setRoomForm({ ...roomForm, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      rows={3}
                      placeholder="Optional room description..."
                      disabled={saving}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowRoomModal(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (isEditingRoom ? 'Save Changes' : 'Add Room')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Rooms Management</h1>
        <div className="flex space-x-2">
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
            onClick={handleAddRoom}
            disabled={saving}
          >
            <Plus className="w-4 h-4" />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {/* Global error display */}
      {error && !showTenantModal && !showRoomModal && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900">{rooms.filter(r => (view === 'dashboard') || (view === 'wingA' && r.wing === 'A') || (view === 'wingB' && r.wing === 'B')).length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{rooms.filter(r => r.status === 'available' && ((view === 'dashboard') || (view === 'wingA' && r.wing === 'A') || (view === 'wingB' && r.wing === 'B'))).length}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-blue-600">{rooms.filter(r => r.status === 'occupied' && ((view === 'dashboard') || (view === 'wingA' && r.wing === 'A') || (view === 'wingB' && r.wing === 'B'))).length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-yellow-600">{rooms.filter(r => r.status === 'maintenance' && ((view === 'dashboard') || (view === 'wingA' && r.wing === 'A') || (view === 'wingB' && r.wing === 'B'))).length}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Floors</option>
              {floors.map(floor => (
                <option key={floor} value={floor}>{floor} Floor</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
              onClick={resetFilters}
            >
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">{filteredRooms.length} rooms found</p>
        {selectedFloor !== 'all' && (
          <p className="text-sm text-gray-500">Showing rooms on {selectedFloor} floor</p>
        )}
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <div
            key={room._id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleRoomClick(room)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Room {room.roomNumber}</h3>
                <p className="text-sm text-gray-600">{room.floor} Floor • {room.type} Sharing</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(room.status)}`}>
                  {getStatusIcon(room.status)}
                  <span className="ml-1">{room.status}</span>
                </span>
                {view === 'dashboard' && room.wing && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${room.wing === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    Wing {room.wing}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Capacity:</span>
                <span className="font-medium">{room.currentOccupancy || 0}/{room.capacity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rent:</span>
                <span className="font-medium">₹{room.rent ? room.rent.toLocaleString() : '0'}/month</span>
              </div>
              {room.tenantId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tenant:</span>
                  <span className="font-medium">{room.tenantId.name}</span>
                </div>
              )}
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Amenities:</p>
              <div className="flex flex-wrap gap-1">
                {room.amenities && room.amenities.map((amenity, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Room Modal for Add/Edit Room (Unified) */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditingRoom ? 'Edit Room' : 'Add New Room'}
              </h3>
              <button
                onClick={() => setShowRoomModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={saving}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveRoom} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-red-800">{error}</div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room Number *</label>
                  <input
                    type="text"
                    value={roomForm.roomNumber}
                    onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Floor *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={roomForm.floor === 0 ? '' : roomForm.floor}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setRoomForm({ ...roomForm, floor: val ? parseInt(val) : 0 });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={roomForm.type}
                    onChange={e => setRoomForm({ ...roomForm, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                    disabled={saving}
                  >
                    <option value="">Select Type</option>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={roomForm.capacity === 0 ? '' : roomForm.capacity}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setRoomForm({ ...roomForm, capacity: val ? parseInt(val) : 0 });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rent (₹) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={roomForm.rent === 0 ? '' : roomForm.rent}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setRoomForm({ ...roomForm, rent: val ? parseInt(val) : 0 });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select
                    value={roomForm.status}
                    onChange={e => setRoomForm({ ...roomForm, status: e.target.value as 'available' | 'occupied' | 'maintenance' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                    disabled={saving}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wing *</label>
                  <select
                    value={roomForm.wing}
                    onChange={e => setRoomForm({ ...roomForm, wing: e.target.value as 'A' | 'B' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                    disabled={saving}
                  >
                    <option value="A">Wing A</option>
                    <option value="B">Wing B</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {roomForm.amenities.map((amenity, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded flex items-center gap-1">
                        {amenity}
                        <button
                          type="button"
                          className="ml-1 text-red-500 hover:text-red-700"
                          onClick={() => setRoomForm({
                            ...roomForm,
                            amenities: roomForm.amenities.filter((_, i) => i !== idx)
                          })}
                          disabled={saving}
                        >×</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={amenityInput}
                    onChange={e => setAmenityInput(e.target.value)}
                    onKeyDown={e => {
                      if ((e.key === 'Enter' || e.key === ',') && amenityInput.trim()) {
                        setRoomForm({
                          ...roomForm,
                          amenities: [...roomForm.amenities, amenityInput.trim()]
                        });
                        setAmenityInput('');
                        e.preventDefault();
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Type amenity and press Enter or comma"
                    disabled={saving}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={roomForm.description || ''}
                    onChange={e => setRoomForm({ ...roomForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    rows={3}
                    placeholder="Optional room description..."
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (isEditingRoom ? 'Save Changes' : 'Add Room')}
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
};

export default Rooms;