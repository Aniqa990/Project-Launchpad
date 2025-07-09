import React, { useState } from 'react';
import { AppShell } from '../layout/AppShell';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Calendar, DollarSign, Download, CheckSquare, Clock, FileText, User, Eye, MessageSquare, Filter, AlertCircle } from 'lucide-react';

export default function Milestones({
  milestones,
  milestonesLoading,
  user,
  handleUpdateMilestone,
  selectedMilestone,
  setSelectedMilestone,
  milestoneFormLoading,
  milestoneError,
  projectId
}: {
  milestones: any[];
  milestonesLoading: boolean;
  user: any;
  handleUpdateMilestone: (id: number, update: any) => void;
  selectedMilestone: any | null;
  setSelectedMilestone: (m: any | null) => void;
  milestoneFormLoading: boolean;
  milestoneError: string | null;
  projectId: string | number;
}) {
  // UI state for filters and feedback
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [showApprovalDialog, setShowApprovalDialog] = useState<string | null>(null);

  // Dummy projects for filter dropdown (replace with real data if available)
  const projects = Array.from(new Set(milestones.map(m => m.ProjectName || m.projectName).filter(Boolean)));

  // Map status to string for filter
  const statusMap = {
    0: 'pending',
    1: 'approved',
    2: 'paid',
    'Pending': 'pending',
    'Approved': 'approved',
    'Paid': 'paid',
    'Submitted': 'submitted',
    'In Progress': 'in-progress',
    'Under Review': 'under-review',
    'Rejected': 'rejected',
  };

  // Filtering logic
  const filteredMilestones = milestones.filter(milestone => {
    const projectName = milestone.ProjectName || milestone.projectName || '';
    const status = statusMap[milestone.Status] || statusMap[milestone.status] || '';
    const matchesProject = selectedProject === 'all' || projectName === selectedProject;
    const matchesStatus = selectedStatus === 'all' || status === selectedStatus;
    return matchesProject && matchesStatus;
  });

  // Stats
  const totalAmount = filteredMilestones.reduce((sum, m) => sum + (m.Amount || m.amount || 0), 0);
  const paidAmount = filteredMilestones.filter(m => (m.Status === 2 || m.status === 'Paid')).reduce((sum, m) => sum + (m.Amount || m.amount || 0), 0);
  const approvedAmount = filteredMilestones.filter(m => (m.Status === 1 || m.status === 'Approved')).reduce((sum, m) => sum + (m.Amount || m.amount || 0), 0);
  const pendingAmount = filteredMilestones.filter(m => (m.Status === 'Submitted' || m.Status === 'Under Review' || m.status === 'Submitted' || m.status === 'Under Review')).reduce((sum, m) => sum + (m.Amount || m.amount || 0), 0);

  // Status color
  const getStatusColor = (status: any) => {
    switch (status) {
      case 0:
      case 'Pending': return 'bg-gray-100 text-gray-800';
      case 1:
      case 'Approved': return 'bg-green-100 text-green-800';
      case 2:
      case 'Paid': return 'bg-purple-100 text-purple-800';
      case 'Submitted': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Under Review': return 'bg-orange-100 text-orange-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Progress color
  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200';
    if (progress < 50) return 'bg-red-500';
    if (progress < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Handlers for approve, request changes, pay (call your existing handlers)
  const handleApproveMilestone = (milestoneId: string) => {
    setShowApprovalDialog(null);
    setFeedback(prev => ({ ...prev, [milestoneId]: '' }));
    alert('Milestone approved successfully! Payment will be released to freelancer.');
  };
  const handleRequestChanges = (milestoneId: string) => {
    if (!feedback[milestoneId]?.trim()) {
      alert('Please provide feedback for the requested changes.');
      return;
    }
    setShowApprovalDialog(null);
    setFeedback(prev => ({ ...prev, [milestoneId]: '' }));
    alert('Change request sent to freelancer.');
  };
  const handlePayMilestone = (milestoneId: string) => {
    alert('Payment processed successfully!');
  };
  const clearFilters = () => {
    setSelectedProject('all');
    setSelectedStatus('all');
  };

  // UI rendering
  return (
    <AppShell>
      <div className="space-y-6 p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Milestone Tracker</h1>
            <p className="text-gray-600 mt-1">Track project milestones and deliverables</p>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Milestones</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{filteredMilestones.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {filteredMilestones.filter(m => m.Status === 'Submitted' || m.Status === 'Under Review' || m.status === 'Submitted' || m.status === 'Under Review').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">${totalAmount.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">${(paidAmount + approvedAmount).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </Card>
        </div>
        {/* Filters */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Filters</span>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="border rounded-lg px-3 py-2">
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
              <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="border rounded-lg px-3 py-2">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="under-review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </Card>
        {/* Progress Overview */}
        <Card>
          <div className="p-6">
            <span className="font-semibold text-gray-900">Project Progress</span>
            <div className="space-y-4 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-medium text-gray-900">
                  {filteredMilestones.length > 0 ? Math.round(filteredMilestones.reduce((sum, m) => sum + (m.Progress || m.progress || 0), 0) / filteredMilestones.length) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${filteredMilestones.length > 0 ? filteredMilestones.reduce((sum, m) => sum + (m.Progress || m.progress || 0), 0) / filteredMilestones.length : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
        {/* Milestones */}
        <div className="space-y-6">
          {milestonesLoading ? (
            <div>Loading milestones...</div>
          ) : filteredMilestones.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No milestones found</h3>
              <p className="text-gray-600">Milestones will appear here once projects are set up.</p>
            </div>
          ) : filteredMilestones.map((milestone, index) => (
            <Card key={milestone.Id || milestone.id} className="overflow-hidden">
              {/* Milestone Header */}
              <div className="border-b border-gray-100 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{milestone.Title || milestone.title}</h3>
                    <Badge className={getStatusColor(milestone.Status || milestone.status)}>
                      {milestone.Status === 2 || milestone.status === 'Paid' ? 'Paid' : milestone.Status === 1 || milestone.status === 'Approved' ? 'Approved' : milestone.Status === 0 || milestone.status === 'Pending' ? 'Pending' : milestone.Status || milestone.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{milestone.Description || milestone.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Avatar src={milestone.FreelancerAvatar || milestone.freelancerAvatar} alt={milestone.FreelancerName || milestone.freelancerName} size="sm" />
                      <span>{milestone.FreelancerName || milestone.freelancerName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{milestone.ProjectName || milestone.projectName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due {milestone.DueDate ? new Date(milestone.DueDate).toLocaleDateString() : milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>${(milestone.Amount || milestone.amount || 0).toLocaleString()}</span>
                    </div>
                    {milestone.InvoiceId || milestone.invoiceId ? (
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>{milestone.InvoiceId || milestone.invoiceId}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col space-y-3 lg:items-end">
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Progress</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(milestone.Progress || milestone.progress || 0)}`}
                          style={{ width: `${milestone.Progress || milestone.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{milestone.Progress || milestone.progress || 0}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMilestone(selectedMilestone && (selectedMilestone.Id || selectedMilestone.id) === (milestone.Id || milestone.id) ? null : milestone)}
                    >
                      {selectedMilestone && (selectedMilestone.Id || selectedMilestone.id) === (milestone.Id || milestone.id) ? 'Hide Details' : 'View Details'}
                    </Button>
                    {(milestone.Status === 'Submitted' || milestone.status === 'Submitted') && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setShowApprovalDialog(milestone.Id || milestone.id)}>
                        Review
                      </Button>
                    )}
                    {(milestone.Status === 1 || milestone.status === 'Approved') && (
                      <Button
                        size="sm"
                        onClick={() => handlePayMilestone(milestone.Id || milestone.id)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {/* Milestone Details */}
              {selectedMilestone && (selectedMilestone.Id || selectedMilestone.id) === (milestone.Id || milestone.id) && (
                <div className="p-6 bg-gray-50">
                  {/* Tabs */}
                  <div className="mb-4 border-b">
                    <nav className="flex space-x-8" aria-label="Tabs">
                      <button className="py-2 px-1 border-b-2 font-medium text-sm focus:outline-none" style={{ borderColor: '#3b82f6', color: '#1e293b' }}>Deliverables</button>
                      <button className="py-2 px-1 font-medium text-sm text-gray-500 focus:outline-none">Timeline</button>
                      <button className="py-2 px-1 font-medium text-sm text-gray-500 focus:outline-none">Feedback</button>
                    </nav>
                  </div>
                  {/* Deliverables Tab (default) */}
                  {milestone.SubmittedFileUrls || milestone.submittedFileUrls ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="p-4 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900 text-sm truncate">{milestone.SubmittedFileUrls || milestone.submittedFileUrls}</h5>
                          <Badge variant="outline" size="sm">File</Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p>No deliverables submitted yet</p>
                    </div>
                  )}
                </div>
              )}
              {/* Approval Dialog */}
              {showApprovalDialog === (milestone.Id || milestone.id) && (
                <Modal isOpen={true} onClose={() => setShowApprovalDialog(null)} title={`Review Milestone: ${milestone.Title || milestone.title}`} size="lg">
                  <div className="space-y-6">
                    {/* Deliverables */}
                    <div>
                      <h4 className="font-semibold mb-3">Submitted Files</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Card className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm truncate">{milestone.SubmittedFileUrls || milestone.submittedFileUrls}</h5>
                            <Badge variant="outline" size="sm">File</Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" className="flex-1 text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 text-xs">
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </Card>
                      </div>
                    </div>
                    {/* Freelancer Comments */}
                    {milestone.FreelancerComments && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-2">Freelancer Comments</h5>
                        <p className="text-blue-800 text-sm">{milestone.FreelancerComments}</p>
                      </div>
                    )}
                    {/* Feedback */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Feedback (Optional)
                      </label>
                      <textarea
                        placeholder="Add any comments or feedback..."
                        value={feedback[milestone.Id || milestone.id] || ''}
                        onChange={e => setFeedback(prev => ({ ...prev, [milestone.Id || milestone.id]: e.target.value }))}
                        rows={3}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => handleApproveMilestone(milestone.Id || milestone.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Approve & Release Payment
                      </Button>
                      <Button
                        onClick={() => handleRequestChanges(milestone.Id || milestone.id)}
                        variant="outline"
                        className="flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Request Changes
                      </Button>
                    </div>
                  </div>
                </Modal>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
} 