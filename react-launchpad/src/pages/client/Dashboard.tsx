import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/avatar';
import { 
  Plus, 
  FolderOpen, 
  Users, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import { getProjects } from '../../apiendpoints';

export function ClientDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calculate real-time statistics from project data
  const statistics = useMemo(() => {
    if (!projects.length) {
      return {
        activeProjects: 0,
        totalFreelancers: 0,
        totalBudget: 0,
        successRate: 0
      };
    }

    const activeProjects = projects.filter(project => 
      project.Status === 'Active' || project.Status === 'In Progress' || !project.Status
    ).length;

    const totalFreelancers = projects.reduce((sum, project) => 
      sum + (parseInt(project.NumberOfFreelancers) || 0), 0
    );

    const totalBudget = projects.reduce((sum, project) => 
      sum + (parseFloat(project.Budget) || 0), 0
    );

    // Calculate success rate based on completed projects
    const completedProjects = projects.filter(project => 
      project.Status === 'Completed' || project.Status === 'Finished'
    ).length;
    const successRate = projects.length > 0 ? Math.round((completedProjects / projects.length) * 100) : 0;

    return {
      activeProjects,
      totalFreelancers,
      totalBudget,
      successRate
    };
  }, [projects]);

  const stats = [
    {
      label: 'Active Projects',
      value: statistics.activeProjects.toString(),
      icon: FolderOpen,
      color: 'bg-blue-500',
      change: `${projects.length} total projects`
    },
    {
      label: 'Freelancers Hired',
      value: statistics.totalFreelancers.toString(),
      icon: Users,
      color: 'bg-green-500',
      change: `Across ${projects.length} projects`
    },
    {
      label: 'Total Budget',
      value: `$${statistics.totalBudget.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      change: `Average: $${projects.length > 0 ? Math.round(statistics.totalBudget / projects.length).toLocaleString() : 0}`
    },
    {
      label: 'Success Rate',
      value: `${statistics.successRate}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: `${projects.length} total projects`
    }
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getProjects();
        console.log('Fetched projects:', data);
        setProjects(data);
      } catch (err) {
        setError('Failed to load projects.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <Button 
          icon={Plus} 
          onClick={() => navigate('/client/create-project')}
          className="mt-4 md:mt-0"
        >
          Create New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
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
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/client/projects')}
                className="text-blue-600 hover:text-blue-700"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="text-gray-500">Loading projects...</div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : projects.length === 0 ? (
                <div className="text-gray-500">No projects found.</div>
              ) : (
                projects.slice(0, 3).map((project, idx) => (
                  <div key={project.Id || idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{project.ProjectTitle}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-1">{project.Description}</p>
                        <div className="flex flex-wrap gap-2 mb-1">
                          <Badge variant="info">{project.PaymentType}</Badge>
                          <Badge variant="info">{project.CategoryOrDomain}</Badge>
                          <Badge variant="info">Budget: ${project.Budget}</Badge>
                          <Badge variant="info">Freelancers: {project.NumberOfFreelancers}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-1">
                          <Badge variant="info">Skills: {project.RequiredSkills}</Badge>
                          <Badge variant="info">Milestones: {project.Milestones}</Badge>
                        </div>
                      </div>
                      <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                        {project.status || 'active'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {project.NumberOfFreelancers || 1} members
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Due {project.Deadline ? new Date(project.Deadline).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div className="text-blue-600 font-medium">${project.Budget}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions & Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/client/create-project')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Project
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/client/projects')}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Browse Projects
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/client/payments')}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                View Payments
              </Button>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                {
                  action: 'Alex Chen submitted deliverables for E-commerce Platform',
                  time: '2 hours ago',
                  avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'
                },
                {
                  action: 'Maria Garcia completed Design System milestone',
                  time: '1 day ago',
                  avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400'
                },
                {
                  action: 'New freelancer applied to Mobile App project',
                  time: '2 days ago',
                  avatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=400'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Avatar src={activity.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}