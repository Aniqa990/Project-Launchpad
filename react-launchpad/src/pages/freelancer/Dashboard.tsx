import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getProjectRequests, getFreelancerProjects } from '@/apiendpoints';
import { Project, ProjectRequest } from '@/types';
import { 
  Inbox, 
  FolderOpen, 
  Clock, 
  DollarSign, 
  Play,
  Pause,
  ArrowRight,
  Star,
  Calendar,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

export function FreelancerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isClocked, setIsClocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingRequests: 0,
    hoursToday: 0,
    monthlyEarnings: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsData, requestsData] = await Promise.all([
        getFreelancerProjects(user!.id!),
        getProjectRequests(user!.id!)
      ]);

      // Transform backend data to frontend format
      const transformedProjects = projectsData.map((project: any) => ({
        id: project.Id.toString(),
        title: project.Title,
        description: project.Description,
        status: project.Status,
        budget: project.Budget,
        deadline: project.Deadline,
        clientId: project.ClientId.toString(),
        client: {
          id: project.Client.User.Id,
          firstName: project.Client.User.FirstName,
          lastName: project.Client.User.LastName,
          email: project.Client.User.Email,
          phone: project.Client.User.PhoneNo,
          role: project.Client.User.Role,
          gender: project.Client.User.Gender
        },
        skills: project.SkillsRequired ? project.SkillsRequired.split(',').map((s: string) => s.trim()) : [],
        team: project.AssignedFreelancers.map((af: any) => ({
          id: af.Freelancer.User.Id,
          firstName: af.Freelancer.User.FirstName,
          lastName: af.Freelancer.User.LastName,
          email: af.Freelancer.User.Email,
          phone: af.Freelancer.User.PhoneNo,
          role: af.Freelancer.User.Role,
          gender: af.Freelancer.User.Gender
        })),
        progress: 0, // Calculate based on milestones
        milestones: project.milestones || []
      }));

      const transformedRequests = requestsData.map((request: any) => ({
        projectId: request.ProjectId,
        freelancerId: request.FreelancerId,
        projectTitle: request.Project.Title,
        projectDescription: request.Project.Description,
        projectCategory: request.Project.Category || 'General',
        deadline: new Date(request.Project.Deadline),
        skills: request.Project.SkillsRequired ? request.Project.SkillsRequired.split(',').map((s: string) => s.trim()) : [],
        budget: request.Project.Budget,
        clientId: request.Project.ClientId,
        clientName: `${request.Project.Client.User.FirstName} ${request.Project.Client.User.LastName}`,
        clientEmail: request.Project.Client.User.Email,
        clientPhone: request.Project.Client.User.PhoneNo,
        status: request.Status,
        sentAt: request.CreatedAt
      }));

      setProjects(transformedProjects);
      setRequests(transformedRequests);

      // Calculate stats
      const activeProjects = transformedProjects.filter((p: Project) => p.status === 'active').length;
      const pendingRequests = transformedRequests.filter((r: ProjectRequest) => r.status === 'pending').length;
      const monthlyEarnings = transformedProjects
        .filter((p: Project) => p.status === 'completed')
        .reduce((sum: number, p: Project) => sum + (p.budget || 0), 0);

      setStats({
        activeProjects,
        pendingRequests,
        hoursToday: 6.5, // This would come from time tracking API
        monthlyEarnings
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = [
    {
      label: 'Active Projects',
      value: stats.activeProjects.toString(),
      icon: FolderOpen,
      color: 'bg-blue-500',
      change: `${stats.activeProjects > 0 ? '+' + stats.activeProjects : '0'} this week`
    },
    {
      label: 'Pending Requests',
      value: stats.pendingRequests.toString(),
      icon: Inbox,
      color: 'bg-orange-500',
      change: `${stats.pendingRequests > 0 ? stats.pendingRequests + ' new' : '0'} today`
    },
    {
      label: 'Hours Today',
      value: stats.hoursToday.toString(),
      icon: Clock,
      color: 'bg-green-500',
      change: 'On track'
    },
    {
      label: 'This Month',
      value: `$${stats.monthlyEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+15% vs last month'
    }
  ];

  const activeProjects = projects.filter(project => project.status === 'active');

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}! Here's your project overview.</p>
        </div>
        
        {/* Clock In/Out */}
        <div className="mt-4 md:mt-0">
          <Button 
            variant={isClocked ? 'danger' : 'primary'}
            icon={isClocked ? Pause : Play}
            onClick={() => setIsClocked(!isClocked)}
            className="mr-3"
          >
            {isClocked ? 'Clock Out' : 'Clock In'}
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
                <p className="text-sm text-green-700">Started at 9:00 AM â€¢ 6 hours 32 minutes</p>
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
        {dashboardStats.map((stat, index) => (
          <Card key={index} hover>
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
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Active Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Active Projects</h2>
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
              {activeProjects.length > 0 ? (
                activeProjects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-medium text-gray-900">${project.budget?.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Budget</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Due {new Date(project.deadline).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {project.client.firstName} {project.client.lastName}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/freelancer/projects/${project.id}`)}>
                        View Project
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No active projects</p>
                  <p className="text-sm">Check your requests for new opportunities</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Requests */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Requests</h2>
            <div className="space-y-4">
              {requests.slice(0, 2).map((request) => (
                <div key={`${request.projectId}-${request.freelancerId}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{request.projectTitle}</h3>
                      <p className="text-xs text-gray-600">by {request.clientName}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{request.projectDescription}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>${request.budget?.toLocaleString()}</span>
                    <span>{new Date(request.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1" onClick={() => navigate('/freelancer/requests')}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No pending requests</p>
                </div>
              )}
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
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/freelancer/profile-setup')}>
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
                <span className="font-semibold">{projects.filter(p => p.status === 'completed').length}</span>
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