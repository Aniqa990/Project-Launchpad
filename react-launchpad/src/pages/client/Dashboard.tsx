import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FolderOpen, 
  Users, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { getClientProjects } from '../../apiendpoints';
import {Project} from '@/types';
import { useAuth } from '../../contexts/AuthContext';
import { handleApiError } from '@/utils/errorHandler';

export function ClientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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
      project.status === 'active'
    ).length;

    const totalFreelancers = projects.reduce((sum, project) => {
      const freelancers = project.numberOfFreelancers;
      if (typeof freelancers === 'number') return sum + freelancers;
      if (typeof freelancers === 'string') return sum + (parseInt(freelancers) || 0);
      return sum + 0;
    }, 0);

    const totalBudget = projects.reduce((sum, project) => {
      const budget = project.budget;
      if (typeof budget === 'number') return sum + budget;
      if (typeof budget === 'string') return sum + (parseFloat(budget) || 0);
      return sum + 0;
    }, 0);

    // Calculate success rate based on completed projects
    const completedProjects = projects.filter(project => 
      project.status === 'closed'
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
      backgroundColor: 'bg-blue-50',
      change: `${projects.length} total projects`
    },
    {
      label: 'Freelancers Hired',
      value: statistics.totalFreelancers.toString(),
      icon: Users,
      color: 'bg-green-500',
      backgroundColor: 'bg-green-50',
      change: `Across ${projects.length} projects`
    },
    {
      label: 'Total Budget',
      value: `$${statistics.totalBudget.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      backgroundColor: 'bg-purple-50',
      change: `Average: $${projects.length > 0 ? Math.round(statistics.totalBudget / projects.length).toLocaleString() : 0}`
    },
    {
      label: 'Success Rate',
      value: `${statistics.successRate}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      backgroundColor: 'bg-orange-50',
      change: `${projects.length} total projects`
    }
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        let data = [];
        if (user && user.id) {
          data = await getClientProjects(user.id);
        } else {
          setProjects([]);
          setLoading(false);
          return;
        }
        setProjects(data);
        console.log('Dashboard projects data:', data);
      } catch (err) {
        handleApiError(err, 'fetchProjects');
        setError('Failed to load projects.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  // Manual refresh function
  const refreshData = async () => {
    if (!user?.id) return;
    
    setRefreshing(true);
    try {
      const data = await getClientProjects(user.id);
      setProjects(data);
      console.log('Dashboard manually refreshed projects data:', data);
    } catch (err) {
      handleApiError(err, 'refreshProjects');
      setError('Failed to refresh projects.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      if (user && user.id) {
        const fetchProjects = async () => {
          try {
            const data = await getClientProjects(user.id!);
            setProjects(data);
            console.log('Dashboard refreshed projects data:', data);
          } catch (err) {
            console.error('Failed to refresh projects:', err);
          }
        };
        fetchProjects();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button 
            variant="outline"
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            icon={Plus} 
            onClick={() => navigate('/client/create-project')}
          >
            Create New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
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
              <div className="mt-4">
                <p className="text-sm text-gray-500">{stat.change}</p>
              </div>
            </div>
          );
        })}
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
                projects.slice(0, 3).map((project:Project, idx) => (
                  <div key={project.id || idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-base mb-0.5">{project.projectTitle}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-1">{project.description}</p>
                        <div className="flex flex-wrap gap-2 mb-1">
                          <Badge variant="info">{project.paymentType}</Badge>
                          <Badge variant="info">{project.categoryOrDomain}</Badge>
                          <Badge variant="info">Budget: ${project.budget}</Badge>
                          <Badge variant="info">Freelancers: {project.numberOfFreelancers}</Badge>
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
                          {project.numberOfFreelancers || 1} members
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Due {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div className="text-blue-600 font-medium">${project.budget}</div>
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
              {/* logic later */}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}