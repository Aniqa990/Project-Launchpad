import React from 'react';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  FileText
} from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  activeProjects: number;
  projectsChange: number;
  pendingPayments: number;
  paymentsChange: number;
}

interface RecentActivity {
  id: string;
  type: 'payment' | 'project';
  description: string;
  timestamp: string;
  amount?: number;
  status: string;
}

const mockStats: DashboardStats = {
  totalRevenue: 125000,
  revenueChange: 12.5,
  activeProjects: 48,
  projectsChange: -2.3,
  pendingPayments: 15,
  paymentsChange: 8.1
};

const mockActivities: RecentActivity[] = [
  {
    id: '1',
    type: 'payment',
    description: 'Payment released for Website Design project',
    timestamp: '2024-01-15T10:30:00Z',
    amount: 2500,
    status: 'completed'
  },
  {
    id: '2',
    type: 'project',
    description: 'E-commerce Platform project completed',
    timestamp: '2024-01-15T08:45:00Z',
    amount: 8500,
    status: 'completed'
  },
  {
    id: '3',
    type: 'payment',
    description: 'Payment processing for Logo Design milestone',
    timestamp: '2024-01-14T16:20:00Z',
    amount: 750,
    status: 'processing'
  },
  {
    id: '4',
    type: 'project',
    description: 'Mobile App Development milestone submitted',
    timestamp: '2024-01-14T14:30:00Z',
    amount: 3200,
    status: 'submitted'
  }
];

interface DashboardProps {
  onNavigate?: (tab: 'payments') => void;
}

export function PlatformDashboard({ onNavigate }: DashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign className="w-4 h-4" />;
      case 'project': return <FileText className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'payment': return 'text-green-600 bg-green-50';
      case 'project': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'payments':
        onNavigate?.('payments');
        break;
      // case 'users':
      //   alert('User management feature coming soon!');
      //   break;
      // case 'projects':
      //   alert('Project management feature coming soon!');
      //   break;
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number',
    onClick
  }: { 
    title: string; 
    value: number; 
    change: number; 
    icon: any; 
    format?: 'number' | 'currency';
    onClick?: () => void;
  }) => (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {format === 'currency' ? formatCurrency(value) : value.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <div className="flex items-center mt-4">
        {change >= 0 ? (
          <ArrowUpRight className="w-4 h-4 text-green-500" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ml-1 ${
          change >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {Math.abs(change)}%
        </span>
        <span className="text-sm text-gray-500 ml-2">vs last month</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-1">Monitor your platform's performance and activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          value={mockStats.totalRevenue}
          change={mockStats.revenueChange}
          icon={DollarSign}
          format="currency"
          onClick={() => alert(`Total Revenue: ${formatCurrency(mockStats.totalRevenue)}\nRevenue breakdown and analytics coming soon!`)}
        />
        <StatCard
          title="Active Projects"
          value={mockStats.activeProjects}
          change={mockStats.projectsChange}
          icon={FileText}
          onClick={() => alert(`Active Projects: ${mockStats.activeProjects}\nProject management dashboard coming soon!`)}
        />
        <StatCard
          title="Pending Payments"
          value={mockStats.pendingPayments}
          change={mockStats.paymentsChange}
          icon={Clock}
          onClick={() => onNavigate?.('payments')}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
            <div className="flex items-center space-x-2">
              <button className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                7D
              </button>
              <button className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg">
                30D
              </button>
              <button className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                90D
              </button>
            </div>
          </div>
          
          {/* Interactive chart */}
          <div className="h-64 flex items-end justify-between space-x-2">
            {[65, 45, 78, 52, 89, 67, 95, 73, 84, 91, 76, 88].map((height, index) => (
              <div 
                key={index} 
                className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm opacity-80 hover:opacity-100 transition-all duration-200 cursor-pointer hover:scale-105" 
                style={{ height: `${height}%` }}
                onClick={() => alert(`Month ${index + 1}: $${(height * 1000).toLocaleString()} revenue`)}
              />
            ))}
          </div>
          
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>Jan</span>
            <span>Dec</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {mockActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => alert(`Activity: ${activity.description}\nStatus: ${activity.status}\nTime: ${new Date(activity.timestamp).toLocaleString()}`)}
              >
                <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                    {activity.amount && (
                      <p className="text-xs font-medium text-green-600">
                        {formatCurrency(activity.amount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 py-2 rounded-lg transition-colors"
            onClick={() => alert('Full activity log coming soon!')}
          >
            View All Activity
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => handleQuickAction('payments')}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
          >
            <DollarSign className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-blue-700">Process Payments</span>
          </button>
          
          <button 
            onClick={() => handleQuickAction('projects')}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
          >
            <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-blue-700">Manage Projects</span>
          </button>
          
          <button 
            onClick={() => handleQuickAction('users')}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
          >
            <Users className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-blue-700">Manage Users</span>
          </button>
        </div>
      </div>
    </div>
  );
}