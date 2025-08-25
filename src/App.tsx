import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DatabaseProvider } from './context/DatabaseContext';
import { DataRefreshProvider } from './context/DataRefreshContext';
import DatabaseInitializer from './components/DatabaseInitializer';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import AdminLayout from './components/admin/AdminLayout';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import Amenities from './pages/Amenities';
import Contact from './pages/Contact';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Tenants from './pages/admin/Tenants';
import RoomsAdmin from './pages/admin/Rooms';
import RentManagement from './pages/admin/RentManagement';
import RentManagementV2 from './pages/admin/RentManagementV2';
import Expenses from './pages/admin/Expenses';
import Settings from './pages/admin/Settings';

function App() {
  return (
    <DatabaseInitializer>
      <DatabaseProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={
                  <>
                    <Header />
                    <Home />
                    <Footer />
                  </>
                } />
                <Route path="/rooms" element={
                  <>
                    <Header />
                    <Rooms />
                    <Footer />
                  </>
                } />
                <Route path="/amenities" element={
                  <>
                    <Header />
                    <Amenities />
                    <Footer />
                  </>
                } />
                <Route path="/contact" element={
                  <>
                    <Header />
                    <Contact />
                    <Footer />
                  </>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <DataRefreshProvider>
                      <AdminLayout />
                    </DataRefreshProvider>
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="tenants" element={<Tenants />} />
                  <Route path="rooms" element={<RoomsAdmin />} />
                  <Route path="rent" element={<RentManagement />} />
                  <Route path="rent-v2" element={<RentManagementV2 />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </DatabaseProvider>
    </DatabaseInitializer>
  );
}

export default App;