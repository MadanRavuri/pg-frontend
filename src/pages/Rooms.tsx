import React, { useState, useEffect } from 'react';
import { Check, Filter, Search } from 'lucide-react';
import { RoomService } from '../services/roomService';
import { TenantService } from '../services/tenantService';

const Rooms: React.FC = () => {
  const [priceRange, setPriceRange] = useState([5000, 25000]);
  const [roomType, setRoomType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const roomRes = await RoomService.getAllRooms();
      const tenantRes = await TenantService.getAllTenants();
  if (roomRes.success) setRooms(roomRes.data || []);
  if (tenantRes.success) setTenants(tenantRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Attach tenant info to rooms
  const roomsWithTenant = rooms.map(room => {
    const tenant = tenants.find(t => t.roomId?._id === room._id);
    return { ...room, tenant };
  });

  const filteredRooms = roomsWithTenant.filter(room => {
    const matchesPrice = room.rent >= priceRange[0] && room.rent <= priceRange[1];
    const matchesType = roomType === 'all' || room.type.toLowerCase().includes(roomType.toLowerCase());
    const matchesSearch = room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.amenities.some((amenity: string) => amenity.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesPrice && matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Available Rooms</h1>
          <p className="text-gray-600">Find your perfect accommodation with our wide range of options</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="single">Single Sharing</option>
                <option value="double">Double Sharing</option>
                <option value="triple">Triple Sharing</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">{filteredRooms.length} rooms found</p>
        </div>

        {/* Room Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center text-gray-500">Loading rooms...</div>
          ) : filteredRooms.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500">No rooms found.</div>
          ) : filteredRooms.map((room) => (
            <div key={room._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src={room.image || 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400'} 
                alt={room.type}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{room.type}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    room.status === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : room.status === 'occupied'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">Floor: {room.floor} | Wing: {room.wing}</p>
                <p className="text-2xl font-bold text-yellow-600 mb-4">
                  ₹ {room.rent?.toLocaleString()}/month
                </p>
                <div className="space-y-2 mb-4">
                  {room.amenities?.map((amenity: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
                {/* Tenant Info */}
                {room.status === 'occupied' && room.tenant ? (
                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <div className="font-semibold text-gray-800">Tenant:</div>
                    <div className="text-gray-700">{room.tenant.name}</div>
                    <div className="text-gray-500 text-sm">{room.tenant.email} | {room.tenant.phone}</div>
                  </div>
                ) : null}
                <button 
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    room.status === 'occupied'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={room.status !== 'occupied' || !room.tenant}
                  onClick={() => {
                    if (room.status === 'occupied' && room.tenant) {
                      window.location.href = `/admin/rent?payTenantId=${room.tenant._id}`;
                    }
                  }}
                >
                  {room.status === 'occupied' ? 'Pay Rent' : 'Not Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rooms;