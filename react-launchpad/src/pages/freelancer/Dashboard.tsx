import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Inbox, 
  FolderOpen, 
  Clock, 
  DollarSign, 
  Play,
  Pause,
  ArrowRight,
  Star
} from 'lucide-react';

export function FreelancerDashboard() {
  const navigate = useNavigate();
  const [isClocked, setIsClocked] = React.useState(false);

  const stats = [
    {
      label: 'Active Projects',
      value: '2',
      icon: FolderOpen,
      color: 'bg-blue-500',
      change: '+1 this week'
    },
    {
      label: 'Pending Requests',
      value: '3',
      icon: Inbox,
      color: 'bg-orange-500',
      change: '2 new today'
    },
    {
      label: 'Hours Today',
      value: '6.5',
      icon: Clock,
      color: 'bg-green-500',
      change: 'On track'
    },
    {
      label: 'This Month',
      value: '$3,240',
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+15% vs last month'
    }
  ];

  //const activeTasks = mockTasks.filter(task => task.status === 'inprogress');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your project overview.</p>
        </div>
        
        {/* Clock In/Out */}
        <div className="mt-4 md:mt-0">
          <Button
            onClick={() => setIsClocked(!isClocked)}
            className={`mr-3 ${isClocked ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            >
            {isClocked ? (
                <>
                <Pause className="w-4 h-4 mr-2" />
                Clock out
                </>
            ) : (
                <>
                <Play className="w-4 h-4 mr-2" />
                Clock in
                </>
            )}
            </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/freelancer/requests')}
          >
            View Requests
          </Button>
        </div>
      </div>

      {/* Clock Status Bar */}
      {isClocked && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
              <div>
                <p className="font-medium text-green-900">Currently clocked in</p>
                <p className="text-sm text-green-700">Started at 9:00 AM • 6 hours 32 minutes</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-900">$520</p>
              <p className="text-sm text-green-700">Today's earnings</p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (

        <Card key={index} className="hover:shadow-md transition-shadow">
        <CardContent>
            <div className="flex items-center">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            </div>
            <div className="mt-4">
            <p className="text-sm text-gray-500">{stat.change}</p>
            </div>
        </CardContent>
        </Card>

        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Active Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Active Tasks</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/freelancer/projects')}
                className="text-blue-600 hover:text-blue-700"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* {activeTasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{task.description}</p>
                    </div>
                    <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'default'}>
                      {task.priority}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {task.actualHours}h / {task.estimatedHours}h
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View Task
                    </Button>
                  </div>
                </div>
              ))} */}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Requests */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Requests</h2>
            <div className="space-y-4">
              {/* {mockProjectRequests.slice(0, 2).map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <Avatar src={request.project.client.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{request.project.title}</h3>
                      <p className="text-xs text-gray-600">by {request.project.client.name}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{request.message}</p>
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">Accept</Button>
                    <Button size="sm" variant="outline" className="flex-1">Decline</Button>
                  </div>
                </div>
              ))} */}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/freelancer/requests')}
            >
              View All Requests
            </Button>
          </Card>

          {/* Profile Completion */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Completion</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Basic Info</span>
                <span className="text-green-600 font-medium">✓ Complete</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Skills & Experience</span>
                <span className="text-green-600 font-medium">✓ Complete</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Portfolio</span>
                <span className="text-orange-600 font-medium">2/5 Projects</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Certifications</span>
                <span className="text-gray-500">Not added</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">75% complete</p>
            </div>
            <Button variant="outline" className="w-full mt-4">
              Complete Profile
            </Button>
          </Card>

          {/* Performance */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Overall Rating</span>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-semibold">4.8</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Projects Completed</span>
                <span className="font-semibold">127</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Success Rate</span>
                <span className="font-semibold text-green-600">98%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Response Time</span>
                <span className="font-semibold">{'< 1 hour'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}