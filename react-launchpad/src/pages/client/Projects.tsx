import React, { useState, useEffect } from 'react';
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
  Star,
  X
} from 'lucide-react';
import { getProjects, updateProject } from '../../apiendpoints';
import toast from 'react-hot-toast';
import { EditProjectForm } from '../../components/ui/EditProjectForm';

export function ClientProjects() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingProject, setViewingProject] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        setError('Failed to load projects.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = (project.ProjectTitle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (project.Description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
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

  const handleViewProject = (project: any) => {
    setViewingProject(project);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingProject(null);
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingProject(null);
  };

  const handleUpdateProject = async (updatedData: any) => {
    try {
      await updateProject(editingProject.Id, updatedData);
      toast.success('Project updated successfully!');
      handleCloseEditModal();
      // Refresh projects
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      toast.error('Failed to update project.');
    }
  };

  // Calculate progress based on milestones
  const calculateProgress = (project: any) => {
    if (!project.Milestones || project.Milestones === 'initial milestone') {
      return 0;
    }
    // For now, return a random progress between 0-100
    // In a real app, you'd track completed milestones
    return Math.floor(Math.random() * 100);
  };

  const ProjectCard = ({ project }: { project: any }) => (
    <Card hover className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.ProjectTitle}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{project.Description}</p>
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
            Due {project.Deadline ? new Date(project.Deadline).toLocaleDateString() : 'N/A'}
          </div>
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            ${project.Budget?.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {project.NumberOfFreelancers || 1} team members
          </div>
          <div className="text-blue-600 font-medium">{calculateProgress(project)}%</div>
        </div>

        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${calculateProgress(project)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Only show avatars if project.team exists and is an array */}
        {Array.isArray(project.team) && (
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
        )}
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            icon={Eye}
            onClick={() => handleViewProject(project)}
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
            onClick={() => handleEditProject(project)}
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
      {loading ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading projects...</h3>
        </Card>
      ) : error ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-red-600 mb-2">{error}</h3>
        </Card>
      ) : filteredProjects.length === 0 ? (
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
          {filteredProjects.map((project, idx) => (
            <ProjectCard key={project.Id || idx} project={project} />
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {projects.filter(p => p.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Projects</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {projects.filter(p => p.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            ${projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Budget</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%
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

      {/* Project View Modal */}
      {viewingProject && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showViewModal ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Project Details</h2>
              <button
                onClick={handleCloseViewModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Project Title</h3>
                <p className="text-gray-600">{viewingProject.ProjectTitle}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
                <p className="text-gray-600">{viewingProject.Description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Payment Type</h3>
                  <p className="text-gray-600">{viewingProject.PaymentType}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Category</h3>
                  <p className="text-gray-600">{viewingProject.CategoryOrDomain}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Budget</h3>
                  <p className="text-gray-600">${viewingProject.Budget?.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Freelancers</h3>
                  <p className="text-gray-600">{viewingProject.NumberOfFreelancers}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Deadline</h3>
                <p className="text-gray-600">
                  {viewingProject.Deadline ? new Date(viewingProject.Deadline).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Required Skills</h3>
                <p className="text-gray-600">{viewingProject.RequiredSkills}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Milestones</h3>
                <p className="text-gray-600">{viewingProject.Milestones}</p>
              </div>
              
              {viewingProject.AttachedDocumentPath && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Attached Document</h3>
                  <p className="text-gray-600">{viewingProject.AttachedDocumentPath}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={handleCloseViewModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showEditModal ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Project</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <EditProjectForm 
              project={editingProject}
              onSave={handleUpdateProject}
              onCancel={handleCloseEditModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}