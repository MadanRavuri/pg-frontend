import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  CreditCard,
  Receipt,
  Settings, 
  LogOut,
  Bell,
  Menu,
  X,
  Flower2,
  User,
  Shield
} from 'lucide-react';
import { AdminViewProvider, useAdminView } from '../../context/AdminViewContext';
import SettingsModal from './SettingsModal'; // Added import for SettingsModal

const TopNav: React.FC = () => {
  const { view, setView } = useAdminView();
  const navItems = [
    { key: 'dashboard', label: 'Overall' },
    { key: 'wingA', label: 'Wing A' },
    { key: 'wingB', label: 'Wing B' },
  ];
  return (
    <nav className="flex space-x-4">
      {navItems.map((item) => (
        <button
          key={item.key}
          onClick={() => setView(item.key as any)}
          className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
            view === item.key
              ? 'bg-yellow-500 text-white shadow'
              : 'bg-gray-100 text-gray-700 hover:bg-yellow-100'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};

const AdminLayoutContent: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showUserDropdown, setShowUserDropdown] = React.useState(false); // Added state for user dropdown
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false); // Added state for settings modal
  const [settingsTab, setSettingsTab] = React.useState('profile'); // Added state for settings modal tab

  const menuItems = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/tenants', name: 'Tenants', icon: Users },
    { path: '/admin/rooms', name: 'Rooms', icon: Building },
    { path: '/admin/rent', name: 'Rent Management', icon: CreditCard },
    { path: '/admin/expenses', name: 'Expenses', icon: Receipt },
    // Removed Settings and Logout from sidebar
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Close dropdowns on outside click
  React.useEffect(() => {
    if (!showUserDropdown && !showNotifications) return;
    function handleClick(e: MouseEvent) {
      const userDropdown = document.getElementById('user-dropdown');
      const userBtn = document.getElementById('user-dropdown-btn');
      const notifDropdown = document.getElementById('notif-dropdown');
      const notifBtn = document.getElementById('notif-btn');
      if (
        userDropdown && !userDropdown.contains(e.target as Node) &&
        userBtn && !userBtn.contains(e.target as Node) &&
        notifDropdown && !notifDropdown.contains(e.target as Node) &&
        notifBtn && !notifBtn.contains(e.target as Node)
      ) {
        setShowUserDropdown(false);
        setShowNotifications(false);
      }
      if (
        userDropdown && !userDropdown.contains(e.target as Node) &&
        userBtn && !userBtn.contains(e.target as Node)
      ) {
        setShowUserDropdown(false);
      }
      if (
        notifDropdown && !notifDropdown.contains(e.target as Node) &&
        notifBtn && !notifBtn.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUserDropdown, showNotifications]);

  const handleOpenSettings = (tab: string) => {
    setSettingsTab(tab);
    setShowSettingsModal(true);
    setShowUserDropdown(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <Link 
            to="/" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-yellow-800" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Sunflower PG</h2>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-6 py-4 text-gray-700 hover:bg-yellow-50 hover:text-yellow-800 hover:border-r-4 hover:border-yellow-500 transition-all duration-200 ${
                location.pathname === item.path ? 'bg-yellow-50 text-yellow-800 border-r-4 border-yellow-500 font-medium' : ''
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Back to Homepage Button at Sidebar Bottom */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-white border-t border-gray-200">
          <Link
            to="/"
            className="block w-full text-center px-4 py-2 border border-yellow-500 text-yellow-600 rounded-lg font-medium hover:bg-yellow-50 transition text-base"
          >
            Back to Homepage
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="md:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              {/* Logo for mobile - clickable to go to home */}
              <Link 
                to="/" 
                className="md:hidden flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <Flower2 className="w-5 h-5 text-yellow-800" />
                </div>
                <span className="text-lg font-bold text-gray-900">Sunflower PG</span>
              </Link>
              {/* Top navbar for Dashboard, Wing A, Wing B */}
              <TopNav />
            </div>
            <div className="flex items-center space-x-4">
              <button
                id="notif-btn"
                className={`relative text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 ${showNotifications ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}`}
                onClick={() => {
                  setShowNotifications((v) => !v);
                  setShowUserDropdown(false);
                }}
                aria-haspopup="true"
                aria-expanded={showNotifications}
                tabIndex={0}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">3</span>
                </span>
                {showNotifications && (
                  <NotificationsDropdown />
                )}
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                {/* User Initial Dropdown */}
                <div className="relative">
                  <button
                    id="user-dropdown-btn"
                    className={`w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center focus:outline-none transition ring-2 ring-yellow-500/50 ${showUserDropdown ? 'ring-4 ring-yellow-500' : ''} hover:ring-4 hover:ring-yellow-400`}
                    onClick={() => setShowUserDropdown((v) => !v)}
                    aria-haspopup="true"
                    aria-expanded={showUserDropdown}
                    tabIndex={0}
                  >
                    <span className="text-sm font-medium text-yellow-800">
                      {user?.name?.charAt(0) || 'A'}
                    </span>
                  </button>
                  {showUserDropdown && (
                    <div id="user-dropdown" className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 border border-gray-100">
                      <div className="py-2">
                        <button
                          className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-yellow-50"
                          onClick={() => handleOpenSettings('profile')}
                        >
                          <User className="w-4 h-4 mr-2" /> Profile
                        </button>
                        <button
                          className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-yellow-50"
                          onClick={() => handleOpenSettings('pg')}
                        >
                          <Building className="w-4 h-4 mr-2" /> PG Settings
                        </button>
                        <button
                          className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-yellow-50"
                          onClick={() => handleOpenSettings('notifications')}
                        >
                          <Bell className="w-4 h-4 mr-2" /> Notifications
                        </button>
                        <button
                          className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-yellow-50"
                          onClick={() => handleOpenSettings('security')}
                        >
                          <Shield className="w-4 h-4 mr-2" /> Security
                        </button>
                        <button
                          className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-yellow-50"
                          onClick={() => handleOpenSettings('system')}
                        >
                          <Settings className="w-4 h-4 mr-2" /> System
                        </button>
                        <div className="border-t my-2" />
                        <button
                          className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-yellow-50"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 mr-2" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
        {/* Page content */}
        <main className="p-6">
          <Outlet />
          {/* Settings Modal */}
          {showSettingsModal && (
            <SettingsModal
              activeTab={settingsTab}
              onClose={() => setShowSettingsModal(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
};

const AdminLayout: React.FC = () => (
  <AdminViewProvider>
    <AdminLayoutContent />
  </AdminViewProvider>
);

export default AdminLayout;

// Lightweight notifications dropdown component that fetches contact messages
const NotificationsDropdown: React.FC = () => {
  const [messages, setMessages] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<any | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await (await import('../../services/apiService')).apiService.getContacts();
      if (res && (res as any).success) setMessages((res as any).data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const markRead = async (id: string) => {
    try {
      await (await import('../../services/apiService')).apiService.markContactRead(id);
      await load();
    } catch {}
  };

  return (
    <div id="notif-dropdown" className="absolute right-0 mt-2 w-[28rem] bg-white rounded-xl shadow-2xl z-50 border border-gray-200 transform transition-all duration-200 ease-out">
      <div className="py-4 px-6 text-gray-800 text-lg font-semibold border-b border-gray-100 flex items-center justify-between">
        <span>Notifications</span>
        <div className="flex items-center space-x-2">
          <button 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              // Mark all as read functionality
            }}
            title="Mark all as read"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(null);
            }}
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-2"></div>
            <p>Loading notifications...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.map((m) => (
              <div 
                key={m._id} 
                className={`p-4 cursor-pointer transition-all duration-200 hover:bg-yellow-50 ${!m.isRead ? 'bg-yellow-50/60 border-l-4 border-l-yellow-500' : 'border-l-4 border-l-transparent'}`} 
                onClick={() => setSelected(m)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${m.isRead ? 'bg-gray-300' : 'bg-yellow-500 animate-pulse'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-gray-900 truncate">
                        {m.name || m.email || m.phone || 'Contact'}
                      </div>
                      <div className="text-xs text-gray-500 ml-2 shrink-0">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-800 truncate mb-1">
                      {m.subject || '(No subject)'}
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2">
                      {m.message}
                    </div>
                    {!m.isRead && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          New
                        </span>
                        <button 
                          className="text-yellow-700 hover:text-yellow-900 text-xs font-medium hover:underline" 
                          onClick={(e)=>{
                            e.stopPropagation(); 
                            void markRead(m._id);
                          }}
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selected && (
        <div className="border-t border-gray-100 p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-900 text-lg">{selected.name || 'Contact'}</div>
            <button 
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                setSelected(null);
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-xs text-gray-500 mb-3">
            {new Date(selected.createdAt).toLocaleString()}
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-gray-800 whitespace-pre-wrap break-words text-sm leading-relaxed">
              {selected.subject && (
                <div className="font-semibold text-gray-900 mb-2">Subject: {selected.subject}</div>
              )}
              {selected.message}
            </div>
            {(selected.email || selected.phone) && (
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
                <div className="flex items-center space-x-4">
                  {selected.email && (
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {selected.email}
                    </div>
                  )}
                  {selected.phone && (
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {selected.phone}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};