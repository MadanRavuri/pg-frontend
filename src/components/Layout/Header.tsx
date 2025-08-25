import React from 'react';
import { Link } from 'react-router-dom';
import { Flower2 } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-yellow-800" />
            </div>
            <span className="text-xl font-bold text-gray-900">Sunflower PG Services</span>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-900 hover:text-yellow-600 transition-colors">
              Home
            </Link>
            <Link to="/rooms" className="text-gray-900 hover:text-yellow-600 transition-colors">
              Rooms
            </Link>
            <Link to="/amenities" className="text-gray-900 hover:text-yellow-600 transition-colors">
              Amenities
            </Link>
            <Link to="/contact" className="text-gray-900 hover:text-yellow-600 transition-colors">
              Contact
            </Link>
          </nav>

          <Link
            to="/admin"
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Admin Panel
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;