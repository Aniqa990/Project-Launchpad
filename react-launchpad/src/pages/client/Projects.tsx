import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { 
  FolderOpen, 
  Eye, 
  User, 
  DollarSign, 
  Calendar,
  Filter,
  Search,
  Plus,
  Pencil
} from 'lucide-react';
import { getClientProjects, getProjectById, updateProject } from '../../apiendpoints';
import { Project } from '@/types';

export function ClientProjects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [formErrors, setFormErrors] = useState<any>({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        let data = [];
        if (user && user.id) {
          data = await getClientProjects(user.id);
          console.log(data);
        } else {
          setProjects([]);
          setLoading(false);
          return;
        }
        setProjects(data);
      } catch (err) {
        setError('Failed to load projects.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  const filteredProjects = projects.filter(project => {
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      (project.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (project.categoryOrDomain?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesStatus && matchesSearch;
  });

  // getStatusColor is not needed, use Badge variant prop

  const getStatusCounts = () => {
    return {
      all: projects.length,
      draft: projects.filter(p => p.status === 'draft').length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length
    };
  };

  const statusCounts = getStatusCounts();

  // // Remove modal logic and use navigation for viewDetails
  // const viewDetails = (projectId: number) => {
  //   navigate(`/workspace/${projectId}`);
  // };

  // Remove editProject function

  const createNewProject = () => {
    navigate('/client/create-project');
  };

  if (loading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-1">Manage and track all your posted projects</p>
        </div>
        <Button onClick={createNewProject} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts.all}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
            </div>
        </Card>

        <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{statusCounts.draft}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
        </Card>

        <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{statusCounts.active}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
        </Card>

        <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{statusCounts.completed}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center justify-between p-6 pb-0">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-lg font-semibold">Filters</span>
          </div>
        </div>
        <div className="p-6 pt-2">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter Tabs */}
            <div className="flex space-x-2">
              {(['all', 'draft', 'active', 'completed', 'cancelled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status} 
                  {status !== 'all' && ` (${statusCounts[status]})`}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Projects List */}
      <Card>
        <div className="p-6">
          <span className="text-lg font-semibold">Projects ({filteredProjects.length})</span>
          <div className="text-gray-500 text-sm mb-4">
            {statusFilter === 'all' ? 'All your projects' : `Projects with status: ${statusFilter}`}
          </div>
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{project.projectTitle}</h4>
                      <Badge variant={
                        project.status === 'draft' ? 'warning' :
                        project.status === 'active' ? 'info' :
                        project.status === 'completed' ? 'success' :
                        project.status === 'cancelled' ? 'destructive' : 'default'
                      }>
                        {project.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Category:</span>
                        <p className="text-gray-600">{project.categoryOrDomain}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Budget:</span>
                        <p className="text-gray-600">${project.budget?.toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Deadline:</span>
                        <p className="text-gray-600">{project.deadline ? new Date(project.deadline).toLocaleDateString() : ''}</p>
                      </div>
                      
                        <div>
                        <span className="font-medium text-gray-700">Freelancers: </span>
                        {Array.isArray(project.team) && project.team.length > 0 ? (
                          <span className="text-gray-600">
                            {project.team.map(member => member.firstName + (member.lastName ? ' ' + member.lastName : '')).join(', ')}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Not assigned</span>
                        )}
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      // onClick={() => viewDetails(project.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredProjects.length === 0 && (
              <div className="text-center py-8">
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600">
                  {statusFilter === 'all' 
                    ? 'You haven\'t created any projects yet' 
                    : `No projects with status "${statusFilter}"`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}