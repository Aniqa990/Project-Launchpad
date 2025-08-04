import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Clock,
  FileText,
  Users,
  BarChart3,
  Download,
  Upload
} from 'lucide-react';
import { getProjectById, getMilestonesByProjectId } from '../apiendpoints';
import { Project, Milestone } from '../types';
import toast from 'react-hot-toast';

interface ProjectDetailsProps {
  projectId?: string | number;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function ProjectDetails({ projectId: propProjectId, showBackButton = true, onBack }: ProjectDetailsProps) {
  const params = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [error, setError] = useState('');

  const projectId = propProjectId || params.projectId;

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      setLoading(true);
      setError('');
      try {
        const projectData = await getProjectById(projectId);
        setProject(projectData);
        
        // Fetch milestones if payment type is milestone
        if (projectData.paymentType === 'milestone') {
          setMilestonesLoading(true);
          try {
            const milestoneData = await getMilestonesByProjectId(Number(projectId));
            setMilestones(milestoneData);
          } catch (err) {
            console.error('Failed to fetch milestones:', err);
            setMilestones([]);
          } finally {
            setMilestonesLoading(false);
          }
        }
      } catch (err) {
        setError('Failed to load project details');
        toast.error('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'open': return 'warning';
      case 'active': return 'info';
      case 'closed': return 'success';
      default: return 'default';
    }
  };

  const getApprovalStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.projectTitle}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant={getStatusColor(project.status)}>
                {project.status || 'No Status'}
              </Badge>
              <Badge variant={getApprovalStatusColor(project.approvalStatus)}>
                {project.approvalStatus}
              </Badge>
              {project.rejectionReason && (
                <span className="text-sm text-red-600">Rejected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                ${project.budget?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Deadline</p>
              <p className="text-lg font-bold text-gray-900">
                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Freelancers</p>
              <p className="text-2xl font-bold text-gray-900">
                {project.numberOfFreelancers || 1}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Payment Type</p>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {project.paymentType || 'Fixed'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Project Information */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Project Description */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Description</h3>
          <p className="text-gray-600 mb-4">{project.description}</p>
          
          {/* Required Skills */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Required Skills</h4>
            <div className="flex flex-wrap gap-2">
              {project.requiredSkills?.split(',').map((skill: string, index: number) => (
                <Badge key={index} variant="info" size="sm">
                  {skill.trim()}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* Project Details */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <p className="text-gray-900">{project.categoryOrDomain}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <p className="text-gray-900">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
              <p className="text-gray-900 capitalize">{project.paymentType || 'Fixed'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Freelancers</label>
              <p className="text-gray-900">{project.numberOfFreelancers || 1}</p>
            </div>
            
            {project.attachedDocumentPath && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Documents</label>
                <a 
                  href={project.attachedDocumentPath} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  View Project Documents
                </a>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Milestones for Milestone-based Projects */}
      {project.paymentType === 'milestone' && (
        <Card className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Milestones</h3>
          {milestonesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading milestones...</p>
            </div>
          ) : milestones.length > 0 ? (
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                      <Badge variant={
                        milestone.status === 'completed' ? 'success' :
                        milestone.status === 'inProgress' ? 'warning' : 'default'
                      }>
                        {milestone.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        ${milestone.amount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3 ml-11">{milestone.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500 ml-11">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Due {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'Not set'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No milestones found for this project.</p>
          )}
        </Card>
      )}

      {/* Rejection Reason */}
      {project.approvalStatus === 'rejected' && project.rejectionReason && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-800">Rejection Reason</h3>
                <p className="text-sm text-red-700 mt-1">{project.rejectionReason}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 