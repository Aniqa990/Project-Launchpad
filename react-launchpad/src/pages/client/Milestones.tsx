import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getClientProjects, 
  getMilestonesByProjectId, 
  getProjectFreelancers,
  assignMilestoneToFreelancer,
  unassignMilestoneFromFreelancer,
  getMilestonesByFreelancerId,
  getMilestoneFreelancers,
  getPaymentByMilestone
} from '../../apiendpoints';
import { 
  validateMilestoneAssignment, 
  getMilestoneStatusText, 
  getMilestoneStatusColor,
  formatMilestoneDueDate,
  isMilestoneOverdue,
  canAssignToMilestone
} from '../../utils/milestoneHelpers';
import { 
  getPaymentStatusColor,
  getMilestonePaymentStatus
} from '../../utils/paymentHelpers';
import { handleApiError, showSuccessToast } from '../../utils/errorHandler';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  UserPlus, 
  UserMinus, 
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Download,
  Lock
} from 'lucide-react';

interface Project {
  Id?: number;
  id?: number;
  ProjectTitle?: string;
  projectTitle?: string;
  Description?: string;
  description?: string;
  PaymentType?: string;
  paymentType?: string;
  CategoryOrDomain?: string;
  categoryOrDomain?: string;
  Deadline?: string;
  deadline?: string;
  Duration?: string;
  duration?: string;
  RequiredSkills?: string;
  requiredSkills?: string;
  Budget?: number;
  budget?: number;
  NumberOfFreelancers?: number;
  numberOfFreelancers?: number;
  Status?: string;
  status?: string;
  ApprovalStatus?: string;
  approvalStatus?: string;
  RejectionReason?: string | null;
  rejectionReason?: string | null;
  ClientId?: number;
  clientId?: number;
  StartDate?: string;
  startDate?: string;
  AttachedDocumentPath?: string | null;
  attachedDocumentPath?: string | null;
  Client?: any;
  client?: any;
  Team?: any[];
  team?: any[];
  Progress?: number;
  progress?: number;
}

interface Milestone {
  Id: number;
  Title: string;
  Description: string;
  DueDate: string;
  Amount: number;
  Status: number; // 0: Not Started, 1: In Progress, 2: Completed
  SubmissionDate: string | null;
  FreelancerComments: string | null;
  IsApproved: boolean;
  HandoverStatus: string;
  ProjectId: number;
  project: any | null;
  Deliverables: any[];
  AssignedFreelancers?: FreelancerMilestone[];
  paymentStatus?: string; // Added payment status
}

interface Freelancer {
  Id: number;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNo: string;
  Gender: string;
  ProfilePicture: string | null;
  Role: string;
  CreatedAt: string;
  Skills: string;
  Experience: string;
  HourlyRate: number;
  AvgRating: number;
  Availability: string;
  WorkingHours: string;
  Summary: string;
  Projects: string;
}

interface FreelancerMilestone {
  Id: number;
  UserId: number;
  MilestoneId: number;
  AssignedAt: string;
  User: Freelancer;
}

const ClientMilestones: React.FC = () => {
  const { user } = useAuth();
  const clientId = user?.id || 1;

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedFreelancer, setSelectedFreelancer] = useState<number | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [milestoneAssignments, setMilestoneAssignments] = useState<{[milestoneId: number]: Freelancer[]}>({});
  const [milestonePayments, setMilestonePayments] = useState<{[milestoneId: number]: any}>({});

  // Fetch client projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        console.log('Fetching projects for client ID:', clientId);
        const data = await getClientProjects(clientId);
        console.log('Projects fetched:', data);
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        handleApiError(error, 'fetchProjects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [clientId]);

  // Set default project when projects are loaded (only on initial load)
  useEffect(() => {
    if (projects.length > 0 && selectedProject === 'All') {
      const firstProject = projects.find(project => project && (project.Id || project.id));
      if (firstProject) {
        const projectId = firstProject.Id || firstProject.id;
        const projectTitle = firstProject.ProjectTitle || firstProject.projectTitle;
        if (projectId) {
          console.log('Auto-selecting project:', projectId, projectTitle);
          setSelectedProject(projectId.toString());
        } else {
          console.log('Project found but no valid ID:', firstProject);
        }
      } else {
        console.log('No valid projects found:', projects);
      }
    } else if (projects.length === 0 && selectedProject === 'All') {
      console.log('No projects found for client. This could mean:');
      console.log('1. Client has no projects');
      console.log('2. API call failed');
      console.log('3. Client ID is incorrect');
    }
  }, [projects]); // Removed selectedProject from dependencies

  // Fetch milestones when project is selected
  useEffect(() => {
    const fetchMilestones = async () => {
      if (!selectedProject || selectedProject === 'All') {
        console.log('No project selected, clearing milestones');
        setMilestones([]);
        setMilestoneAssignments({});
        setMilestonePayments({});
        return;
      }

      try {
        setLoading(true);
                 console.log('Fetching milestones for project:', selectedProject);
         const data = await getMilestonesByProjectId(Number(selectedProject));
         console.log('Milestones fetched:', data);
         
         // Transform milestone data to handle both PascalCase and camelCase
         const transformedMilestones = data.map((milestone: any) => ({
           Id: milestone.Id || milestone.id,
           Title: milestone.Title || milestone.title,
           Description: milestone.Description || milestone.description,
           DueDate: milestone.DueDate || milestone.dueDate,
           Amount: milestone.Amount || milestone.amount,
           Status: milestone.Status || milestone.status,
           SubmissionDate: milestone.SubmissionDate || milestone.submissionDate,
           FreelancerComments: milestone.FreelancerComments || milestone.freelancerComments,
           IsApproved: milestone.IsApproved || milestone.isApproved,
           HandoverStatus: milestone.HandoverStatus || milestone.handoverStatus,
           ProjectId: milestone.ProjectId || milestone.projectId,
           project: milestone.project,
           Deliverables: milestone.Deliverables || milestone.deliverables || [],
           AssignedFreelancers: milestone.AssignedFreelancers || milestone.assignedFreelancers
         }));
         
         setMilestones(transformedMilestones);
        
                           // Fetch payment status for all milestones
          const payments: {[milestoneId: number]: any} = {};
          
          for (const milestone of data) {
            const milestoneId = milestone.Id || milestone.id;
            if (!milestoneId) {
              console.error('Milestone has no valid ID:', milestone);
              continue;
            }
            
            // Fetch payment status for all milestones
            try {
              const paymentData = await getPaymentByMilestone(milestoneId);
              if (paymentData && paymentData.length > 0) {
                payments[milestoneId] = paymentData[0]; // Take the first payment
              }
            } catch (error) {
              console.error(`Failed to fetch payment for milestone ${milestoneId}:`, error);
            }
          }
         
         setMilestoneAssignments({}); // Clear assignments - will be populated when freelancers are assigned
         setMilestonePayments(payments);
              } catch (error) {
          handleApiError(error, 'fetchMilestones');
          setMilestones([]);
          setMilestoneAssignments({});
          setMilestonePayments({});
        } finally {
          setLoading(false);
        }
    };

    fetchMilestones();
  }, [selectedProject]);

     // Fetch freelancers when project is selected
   useEffect(() => {
     const fetchFreelancers = async () => {
       if (!selectedProject || selectedProject === 'All') {
         setFreelancers([]);
         return;
       }

       try {
         console.log('Fetching freelancers for project:', selectedProject);
         const data = await getProjectFreelancers(Number(selectedProject));
         console.log('Freelancers fetched:', data);
         
         // Transform FreelancerProfile to Freelancer interface
         const transformedData = data.map((f: any) => ({
           Id: f.id || f.Id,
           FirstName: f.firstName || f.FirstName || '',
           LastName: f.lastName || f.LastName || '',
           Email: f.email || f.Email || '',
           PhoneNo: f.phoneNo || f.PhoneNo || '',
           Gender: f.gender || f.Gender || '',
           ProfilePicture: f.profilePicture || f.ProfilePicture || null,
           Role: f.role || f.Role || '',
           CreatedAt: f.createdAt || f.CreatedAt || '',
           Skills: f.skills || f.Skills || '',
           Experience: f.experience || f.Experience || '',
           HourlyRate: f.hourlyRate || f.HourlyRate || 0,
           AvgRating: f.avgRating || f.AvgRating || 0,
           Availability: f.availability || f.Availability || '',
           WorkingHours: f.workingHours || f.WorkingHours || '',
           Summary: f.summary || f.Summary || '',
           Projects: f.projects || f.Projects || ''
         }));
         setFreelancers(transformedData);
       } catch (error) {
         console.error('Error fetching freelancers:', error);
         handleApiError(error, 'fetchFreelancers');
         setFreelancers([]);
       }
     };

     fetchFreelancers();
   }, [selectedProject]);

  // Handle assign freelancer to milestone
  const handleAssignFreelancer = async () => {
    if (!selectedMilestone || !selectedFreelancer) return;

    // Check if milestone can be assigned to
    if (!canAssignToMilestone(selectedMilestone.Status)) {
      alert('Cannot assign freelancers to completed milestones');
      return;
    }

    // Check if freelancer is already assigned to this milestone
    const currentAssignments = milestoneAssignments[selectedMilestone.Id] || [];
    const isAlreadyAssigned = currentAssignments.some(f => f.Id === selectedFreelancer);
    
    if (isAlreadyAssigned) {
      alert('This freelancer is already assigned to this milestone');
      return;
    }

    try {
      setLoading(true);
      await assignMilestoneToFreelancer(selectedMilestone.Id, selectedFreelancer);
      
      // Update local assignments
      const assignedFreelancer = freelancers.find(f => f.Id === selectedFreelancer);
      if (assignedFreelancer) {
        setMilestoneAssignments(prev => ({
          ...prev,
          [selectedMilestone.Id]: [...(prev[selectedMilestone.Id] || []), assignedFreelancer]
        }));
      }
      
      setAssignDialogOpen(false);
      setSelectedMilestone(null);
      setSelectedFreelancer(null);
    } catch (error) {
      handleApiError(error, 'assignMilestone');
    } finally {
      setLoading(false);
    }
  };

  // Handle unassign freelancer from milestone
  const handleUnassignFreelancer = async (milestoneId: number, userId: number) => {
    try {
      setLoading(true);
      await unassignMilestoneFromFreelancer(milestoneId, userId);
      
      // Update local assignments
      setMilestoneAssignments(prev => ({
        ...prev,
        [milestoneId]: (prev[milestoneId] || []).filter(f => f.Id !== userId)
      }));
    } catch (error) {
      handleApiError(error, 'unassignMilestone');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: number) => {
    const statusText = getMilestoneStatusText(status);
    const statusColor = getMilestoneStatusColor(status);
    
    let icon;
    switch (status) {
      case 0:
        icon = <Clock className="w-3 h-3" />;
        break;
      case 1:
        icon = <AlertCircle className="w-3 h-3" />;
        break;
      case 2:
        icon = <CheckCircle className="w-3 h-3" />;
        break;
      default:
        icon = <AlertCircle className="w-3 h-3" />;
    }
    
    return (
      <div className="flex items-center gap-1">
        <Badge variant={statusColor as any}>
          {icon} {statusText}
        </Badge>
      </div>
    );
  };

  // Get payment status badge
  const getPaymentStatusBadge = (milestone: Milestone) => {
    // Show payment status for all milestones, not just completed ones
    const payment = milestonePayments[milestone.Id];
    if (!payment) {
      return (
        <div className="ml-2">
          <Badge variant="default">
            <Clock className="w-3 h-3 mr-1" />
            No Payment
          </Badge>
        </div>
      );
    }

    const status = payment.PaymentStatus || 'pending';
    const statusColor = getPaymentStatusColor(status);
    
    let statusText = 'Pending';
    let icon = <Clock className="w-3 h-3" />;
    
    switch (status.toLowerCase()) {
      case 'paid':
        statusText = 'Paid - Waiting for Approval';
        icon = <AlertCircle className="w-3 h-3" />;
        break;
      case 'released':
        statusText = 'Released';
        icon = <CheckCircle className="w-3 h-3" />;
        break;
      default:
        statusText = 'Pending';
        icon = <Clock className="w-3 h-3" />;
    }
    
    return (
      <div className="ml-2">
        <Badge variant={statusColor as any}>
          {icon} {statusText}
        </Badge>
      </div>
    );
  };

  // Handle download deliverables
  const handleDownloadDeliverables = (milestone: Milestone) => {
    if (milestone.HandoverStatus?.toLowerCase() === 'completed') {
      // Here you would implement the actual download logic
      // For now, we'll just show an alert
      alert(`Downloading deliverables for milestone: ${milestone.Title}`);
    }
  };

  // Check if download button should be enabled
  const canDownloadDeliverables = (milestone: Milestone) => {
    if (milestone.Status !== 2) return false; // Only for completed milestones
    
    // Enable download when handover status is "completed"
    return milestone.HandoverStatus?.toLowerCase() === 'completed';
  };

     // Filter milestones
   const filteredMilestones = milestones.filter(milestone => {
     const statusMatch = statusFilter === 'All' || 
                        (statusFilter === 'not-started' && milestone.Status === 0) ||
                        (statusFilter === 'in-progress' && milestone.Status === 1) ||
                        (statusFilter === 'completed' && milestone.Status === 2);
     
     return statusMatch;
   });
   
   console.log('Filtered milestones:', filteredMilestones);
   console.log('Selected project:', selectedProject);
   console.log('Loading state:', loading);

  // Get available freelancers for a specific milestone (excluding already assigned ones)
  const getAvailableFreelancers = (milestoneId: number) => {
    const assignedFreelancerIds = (milestoneAssignments[milestoneId] || []).map(f => f.Id);
    return freelancers.filter(freelancer => !assignedFreelancerIds.includes(freelancer.Id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Milestone Management</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Target className="w-4 h-4" />
          <span>{filteredMilestones.length} milestones</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Project:</label>
                         <select
               value={selectedProject}
               onChange={(e) => {
                 console.log('Project selection changed to:', e.target.value);
                 setSelectedProject(e.target.value);
               }}
               className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
             >
                             <option value="All">All Projects</option>
               {projects.filter(project => project && (project.Id || project.id)).map((project) => {
                 const projectId = project.Id || project.id;
                 const projectTitle = project.ProjectTitle || project.projectTitle;
                 return projectId ? (
                   <option key={projectId} value={projectId.toString()}>
                     {projectTitle || 'Untitled Project'}
                   </option>
                 ) : null;
               })}
            </select>
          </div>
        </div>
      </div>

      {/* Milestones Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : selectedProject && selectedProject !== 'All' ? (
          filteredMilestones.filter(milestone => milestone && milestone.Id).map((milestone) => (
            <div key={milestone.Id} className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{milestone.Title || 'Untitled Milestone'}</h3>
                    <span className="text-sm text-gray-500">•</span>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className={isMilestoneOverdue(milestone.DueDate || '', milestone.Status || 0) ? 'text-red-600 font-semibold' : ''}>
                        {formatMilestoneDueDate(milestone.DueDate || '')}
                        {isMilestoneOverdue(milestone.DueDate || '', milestone.Status || 0) && (
                          <span className="text-xs text-red-600 ml-1">(Overdue)</span>
                        )}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">•</span>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>${(milestone.Amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(milestone.Status || 0)}
                    {getPaymentStatusBadge(milestone)}
                  </div>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 max-w-2xl">{milestone.Description || 'No description available'}</p>

                {/* Assigned Freelancers */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Assigned Freelancers</span>
                    {milestone.Status === 2 && (
                      <Lock className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  
                  {milestoneAssignments[milestone.Id] && milestoneAssignments[milestone.Id].length > 0 ? (
                    <div className="space-y-2">
                      {milestoneAssignments[milestone.Id].map((freelancer) => (
                        <div key={freelancer.Id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">
                              {freelancer.FirstName} {freelancer.LastName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {freelancer.Email} • ${freelancer.HourlyRate || 0}/hr
                            </p>
                          </div>
                          {milestone.Status !== 2 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnassignFreelancer(milestone.Id, freelancer.Id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserMinus className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No freelancers assigned</p>
                  )}
                </div>

                {/* Milestone Details */}
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Handover Status:</span>
                      <span className="ml-2 font-medium">{milestone.HandoverStatus || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Approved:</span>
                      <span className="ml-2 font-medium">{milestone.IsApproved ? 'Yes' : 'No'}</span>
                    </div>
                    {milestone.SubmissionDate && (
                      <div>
                        <span className="text-gray-600">Submitted:</span>
                        <span className="ml-2 font-medium">{new Date(milestone.SubmissionDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {milestone.FreelancerComments && (
                      <div>
                        <span className="text-gray-600">Comments:</span>
                        <span className="ml-2 font-medium">{milestone.FreelancerComments}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  {/* Assign Freelancer Button */}
                  <Dialog open={assignDialogOpen && selectedMilestone?.Id === milestone.Id} onOpenChange={setAssignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMilestone(milestone)}
                        disabled={!canAssignToMilestone(milestone.Status || 0) || getAvailableFreelancers(milestone.Id).length === 0}
                      >
                        {milestone.Status === 2 ? (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Assignment Locked
                          </>
                        ) : !canAssignToMilestone(milestone.Status || 0) 
                          ? 'Cannot Assign (Completed)' 
                          : getAvailableFreelancers(milestone.Id).length === 0 
                            ? 'No Available Freelancers' 
                            : 'Assign Freelancer'}
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Freelancer to "{milestone.Title}"</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Select Freelancer</label>
                          <select
                            value={selectedFreelancer || ''}
                            onChange={(e) => setSelectedFreelancer(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Choose a freelancer</option>
                            {getAvailableFreelancers(selectedMilestone?.Id || 0).map((freelancer) => (
                              <option key={freelancer.Id} value={freelancer.Id}>
                                {freelancer.FirstName} {freelancer.LastName} - ${freelancer.HourlyRate || 0}/hr
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleAssignFreelancer}
                            disabled={!selectedFreelancer || loading}
                          >
                            {loading ? 'Assigning...' : 'Assign'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Download Button */}
                  {milestone.Status === 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDeliverables(milestone)}
                      disabled={!canDownloadDeliverables(milestone)}
                      className={canDownloadDeliverables(milestone) ? 'text-green-600 hover:text-green-700' : 'text-gray-400'}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {canDownloadDeliverables(milestone) ? 'Download Deliverables' : 'Handover Not Completed'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Project</h3>
            <p className="text-gray-600">Choose a project from the dropdown above to view and manage its milestones.</p>
          </div>
        )}

        {selectedProject && selectedProject !== 'All' && filteredMilestones.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Milestones Found</h3>
            <p className="text-gray-600">No milestones match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientMilestones; 