import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/avatar';
import { Modal } from '../../components/ui/Modal';
import { Calendar, DollarSign, Upload, MessageSquare, Send, CheckCircle, XCircle, Clock, Filter, Paperclip, X, Target } from 'lucide-react';
import { getFreelancerProjects, getMilestonesByProjectId, getDeliverablesByMilestoneId, createDeliverable } from '../../apiendpoints';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

export function Milestones() {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('All');
  const [milestones, setMilestones] = useState<any[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File[]}>({});
  const [comments, setComments] = useState<{[key: string]: string}>({});
  const [deliverables, setDeliverables] = useState<{[key: string]: any[]}>({});
  const [statusEdits, setStatusEdits] = useState<{[key: string]: string}>({});
  const [fileInputs, setFileInputs] = useState<{[key: string]: File[]}>({});
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const [uploadLoading, setUploadLoading] = useState<{[key: string]: boolean}>({});
  const [uploadError, setUploadError] = useState<{[key: string]: string}>({});

  // Status mapping for MilestoneStatus enum
  const statusMap: Record<'not-started' | 'in-progress' | 'completed', number> = {
    'not-started': 0,
    'in-progress': 1,
    'completed': 2
  };

  // Map backend integer status to dropdown string value
  function getDropdownStatusValue(status: number | string): 'not-started' | 'in-progress' | 'completed' {
    if (status === 0 || status === 'not-started' || status === 'NotSelected') return 'not-started';
    if (status === 1 || status === 'in-progress' || status === 'InProgress') return 'in-progress';
    if (status === 2 || status === 'completed' || status === 'Completed') return 'completed';
    return 'not-started';
  }

  // Fetch projects for freelancer (only on mount or user.id change)
  useEffect(() => {
    async function fetchProjects() {
      if (!user?.id) return;
      const data = await getFreelancerProjects(user.id);
      setProjects(data);
    }
    fetchProjects();
  }, [user?.id]);

  // Only set default project if selectedProject is 'All'
  useEffect(() => {
    if (projects.length > 0 && selectedProject === 'All') {
      // Use ProjectTitle and Id for uniqueness
      setSelectedProject(projects[0].projectTitle + '___' + projects[0].id);
    }
  }, [projects]);

  // Only fetch milestones if both projects and selectedProject are set and valid
  useEffect(() => {
    async function fetchMilestones() {
      setMilestonesLoading(true);
      try {
        if (!selectedProject || selectedProject === 'All') {
          setMilestones([]);
        } else {
          // Extract Id from selectedProject value
          const selectedParts = selectedProject.split('___');
          const selectedId = selectedParts.length > 1 ? Number(selectedParts[1]) : undefined;
          const project = projects.find(p => p.id === selectedId);
          if (project) {
            const data = await getMilestonesByProjectId(project.id);
            setMilestones(data);
            // Fetch deliverables for each milestone
            for (const milestone of data) {
              const delivs = await getDeliverablesByMilestoneId(milestone.Id);
              setDeliverables(prev => ({ ...prev, [milestone.Id]: delivs }));
            }
          }
        }
      } catch {
        setMilestones([]);
      } finally {
        setMilestonesLoading(false);
      }
    }
    if (projects.length > 0 && selectedProject && selectedProject !== 'All') {
      fetchMilestones();
    }
  }, [selectedProject, projects]);

  // Filtering
  const filteredMilestones = milestones.filter(milestone => {
    // Use Status for new API
    const statusMatch = statusFilter === 'All' || milestone.Status === statusFilter;
    return statusMatch;
  });

  // Status badge
  const getStatusBadge = (status: string | number | undefined) => {
    // Map integer status to string for display
    let display = { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: Clock };
    if (status === 0 || status === 'not-started' || status === 'NotSelected') {
      display = { label: 'Not Started', color: 'bg-gray-100 text-gray-800', icon: Clock };
    } else if (status === 1 || status === 'in-progress' || status === 'InProgress') {
      display = { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Clock };
    } else if (status === 2 || status === 'completed' || status === 'Completed') {
      display = { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    } else if (status === 'pending') {
      display = { label: 'Submitted – Awaiting Client Review', color: 'bg-orange-100 text-orange-800', icon: Clock };
    } else if (status === 'approved') {
      display = { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    } else if (status === 'rejected') {
      display = { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle };
    }
    const Icon = display.icon;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${display.color}`}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {display.label}
      </span>
    );
  };

  // File upload
  const handleFileUpload = (milestoneId: string, files: FileList) => {
    const fileArray = Array.from(files);
    setUploadedFiles(prev => ({
      ...prev,
      [milestoneId]: [...(prev[milestoneId] || []), ...fileArray]
    }));
  };
  const removeFile = (milestoneId: string, fileIndex: number) => {
    setUploadedFiles(prev => ({
      ...prev,
      [milestoneId]: prev[milestoneId]?.filter((_, index) => index !== fileIndex) || []
    }));
  };
  const handleSubmit = async (milestoneId: string) => {
    const files = uploadedFiles[milestoneId] || [];
    const comment = comments[milestoneId] || '';
    // For simplicity, just join file names as a string
    await createDeliverable({
      uploadFiles: files.map(f => f.name).join(','),
      milestoneId: Number(milestoneId),
      comment,
      status: 'Submitted'
    });
    setExpandedMilestone(null);
    setUploadedFiles(prev => ({ ...prev, [milestoneId]: [] }));
    setComments(prev => ({ ...prev, [milestoneId]: '' }));
    // Refresh deliverables for this milestone
    const delivs = await getDeliverablesByMilestoneId(Number(milestoneId));
    setDeliverables(prev => ({ ...prev, [milestoneId]: delivs }));
  };

  // Handle status change
  const handleStatusChange = async (milestone: any, newStatus: string) => {
    const milestoneId = milestone.id || milestone.Id;
    if (!milestoneId) {
      alert('Milestone ID missing, cannot update status.');
      return;
    }
    setStatusEdits(prev => ({ ...prev, [milestoneId]: newStatus }));
    try {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      await axios.put(`http://localhost:7053/api/updatemilestone/${milestoneId}`, {
        ...milestone,
        Status: statusMap[newStatus as 'not-started' | 'in-progress' | 'completed']
      });
      // Refresh milestones
      const selectedParts = selectedProject.split('___');
      const selectedId = selectedParts.length > 1 ? Number(selectedParts[1]) : undefined;
      const project = projects.find(p => p.id === selectedId);
      if (project) {
        const data = await getMilestonesByProjectId(project.id);
        setMilestones(data);
        for (const m of data) {
          const delivs = await getDeliverablesByMilestoneId(m.id || m.Id);
          setDeliverables(prev => ({ ...prev, [m.id || m.Id]: delivs }));
        }
      }
    } catch (err) {
      alert('Failed to update milestone status.');
    }
  };

  // Update milestone status API
  const updateMilestoneStatus = async (milestone: any, status: 'not-started' | 'in-progress' | 'completed') => {
    try {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Using token for updateMilestoneStatus:', token);
      }
      await axios.put(`http://localhost:7053/api/updatemilestone/${milestone.Id}`, {
        ...milestone,
        Status: statusMap[status] // send integer value for enum
      });
      // Refresh milestones
      const project = projects.find(p => p.projectTitle === selectedProject);
      if (project) {
        const data = await getMilestonesByProjectId(project.id);
        setMilestones(data);
        for (const m of data) {
          const delivs = await getDeliverablesByMilestoneId(m.Id);
          setDeliverables(prev => ({ ...prev, [m.Id]: delivs }));
        }
      }
    } catch (err) {
      // Optionally show error
    }
  };

  // Handle file input
  const handleFileInput = (milestoneId: string, files: FileList) => {
    setFileInputs(prev => ({ ...prev, [milestoneId]: Array.from(files) }));
  };
  const handleCommentInput = (milestoneId: string, comment: string) => {
    setCommentInputs(prev => ({ ...prev, [milestoneId]: comment }));
  };

  // Handle deliverable upload
  const handleDeliverableUpload = async (milestone: any, projectId: number) => {
    const milestoneId = milestone.id || milestone.Id;
    setUploadLoading(prev => ({ ...prev, [milestoneId]: true }));
    setUploadError(prev => ({ ...prev, [milestoneId]: '' }));
    const files = fileInputs[milestoneId] || [];
    const comment = commentInputs[milestoneId] || '';
    if (files.length === 0 || !comment.trim()) {
      setUploadError(prev => ({ ...prev, [milestoneId]: 'Please upload at least one file and add a comment.' }));
      setUploadLoading(prev => ({ ...prev, [milestoneId]: false }));
      return;
    }
    try {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      // 1. Create deliverable
      await axios.post('http://localhost:7053/api/deliverables', {
        UploadFiles: files.map(f => f.name).join(','),
        MilestoneId: milestoneId,
        ProjectId: projectId,
        Comment: comment,
        Status: 'submitted'
      });
      // 2. Update milestone status to completed
      await axios.put(`http://localhost:7053/api/updatemilestone/${milestoneId}`, {
        ...milestone,
        Status: statusMap['completed']
      });
      // 3. Clear inputs
      setFileInputs(prev => ({ ...prev, [milestoneId]: [] }));
      setCommentInputs(prev => ({ ...prev, [milestoneId]: '' }));
      setStatusEdits(prev => ({ ...prev, [milestoneId]: 'completed' }));
      // 4. Refresh milestones
      const selectedParts = selectedProject.split('___');
      const selectedId = selectedParts.length > 1 ? Number(selectedParts[1]) : undefined;
      const project = projects.find(p => p.id === selectedId);
      if (project) {
        const data = await getMilestonesByProjectId(project.id);
        setMilestones(data);
        for (const m of data) {
          const delivs = await getDeliverablesByMilestoneId(m.id || m.Id);
          setDeliverables(prev => ({ ...prev, [m.id || m.Id]: delivs }));
        }
      }
    } catch (err) {
      setUploadError(prev => ({ ...prev, [milestoneId]: 'Failed to upload deliverable or update milestone.' }));
    } finally {
      setUploadLoading(prev => ({ ...prev, [milestoneId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Milestones</h1>
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
              <option key="all-status" value="All">All</option>
              <option key="not-started" value="not-started">Not Started</option>
              <option key="in-progress" value="in-progress">In Progress</option>
              <option key="completed" value="completed">Completed</option>
              <option key="pending" value="pending">Submitted</option>
              <option key="approved" value="approved">Approved</option>
              <option key="rejected" value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Project:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option key="all-projects" value="All">All Projects</option>
              {projects.filter(project => project && project.id !== undefined && project.projectTitle).map(project => (
                <option key={`project-${project.id}`} value={project.projectTitle + '___' + project.id}>{project.projectTitle}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {/* Milestones Grid */}
      <div className="space-y-4">
        {filteredMilestones.map((milestone) => {
          const milestoneKey = milestone.id || milestone.Id || Math.random();
          const currentStatus = statusEdits[milestoneKey] || getDropdownStatusValue(milestone.status || milestone.Status);
          // Ensure dropdown value is always a valid string
          const dropdownValue: 'not-started' | 'in-progress' | 'completed' =
            currentStatus === 'not-started' || currentStatus === 'in-progress' || currentStatus === 'completed'
              ? currentStatus
              : 'not-started';
          return (
            <div key={milestoneKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{milestone.title || milestone.Title}</h3>
                    <span className="text-sm text-gray-500">•</span>
                    <p className="text-sm text-gray-600 font-medium">{milestone.projectName || milestone.ProjectName}</p>
                    <span className="text-sm text-gray-500">•</span>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{(milestone.dueDate || milestone.DueDate) ? new Date(milestone.dueDate || milestone.DueDate).toLocaleDateString() : ''}</span>
                    </div>
                    <span className="text-sm text-gray-500">•</span>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>${(milestone.amount || milestone.Amount)?.toLocaleString()}</span>
                    </div>
                  </div>
                  {getStatusBadge(getDropdownStatusValue(milestone.status || milestone.Status))}
                </div>
                <p className="text-gray-700 text-sm mb-4 max-w-2xl">{milestone.description || milestone.Description}</p>
                {/* Always show status dropdown */}
                <div className="mb-4 max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={dropdownValue}
                    onChange={(e) => handleStatusChange(milestone, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option key="not-started" value="not-started">Not Started</option>
                    <option key="in-progress" value="in-progress">In Progress</option>
                    <option key="completed" value="completed">Completed</option>
                  </select>
                </div>
                {/* If status is completed, show deliverable upload UI */}
                {dropdownValue === 'completed' && (
                  <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                      <input
                        type="file"
                        multiple
                        onChange={e => e.target.files && handleFileInput(milestoneKey, e.target.files)}
                      />
                      {fileInputs[milestoneKey]?.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {fileInputs[milestoneKey].map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm text-gray-700">{file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes for Client</label>
                      <textarea
                        value={commentInputs[milestoneKey] || ''}
                        onChange={e => handleCommentInput(milestoneKey, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Add any notes or comments for the client..."
                      />
                    </div>
                    {uploadError[milestoneKey] && <div className="text-red-500 text-sm mb-2">{uploadError[milestoneKey]}</div>}
                    <Button
                      onClick={() => handleDeliverableUpload(milestone, (milestone.projectId || milestone.ProjectId))}
                      loading={uploadLoading[milestoneKey]}
                      disabled={uploadLoading[milestoneKey] || (fileInputs[milestoneKey]?.length === 0 || !commentInputs[milestoneKey])}
                    >
                      Upload Deliverable & Complete
                    </Button>
                  </div>
                )}
                {/* Deliverables List */}
                {deliverables[milestoneKey]?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Deliverables</h4>
                    <ul className="list-disc pl-5">
                      {deliverables[milestoneKey].map((d: any) => (
                        <li key={d.Id} className="text-sm text-gray-700">
                          <span className="font-medium">Files:</span> {d.uploadFiles} <br />
                          <span className="font-medium">Comment:</span> {d.comment} <br />
                          <span className="font-medium">Status:</span> {d.Status}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filteredMilestones.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No milestones found</h3>
          <p className="text-gray-600">No milestones match your current filters</p>
        </div>
      )}
    </div>
  );
} 