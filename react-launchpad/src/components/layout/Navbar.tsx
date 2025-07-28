import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Rocket, Bell, Settings, LogOut, Check } from 'lucide-react';
import { fetchClientProfile, fetchPlatformProfile } from '../../apiendpoints';
import { getNotifications, markNotificationRead } from '../../apiendpoints';

function renderMessage(msg) {
  if (!msg || typeof msg !== 'string') return null;
  const urlRegex = /(https?:\/\/[\S]+)/g;
  return msg.split(urlRegex).map((part, i) =>
    urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{part}</a>
      : part
  );
}

function getNotificationDate(createdAt) {
  if (!createdAt) return '';
  // If it's a string, try to parse as date
  if (typeof createdAt === 'string') {
    const d = new Date(createdAt);
    if (!isNaN(d)) return d.toLocaleString();
  }
  // If it's a number (ticks), convert to JS date
  if (typeof createdAt === 'number') {
    // .NET ticks to JS date
    const jsDate = new Date(createdAt / 10000 - 62135596800000);
    if (!isNaN(jsDate)) return jsDate.toLocaleString();
  }
  return 'Invalid Date';
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(false);

  console.log('User object in Navbar:', user);
  console.log('Profile picture URL:', user?.profilePicture);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getNotifications(user?.id ?? 0);
      setNotifications(data);
      console.log('Fetched notifications:', data); // Debug log
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optionally poll every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.Read) {
      await markNotificationRead(notification.Id);
      setNotifications((prev) => prev.map((n) => n.Id === notification.Id ? { ...n, Read: true } : n));
    }
    // If it's a meeting invite, you could navigate to the meeting room here
    // e.g., navigate(`/meeting/${notification.RelatedMeetingId}`)
  };

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.Read).length;

let profileData;

useEffect(() => {
  const fetchProfile = async () => {
if (user.role === 'client') {
  profileData = await fetchClientProfile(user.id ?? 0); // calls /client/profile
} else if (user.role === 'freelancer') {
  //profileData = await fetchFreelancerProfile(user.id); // calls /freelancer/profile
}
else if (user.role === 'admin') {
  profileData = await fetchPlatformProfile(user.id ?? 0);
  }
};
  fetchProfile();
}, [user]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={user.role === 'client' ? '/client/dashboard' : user.role === 'freelancer' ? '/freelancer/dashboard' : '/admin/dashboard'} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Project Launchpad
            </span>
          </Link>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
                onClick={() => setDropdownOpen((open) => !open)}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b font-semibold text-gray-700 flex items-center justify-between">
                    Notifications
                    {loading && <span className="text-xs text-gray-400 ml-2">Loading...</span>}
                  </div>
                  {notifications.length === 0 && !loading && (
                    <div className="p-4 text-gray-500 text-sm">No notifications</div>
                  )}
                  <ul>
                    {notifications.map((n, i) => {
                      console.log('Rendering notification:', n); // Debug log for each notification
                      return (
                        <li
                          key={n.Id || i}
                          className={`px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 flex items-start gap-2 ${!n.Read ? 'bg-blue-50' : ''}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          {!n.Read && <span className="mt-1"><Check className="w-4 h-4 text-blue-500" /></span>}
                          <div className="flex-1">
                            <div className="text-sm text-gray-800">{renderMessage(n.Message)}</div>
                            <div className="text-xs text-gray-400 mt-1">{getNotificationDate(n.CreatedAt)}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.firstName}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    console.log('Profile picture failed to load:', user.profilePicture);
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              {!user.profilePicture && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                  {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user.firstName}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link 
                to={user.role === 'freelancer' ? '/freelancer/profile' : '#'}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 