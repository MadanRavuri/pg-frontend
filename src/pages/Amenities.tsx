import React from 'react';
import { Link } from 'react-router-dom';
import { Wifi, Car, Utensils, Shield, Zap, Shirt, Tv, Dumbbell, Coffee, Phone, Camera, Clock } from 'lucide-react';

const Amenities: React.FC = () => {
  const amenities = [
    {
      icon: Wifi,
      title: 'High-Speed WiFi',
      description: 'Unlimited high-speed internet connectivity throughout the building',
      category: 'Technology'
    },
    {
      icon: Car,
      title: 'Parking',
      description: 'Secure parking space for bikes and cars',
      category: 'Convenience'
    },
    {
      icon: Utensils,
      title: 'Meals Included',
      description: 'Nutritious breakfast, lunch, and dinner prepared by our kitchen staff',
      category: 'Food'
    },
    {
      icon: Shield,
      title: '24/7 Security',
      description: 'Round-the-clock security with CCTV monitoring',
      category: 'Safety'
    },
    {
      icon: Zap,
      title: 'Power Backup',
      description: 'Uninterrupted power supply with generator backup',
      category: 'Utilities'
    },
    {
      icon: Shirt,
      title: 'Laundry Service',
      description: 'Professional laundry and dry cleaning services',
      category: 'Convenience'
    },
    {
      icon: Tv,
      title: 'Common TV Room',
      description: 'Shared entertainment area with cable TV and streaming services',
      category: 'Entertainment'
    },
    {
      icon: Dumbbell,
      title: 'Fitness Center',
      description: 'Well-equipped gym with modern exercise equipment',
      category: 'Health'
    },
    {
      icon: Coffee,
      title: 'Common Kitchen',
      description: 'Fully equipped kitchen for self-cooking with all appliances',
      category: 'Food'
    },
    {
      icon: Phone,
      title: 'Intercom Facility',
      description: 'Internal communication system for easy connectivity',
      category: 'Technology'
    },
    {
      icon: Camera,
      title: 'CCTV Monitoring',
      description: 'Complete surveillance system for enhanced security',
      category: 'Safety'
    },
    {
      icon: Clock,
      title: 'Flexible Timings',
      description: 'No strict curfew timings for working professionals',
      category: 'Convenience'
    }
  ];

  const categories = ['All', 'Technology', 'Convenience', 'Food', 'Safety', 'Utilities', 'Entertainment', 'Health'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredAmenities = selectedCategory === 'All' 
    ? amenities 
    : amenities.filter(amenity => amenity.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Amenities & Services</h1>
          <p className="text-xl text-gray-600">Experience comfort and convenience with our comprehensive facilities</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Amenities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAmenities.map((amenity, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <amenity.icon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{amenity.title}</h3>
                  <p className="text-gray-600 mb-3">{amenity.description}</p>
                  <span className="inline-block bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded">
                    {amenity.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="bg-yellow-50 rounded-lg p-8 mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Experience Premium Living?
          </h2>
          <p className="text-gray-600 mb-6">
            Join hundreds of satisfied residents who call Sunflower PG their home
          </p>
          <Link to="/contact" className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
            Book Your Room Today
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Amenities;