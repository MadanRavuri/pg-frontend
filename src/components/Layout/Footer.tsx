import React from 'react';
import { Flower2, Phone, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <Flower2 className="w-5 h-5 text-yellow-800" />
              </div>
              <span className="text-lg font-bold">Sunflower PG</span>
            </div>
            <p className="text-gray-400">
              Your trusted partner for comfortable and affordable PG accommodations.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Rooms</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Amenities</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Single Rooms</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Shared Rooms</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Meal Plans</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Laundry</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400">+91 9876543210</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400">info@sunflowerpg.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400">123 Main Street, City</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">© 2025 Sunflower PG Services. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;