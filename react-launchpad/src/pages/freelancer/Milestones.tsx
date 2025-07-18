import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/avatar';
import { Modal } from '../../components/ui/Modal';
import { Calendar, DollarSign, Upload, MessageSquare, Send, CheckCircle, XCircle, Clock, Filter, Paperclip, X, Target } from 'lucide-react';
import { getFreelancerProjects, getMilestonesByProjectId, getDeliverablesByMilestoneId, createDeliverable } from '../../apiendpoints';
import { useAuth } from '../../contexts/AuthContext';

export function Milestones() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('All');
  const [milestones, setMilestones] = useState<any[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File[]}>({});
  const [comments, setComments] = useState<{[key: string]: string}>({});
  const [deliverables, setDeliverables] = useState<{[key: string]: any[]}>({});

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
      console.log('Setting default project:', projects[0].Title);
      setSelectedProject(projects[0].Title);
    }
  }, [projects]);

  // Only fetch milestones if both projects and selectedProject are set and valid
  useEffect(() => {
    async function fetchMilestones() {
      setMilestonesLoading(true);
      try {
        if (!selectedProject || selectedProject === 'All') {
          console.log('Clearing milestones because selectedProject is not set or All');
          setMilestones([]);
        } else {
          const project = projects.find(p => p.Title === selectedProject);
          if (project) {
            console.log('Fetching milestones for project:', project.Title, project.Id);
            const data = await getMilestonesByProjectId(project.Id);
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
    const statusMatch = statusFilter === 'All' || milestone.status === statusFilter;
    return statusMatch;
  });

  // Status badge
  const getStatusBadge = (status: string | undefined) => {
    if (!status) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Unknown
        </span>
      );
    }
    const badges = {
      'not-started': { color: 'bg-gray-100 text-gray-800', icon: Clock },
      'in-progress': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'completed': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'pending': { color: 'bg-orange-100 text-orange-800', text: 'Submitted – Awaiting Client Review' },
      'approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'rejected': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const badge = badges[status as keyof typeof badges];
    const Icon = badge && 'icon' in badge ? badge.icon : undefined;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge?.color}`}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {badge && 'text' in badge ? badge.text : (typeof status === 'string' ? status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown')}
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
              <option value="All">All</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="pending">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Project:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Projects</option>
              {projects.map(project => (
                <option key={project.Id} value={project.Title}>{project.Title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {/* Milestones Grid */}
      <div className="space-y-4">
        {filteredMilestones.map((milestone) => {
          const isExpanded = expandedMilestone === milestone.Id;
          const isSubmitted = ['pending', 'approved', 'rejected'].includes(milestone.status);
          return (
            <div key={milestone.Id} className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{milestone.Title}</h3>
                    <span className="text-sm text-gray-500">•</span>
                    <p className="text-sm text-gray-600 font-medium">{milestone.ProjectName}</p>
                    <span className="text-sm text-gray-500">•</span>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{milestone.DueDate ? new Date(milestone.DueDate).toLocaleDateString() : ''}</span>
                    </div>
                    <span className="text-sm text-gray-500">•</span>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>${milestone.Amount?.toLocaleString()}</span>
                    </div>
                  </div>
                  {getStatusBadge(milestone.status)}
                </div>
                <p className="text-gray-700 text-sm mb-4 max-w-2xl">{milestone.Description}</p>
                {!isSubmitted && (
                  <div className="mb-4 max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={milestone.status}
                      onChange={(e) => {}}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                )}
                {/* Expanded Section for Completed Status */}
                {isExpanded && milestone.status === 'completed' && (
                  <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                    {/* File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachments
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          multiple
                          onChange={(e) => e.target.files && handleFileUpload(milestone.Id, e.target.files)}
                          className="hidden"
                          id={`file-upload-${milestone.Id}`}
                        />
                        <label
                          htmlFor={`file-upload-${milestone.Id}`}
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Click to upload files</span>
                        </label>
                      </div>
                      {/* Uploaded Files */}
                      {uploadedFiles[milestone.Id]?.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {uploadedFiles[milestone.Id].map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div className="flex items-center space-x-2">
                                <Paperclip className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700">{file.name}</span>
                              </div>
                              <button
                                onClick={() => removeFile(milestone.Id, index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Comment Box */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes for Client
                      </label>
                      <textarea
                        value={comments[milestone.Id] || ''}
                        onChange={(e) => setComments(prev => ({ ...prev, [milestone.Id]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Add any notes or comments for the client..."
                      />
                    </div>
                    {/* Submit Button */}
                    <button
                      onClick={() => handleSubmit(milestone.Id)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit to Client & Platform</span>
                    </button>
                  </div>
                )}
                {/* Deliverables List */}
                {deliverables[milestone.Id]?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Deliverables</h4>
                    <ul className="list-disc pl-5">
                      {deliverables[milestone.Id].map((d, i) => (
                        <li key={i} className="text-sm text-gray-700">{d.uploadFiles} - {d.comment}</li>
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