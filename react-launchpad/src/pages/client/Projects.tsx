import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/avatar';
import { ReviewModal } from '../../components/ui/ReviewModal';
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Users,
  DollarSign,
  Clock,
  MoreVertical,
  Eye,
  Edit,
  Archive,
  Star
} from 'lucide-react';
import { mockProjects } from '../../utils/mockData';
import toast from 'react-hot-toast';

export function ClientProjects() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'draft': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  const handleLeaveReview = (project: any) => {
    // For demo, we'll use the first team member as the freelancer to review
    const freelancerToReview = project.team[0];
    setSelectedProject({
      ...project,
      freelancer: freelancerToReview
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = (review: { rating: number; comment: string; tags: string[] }) => {
    // In a real app, this would submit to the backend
    console.log('Review submitted:', review);
    toast.success('Review submitted successfully!');
    setShowReviewModal(false);
  };

  const ProjectCard = ({ project }: { project: any }) => (
    <Card hover className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{project.description}</p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Badge variant={getStatusColor(project.status) as any}>
            {project.status}
          </Badge>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Due {new Date(project.deadline).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            ${project.budget.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {project.team.length} team members
          </div>
          <div className="text-blue-600 font-medium">{project.progress}%</div>
        </div>

        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {project.team.slice(0, 3).map((member: any) => (
            <Avatar 
              key={member.id} 
              src={member.avatar} 
              alt={member.name} 
              size="sm"
              className="border-2 border-white"
            />
          ))}
          {project.team.length > 3 && (
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
              +{project.team.length - 3}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            icon={Eye}
            onClick={() => navigate(`/workspace/${project.id}`)}
          >
            View
          </Button>
          {project.status === 'completed' && (
            <Button 
              size="sm" 
              variant="outline"
              icon={Star}
              onClick={() => handleLeaveReview(project)}
            >
              Review
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline"
            icon={Edit}
          >
            Edit
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Projects</h1>
          <p className="text-gray-600">Manage and track all your projects in one place</p>
        </div>
        <Button 
          icon={Plus} 
          onClick={() => navigate('/client/create-project')}
          className="mt-4 md:mt-0"
        >
          Create New Project
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>
      </Card>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by creating your first project'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={() => navigate('/client/create-project')}>
              Create Your First Project
            </Button>
          )}
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {mockProjects.filter(p => p.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Projects</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {mockProjects.filter(p => p.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            ${mockProjects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Budget</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(mockProjects.reduce((sum, p) => sum + p.progress, 0) / mockProjects.length)}%
          </div>
          <div className="text-sm text-gray-600">Avg Progress</div>
        </Card>
      </div>

      {/* Review Modal */}
      {selectedProject && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          project={selectedProject}
          onSubmitReview={handleSubmitReview}
        />
      )}
    </div>
  );
}