import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Wifi, Shield, Utensils, MapPin, Phone, Building } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    { icon: Check, text: 'Verified PGs' },
    { icon: Utensils, text: 'Food Included' },
    { icon: Shield, text: 'Safe & Secure' },
    { icon: Wifi, text: 'WiFi & Power Backup' },
    { icon: MapPin, text: 'Nearby Colleges / Offices Available' },
    { icon: Phone, text: 'Owner Contact Available' }
  ];

  const rooms = [
    {
      type: 'Single Sharing',
      price: 10000,
      amenities: ['AC', 'Attached Bath'],
      image: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      type: 'Single Sharing',
      price: 10000,
      amenities: ['AC', 'Attached Bath'],
      image: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      type: 'Single Sharing',
      price: 10000,
      amenities: ['AC', 'Attached Bath'],
      image: 'https://images.pexels.com/photos/271743/pexels-photo-271743.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // minimal contact capture from home page
      await (await import('../services/apiService')).apiService.createContact({
        name: formData.name,
        phone: formData.phone,
        message: formData.message,
        subject: 'Home page inquiry',
      });
      setFormData({ name: '', phone: '', message: '' });
      alert('Message sent! We will contact you.');
    } catch (err) {
      console.error('Home contact error', err);
      alert('Failed to send. Please try again.');
    }
  };

  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen bg-gradient-to-r from-black/50 to-black/30">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200)'
          }}
        />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-8">
              Find Your Perfect Stay
            </h1>
            <Link
              to="/rooms"
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-block"
            >
              Check Available Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-4 p-6 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-medium text-gray-900">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Rooms */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Available Rooms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <img 
                  src={room.image} 
                  alt={room.type}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{room.type}</h3>
                  <p className="text-2xl font-bold text-yellow-600 mb-4">
                    ₹ {room.price.toLocaleString()}/month
                  </p>
                  <div className="flex items-center space-x-2 mb-4">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">{room.amenities.join(', ')}</span>
                  </div>
                  <Link to="/contact" className="block">
                    <span className="w-full inline-block text-center bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors">Book Now</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Contact Us
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <textarea
                placeholder="Message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;