import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/avatar';
import { 
  Rocket, 
  Search, 
  Bell, 
  Menu, 
  X,
  LayoutDashboard,
  Plus,
  FolderOpen,
  CreditCard,
  MessageCircle,
  Settings,
  Inbox,
  LogOut
} from 'lucide-react';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const clientNavItems = [
    { path: '/client/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/client/create-project', icon: Plus, label: 'Create Project' },
    { path: '/client/projects', icon: FolderOpen, label: 'My Projects' },
    { path: '/client/payments', icon: CreditCard, label: 'Payments' },
    { path: '/client/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/client/settings', icon: Settings, label: 'Settings' }
  ];

  const freelancerNavItems = [
    { path: '/freelancer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/freelancer/requests', icon: Inbox, label: 'Project Requests' },
    { path: '/freelancer/projects', icon: FolderOpen, label: 'My Projects' },
    { path: '/freelancer/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/freelancer/settings', icon: Settings, label: 'Settings' }
  ];

  const navItems = user?.role === 'client' ? clientNavItems : freelancerNavItems;

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-2">
            <Rocket className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Launchpad</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors
                  ${isActive ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600' : 'text-gray-700'}
                `}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects, tasks..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative text-gray-400 hover:text-gray-600">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="relative group">
              <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                <Avatar src={user?.avatar} alt={user?.firstName} size="sm" />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.firstName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </button>
              
              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}