import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/Modal';
import { 
  FolderOpen, 
  Eye, 
  User, 
  DollarSign, 
  Calendar,
  Filter,
  Search,
  Plus,
  AlertCircle
} from 'lucide-react';
import { getClientProjects, getProjectById, updateProject } from '../../apiendpoints';
import { Project } from '@/types';
import { handleError, showSuccessToast } from '@/utils/errorHandler';

export function ClientProjects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'active' | 'closed'>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
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
  
  // Start date update modal state
  const [startDateModal, setStartDateModal] = useState({
    isOpen: false,
    selectedProject: null as Project | null,
    newStartDate: '',
    error: '',
    isUpdating: false
  });

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        if (user && user.id) {
          const data = await getClientProjects(user.id);
          setProjects(data);
          console.log(data);
        } else {
          setProjects([]);
        }
      } catch (err) {
        handleError(err, 'fetchProjects');
        setError('Failed to load projects.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  const filteredProjects = projects.filter(project => {
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesApproval = approvalFilter === 'all' || project.approvalStatus === approvalFilter;
    const matchesSearch = searchTerm === '' || 
      (project.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (project.categoryOrDomain?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesStatus && matchesApproval && matchesSearch;
  });

  // getStatusColor is not needed, use Badge variant prop

  const getStatusCounts = () => {
    return {
      all: projects.length,
      open: projects.filter(p => p.status === 'open').length,
      active: projects.filter(p => p.status === 'active').length,
      closed: projects.filter(p => p.status === 'closed').length,
    };
  };

  const getApprovalCounts = () => {
    return {
      all: projects.length,
      pending: projects.filter((p: Project) => p.approvalStatus === 'pending').length,
      approved: projects.filter((p: Project) => p.approvalStatus === 'approved').length,
      rejected: projects.filter((p: Project) => p.approvalStatus === 'rejected').length,
    };
  };

  const statusCounts = getStatusCounts();
  const approvalCounts = getApprovalCounts();

  // // Remove modal logic and use navigation for viewDetails
  // const viewDetails = (projectId: number) => {
  //   navigate(`/workspace/${projectId}`);
  // };

  // Remove editProject function

  const createNewProject = () => {
    navigate('/client/create-project');
  };

  // Start date validation
  const validateStartDate = (startDate: string) => {
    if (!startDate) return 'Start date is required';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDateObj = new Date(startDate);
    
    if (startDateObj < today) {
      return 'Start date must not be before today ';
    }
    return '';
  };

  // Open start date update modal
  const openStartDateModal = (project: Project) => {
    setStartDateModal({
      isOpen: true,
      selectedProject: project,
      newStartDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      error: '',
      isUpdating: false
    });
  };

  // Handle start date update
  const handleStartDateUpdate = async () => {

    const error = validateStartDate(startDateModal.newStartDate);
    if (error) {
      setStartDateModal(prev => ({ ...prev, error }));
      return;
    }
    
    if (!startDateModal.selectedProject) return;

    setStartDateModal(prev => ({ ...prev, isUpdating: true }));
    try {
      const payload = {
        startDate: new Date(startDateModal.newStartDate).toISOString(),
      };

      await updateProject(startDateModal.selectedProject.id, payload);
      showSuccessToast('Start date updated successfully!');
      setStartDateModal(prev => ({ ...prev, isOpen: false }));
      
      // Refresh projects list
      if (user?.id) {
        const data = await getClientProjects(user.id);
        setProjects(data);
      }
    } catch (error) {
      handleError(error, 'updateStartDate');
    } finally {
      setStartDateModal(prev => ({ ...prev, isUpdating: false }));
    }
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
              <p className="text-2xl font-bold text-yellow-600 mt-1">{statusCounts.open}</p>
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
                <p className="text-sm font-medium text-gray-600">closed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{statusCounts.closed}</p>
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
              {(['all', 'open', 'active', 'closed'] as const).map((status) => (
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

            {/* Approval Status Filter Tabs */}
            <div className="flex space-x-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((approval) => (
                <button
                  key={approval}
                  onClick={() => setApprovalFilter(approval)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    approvalFilter === approval
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {approval === 'all' ? 'All Approval' : approval} 
                  {approval !== 'all' && ` (${approvalCounts[approval]})`}
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
                    project.status === 'open' ? 'warning' :
                    project.status === 'active' ? 'info' :
                    project.status === 'closed' ? 'success' :
                    project.status === '' ? 'destructive' : 'default'
                  }>
                    {project.status || 'No Status'}
                  </Badge>
                  <Badge variant={
                    project.approvalStatus === 'pending' ? 'warning' :
                    project.approvalStatus === 'approved' ? 'success' :
                    project.approvalStatus === 'rejected' ? 'destructive' : 'default'
                  }>
                    {project.approvalStatus}
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

                    {/* Rejection Reason */}
                    {project.approvalStatus === 'rejected' && project.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                            <p className="text-sm text-red-700 mt-1">{project.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      onClick={() => navigate(`/client/project-details/${project.id}`)}
                      variant="outline"
                      size="sm"
                    >
                      View Details
                    </Button>
                    
                    {project.approvalStatus === 'approved' && project.status === 'open' && (
                      <Button
                        onClick={() => navigate(`/client/freelancer-suggestions?projectId=${project.id}`)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        Find Freelancers
                      </Button>
                    )}
                    
                    {project.approvalStatus === 'rejected' && (
                      <Button
                        onClick={() => navigate(`/client/update-project/${project.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Update Project
                      </Button>
                    )}
                    
                    {project.status === 'open' && project.approvalStatus === 'approved' && (
                      <Button
                        onClick={() => openStartDateModal(project)}
                        variant="outline"
                        size="sm"
                        className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                      >
                        Update Start Date
                      </Button>
                    )}
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

      {/* Start Date Update Modal */}
      <Modal
        isOpen={startDateModal.isOpen}
        onClose={() => setStartDateModal(prev => ({ ...prev, isOpen: false }))}
        title="Update Start Date"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="newStartDate" className="block text-sm font-medium text-gray-700">
              New Start Date
            </label>
            <input
              type="date"
              id="newStartDate"
              value={startDateModal.newStartDate}
              onChange={(e) => setStartDateModal(prev => ({ ...prev, newStartDate: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {startDateModal.error && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {startDateModal.error}
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setStartDateModal(prev => ({ ...prev, isOpen: false }))}
              disabled={startDateModal.isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartDateUpdate}
              disabled={startDateModal.isUpdating || !startDateModal.newStartDate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {startDateModal.isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Update Start Date
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}