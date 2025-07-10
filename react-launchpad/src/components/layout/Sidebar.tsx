import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Plus, 
  Download,
  Users, 
  Clock, 
  CheckSquare, 
  CreditCard, 
  MessageSquare,
  User,
  Kanban,
  Upload,
  DollarSign,
  Star,
  Settings
} from 'lucide-react';

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const clientMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/client/dashboard' },
    { icon: Plus, label: 'Create Project', path: '/client/create-project' },
    { icon: Download, label: 'Deliverables', path: '/client/deliverables' },
    { icon: Kanban, label: 'View Tasks', path: '/client/tasks/1' },
    { icon: Users, label: 'Find Freelancers', path: '/client/freelancer-suggestions/1' },
    { icon: Clock, label: 'Time Logs', path: '/client/hourly-logs/1' },
    { icon: CheckSquare, label: 'Approve Timesheets', path: '/client/timesheet-approval/1' },
    { icon: CheckSquare, label: 'Milestones', path: '/client/milestones/1' },
    { icon: CreditCard, label: 'Payments', path: '/client/payment/1' },
    { icon: MessageSquare, label: 'Messages', path: '/chat/1' },
  ];

  const freelancerMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/freelancer/dashboard' },
    { icon: User, label: 'Profile Setup', path: '/freelancer/profile' },
    { icon: Kanban, label: 'Task Board', path: '/freelancer/kanban/1' },
    { icon: Clock, label: 'Submit Timesheet', path: '/freelancer/submit-timesheet/1' },
    { icon: Upload, label: 'Submit Work', path: '/freelancer/submit-deliverables/1' },
    { icon: DollarSign, label: 'Earnings', path: '/freelancer/payment' },
    { icon: MessageSquare, label: 'Messages', path: '/chat/1' },
    { icon: Star, label: 'Feedback', path: '/feedback/1' },
  ];

  const menuItems = user.role === 'client' ? clientMenuItems : freelancerMenuItems;

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 sm:p-6">
        <nav className="space-y-1 sm:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           (item.path.includes(':') && location.pathname.includes(item.path.split('/')[2]));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 