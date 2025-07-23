import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getProjectRequests, getFreelancerProjects } from '../../apiendpoints';
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
  User,
  CheckCircle,
  TrendingUp
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
    rating: 0,
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

      console.log(projectsData);

      const transformedProjects = projectsData.map((project: any) => ({
        id: project.Id,
        title: project.Title,
        description: project.Description,
        status: project.Status,
        budget: project.Budget,
        deadline: project.Deadline,
        clientId: project.ClientId,
        client: project.Client
          ? {
              firstName: project.Client.FirstName,
              lastName: project.Client.LastName,
              email: project.Client.Email,
              phone: project.Client.PhoneNo,
              role: project.Client.Role,
              gender: project.Client.Gender
            }
          : null,
        skills: project.Skills || [],
        team: (project.Team || []).map((member: any) => ({
          firstName: member.FirstName,
          lastName: member.LastName,
          email: member.Email,
          phone: member.PhoneNo,
          role: member.Role,
          gender: member.Gender
        })),
        progress: project.Progress ?? 0
      }));

      const transformedRequests = requestsData.map((request: any) => ({
        projectId: request.ProjectId,
        freelancerId: request.FreelancerId,
        projectTitle: request.ProjectTitle,
        projectDescription: request.ProjectDescription,
        projectCategory: request.ProjectCategory || 'General',
        deadline: new Date(request.Deadline),
        skills: request.Skills ? request.Skills.split(',').map((s: string) => s.trim()) : [],
        budget: request.Budget,
        clientId: request.ClientId,
        clientName: `${request.ClientName}`,
        clientEmail: request.ClientEmail,
        //clientPhone: request.ClientPhone,
        status: request.Status,
        sentAt: request.RequestedAt
      }));

      setProjects(transformedProjects);
      setRequests(transformedRequests);

      // Calculate stats
      const activeProjects = transformedProjects.filter((p: Project) => p.status === 'active').length;
      const pendingRequests = transformedRequests.filter((r: ProjectRequest) => r.status === 'pending').length;
      const monthlyEarnings = transformedProjects
        .filter((p: Project) => p.status === 'completed')
        .reduce((sum: number, p: Project) => sum + (p.budget || 0), 0);
      const rating = 4.5;

      setStats({
        activeProjects,
        pendingRequests,
        rating,
        monthlyEarnings
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const activeProjects = projects.filter(project => project.status === 'active');
  const pendingRequests = requests.filter((r: ProjectRequest) => r.status && r.status.toLowerCase().trim() === 'pending');

  const dashboardStats = [
    {
      label: 'Active Projects',
      value: activeProjects.length.toString(),
      icon: FolderOpen,
      color: 'bg-blue-500',
      backgroundColor: 'bg-blue-50',
    },
    {
      label: 'Pending Requests',
      value: pendingRequests.length.toString(),
      icon: Inbox,
      color: 'bg-orange-500',
      backgroundColor: 'bg-orange-50',
    },
    {
      label: 'Rating',
      value: stats.rating.toString(),
      icon: Star,
      color: 'bg-yellow-500',
      backgroundColor: 'bg-yellow-50',
    },
    {
      label: 'This Month',
      value: `$${stats.monthlyEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      backgroundColor: 'bg-purple-50',
    }
  ];

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
    <div className="p-3 max-w-6xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-5 mb-6"> 
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.firstName}!</h1> 
            <p className="text-blue-100 text-base">Here's your project overview for today</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> 
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.backgroundColor} rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-medium">{stat.label}</p> 
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p> 
                </div>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content: Active Projects and Pending Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Active Projects</h2> 
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
          <div className="space-y-3">
            {activeProjects.length > 0 ? (
              activeProjects.map((project) => (
                <div key={project.id} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors"> 
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-base mb-0.5">{project.title}</h3> 
                      <p className="text-gray-600 text-xs line-clamp-2">{project.description}</p> 
                    </div>
                    <div className="ml-3 text-right">
                      <div className="text-xs font-semibold text-gray-900">${project.budget?.toLocaleString()}</div>
                      <div className="text-[10px] text-gray-500">Budget</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Due {new Date(project.deadline!).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {project.client?.firstName} {project.client?.lastName}
                      </div>
                    </div>
                    {/* <Button size="sm" variant="outline" onClick={() => navigate(`/freelancer/projects/${project.id}`)}>
                      View Project
                    </Button> */}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No active projects</p>
                <p className="text-xs">Check your requests for new opportunities</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Pending Requests</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/freelancer/requests')}
              className="text-blue-600 hover:text-blue-700"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <div key={`${request.projectId}-${request.freelancerId}`} className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-start space-x-2 mb-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-700 text-sm">{request.projectTitle}</h3> 
                      <p className="text-[11px] text-gray-600">by {request.clientName}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{request.projectDescription}</p>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
                    <span>${request.budget?.toLocaleString()}</span>
                    <span>{new Date(request.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1" onClick={() => navigate('/freelancer/requests')}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-3 text-gray-500">
                <Inbox className="w-7 h-7 mx-auto mb-1 text-gray-300" />
                <p className="text-xs">No pending requests</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a href="/freelancer/submit-timesheet" className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <div className="bg-blue-500 p-1.5 rounded-md">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-gray-900 text-sm">Log Time</span>
          </a>
          <a href="/freelancer/submit-deliverables" className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <div className="bg-green-500 p-1.5 rounded-md">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-gray-900 text-sm">Submit Deliverable</span>
          </a>
          <a href="/freelancer/payments" className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <div className="bg-purple-500 p-1.5 rounded-md">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-gray-900 text-sm">View Payments</span>
          </a>
        </div>
      </div>
    </div>
  );
}