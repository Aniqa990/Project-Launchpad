import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { KanbanBoard } from './KanbanBoard';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Clock,
  MessageCircle,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  CheckCircle,
  Download,
  Upload
} from 'lucide-react';
import { mockProjects, mockTasks, mockTimeEntries, mockMessages } from '../../utils/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { getMilestones, updateMilestone, getDeliverables, createDeliverable, updateDeliverable, deleteDeliverable } from '../../apiendpoints';
import { Modal } from '../ui/Modal';
import { Deliverable } from '../../types';
import HourlyLogViewer from './HourlyLogViewer';
import { getTimesheets, createTimesheet, approveTimesheet, rejectTimesheet } from '../../apiendpoints';

interface TimeSheetEntry {
  Id: number;
  ProjectName: string;
  FreelancerName: string;
  DateOfWork: string;
  StartTime: string;
  EndTime: string;
  TotalHours: number;
  WorkDescription: string;
  HourlyRate: number;
  CalculatedAmount: number;
  ApprovalStatus: string;
  ReviewerComments?: string | null;
}

// Helper to ensure time is in HH:mm:ss format
function padTime(t: string) {
  if (t.length === 8) return t;
  if (t.length === 5) return t + ':00';
  return t;
}

export function ProjectWorkspace() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [milestones, setMilestones] = useState<any[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null);
  const [milestoneFormLoading, setMilestoneFormLoading] = useState(false);
  const [milestoneError, setMilestoneError] = useState<string | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [deliverablesLoading, setDeliverablesLoading] = useState(true);
  const [deliverableModalOpen, setDeliverableModalOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [deliverableFormLoading, setDeliverableFormLoading] = useState(false);
  const [deliverableError, setDeliverableError] = useState<string | null>(null);

  const project = mockProjects.find(p => p.id === projectId);
  const projectTasks = mockTasks.filter(t => t.projectId === projectId);
  const projectTimeEntries = mockTimeEntries.filter(t => t.projectId === projectId);
  const projectMessages = mockMessages.filter(m => m.projectId === projectId);

  useEffect(() => {
    async function fetchMilestones() {
      setMilestonesLoading(true);
      try {
        const data = await getMilestones();
        setMilestones(data);
      } catch (e) {
        // handle error
      } finally {
        setMilestonesLoading(false);
      }
    }
    fetchMilestones();
  }, []);

  useEffect(() => {
    async function fetchDeliverables() {
      setDeliverablesLoading(true);
      try {
        const data = await getDeliverables();
        setDeliverables(data.filter((d: Deliverable) => d.projectId == Number(project?.id)));
      } catch (e) {
        // handle error
      } finally {
        setDeliverablesLoading(false);
      }
    }
    fetchDeliverables();
  }, [project?.id]);

  // Update milestone handler
  const handleUpdateMilestone = async (id: number, update: any) => {
    setMilestoneFormLoading(true);
    setMilestoneError(null);
    try {
      // Format date fields as ISO strings with time if present
      const dueDate = update.dueDate ? (update.dueDate.length <= 10 ? update.dueDate + 'T00:00:00' : update.dueDate) : '';
      const submissionDate = update.submissionDate ? (update.submissionDate.length <= 10 ? update.submissionDate + 'T00:00:00' : update.submissionDate) : '';
      const payload = {
        title: update.title,
        description: update.description,
        dueDate,
        amount: Number(update.amount),
        freelancerComments: update.freelancerComments,
        submittedFileUrls: update.submittedFileUrls,
        submissionDate,
        status: Number(update.status),
      };
      await updateMilestone(id, payload);
      const data = await getMilestones();
      setMilestones(data);
      setSelectedMilestone(null);
    } catch (e: any) {
      setMilestoneError('Failed to update milestone. Please try again.');
    } finally {
      setMilestoneFormLoading(false);
    }
  };

  const handleCreateDeliverable = async (form: Partial<Deliverable>) => {
    setDeliverableFormLoading(true);
    setDeliverableError(null);
    try {
      await createDeliverable({
        uploadFiles: form.uploadFiles!,
        projectId: Number(project?.id),
        comment: form.comment || '',
        status: (form as any).status || 'Submitted',
      });
      const data = await getDeliverables();
      setDeliverables(data.filter((d: Deliverable) => d.projectId == Number(project?.id)));
      setDeliverableModalOpen(false);
    } catch (e: any) {
      setDeliverableError('Failed to create deliverable. Please try again.');
    } finally {
      setDeliverableFormLoading(false);
    }
  };

  const handleUpdateDeliverable = async (id: number, form: Partial<Deliverable>) => {
    setDeliverableFormLoading(true);
    setDeliverableError(null);
    try {
      await updateDeliverable(id, form as any);
      const data = await getDeliverables();
      setDeliverables(data.filter((d: Deliverable) => d.projectId == Number(project?.id)));
      setDeliverableModalOpen(false);
      setSelectedDeliverable(null);
    } catch (e: any) {
      setDeliverableError('Failed to update deliverable. Please try again.');
    } finally {
      setDeliverableFormLoading(false);
    }
  };

  const handleDeleteDeliverable = async (id: number) => {
    setDeliverableFormLoading(true);
    setDeliverableError(null);
    try {
      await deleteDeliverable(id);
      const data = await getDeliverables();
      setDeliverables(data.filter((d: Deliverable) => d.projectId == Number(project?.id)));
    } catch (e: any) {
      setDeliverableError('Failed to delete deliverable. Please try again.');
    } finally {
      setDeliverableFormLoading(false);
    }
  };

  // Milestone detail/edit modal
  function MilestoneDetailModal({ milestone, isOpen, onClose, onSubmit, loading }: {
    milestone: any;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: number, update: any) => void;
    loading: boolean;
  }) {
    const [form, setForm] = useState<any>({});
    useEffect(() => {
      if (milestone) {
        setForm({
          title: milestone.Title,
          description: milestone.Description,
          dueDate: milestone.DueDate ? milestone.DueDate.split('T')[0] : '',
          amount: milestone.Amount,
          freelancerComments: milestone.FreelancerComments || '',
          submittedFileUrls: milestone.SubmittedFileUrls || '',
          submissionDate: milestone.SubmissionDate ? milestone.SubmissionDate.split('T')[0] : '',
          status: milestone.Status,
        });
      }
    }, [milestone]);
    if (!milestone) return null;
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(milestone.Id, form);
    };

    // Timesheet state
  const [timeEntries, setTimeEntries] = useState<TimeSheetEntry[]>([]);
  const [loadingTimesheets, setLoadingTimesheets] = useState(true);
  const [timesheetError, setTimesheetError] = useState('');
  const [showTimesheetModal, setShowTimesheetModal] = useState(false);
  const [submittingTimesheet, setSubmittingTimesheet] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ open: boolean; id: number | null; action: string; comments: string }>({ open: false, id: null, action: '', comments: '' });

  // Timesheet form state
  const [timesheetForm, setTimesheetForm] = useState({
    DateOfWork: '',
    StartTime: '',
    EndTime: '',
    WorkDescription: '',
    HourlyRate: project?.team?.find(m => m.name === user?.name)?.hourlyRate || 0,
  });

  // Fetch timesheets for this project
  useEffect(() => {
    const fetchTimesheets = async () => {
      setLoadingTimesheets(true);
      setTimesheetError('');
      try {
        const data: TimeSheetEntry[] = await getTimesheets();
        // Filter by project name (case-insensitive)
        const filtered = data.filter(
          (entry: TimeSheetEntry) => project && entry.ProjectName.toLowerCase() === project.title.toLowerCase()
        );
        setTimeEntries(filtered);
      } catch (err) {
        setTimesheetError('Failed to load timesheets.');
        setTimeEntries([]);
      } finally {
        setLoadingTimesheets(false);
      }
    };
    if (project?.title) fetchTimesheets();
  }, [project?.title]);

  // Handle timesheet form input
  const handleTimesheetInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTimesheetForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit new timesheet
  const submitTimesheet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmittingTimesheet(true);
    try {
      if (!project || !user) throw new Error('Missing project or user');
      await createTimesheet({
        ProjectName: project.title,
        FreelancerName: user.name,
        DateOfWork: timesheetForm.DateOfWork,
        StartTime: padTime(timesheetForm.StartTime),
        EndTime: padTime(timesheetForm.EndTime),
        WorkDescription: timesheetForm.WorkDescription,
        HourlyRate: parseFloat(timesheetForm.HourlyRate.toString()),
      });
      setShowTimesheetModal(false);
      setTimesheetForm({ DateOfWork: '', StartTime: '', EndTime: '', WorkDescription: '', HourlyRate: project?.team?.find(m => m.name === user?.name)?.hourlyRate || 0 });
      // Refresh timesheets
      const data: TimeSheetEntry[] = await getTimesheets();
      const filtered = data.filter(
        (entry: TimeSheetEntry) => project && entry.ProjectName.toLowerCase() === project.title.toLowerCase()
      );
      setTimeEntries(filtered);
    } catch (err) {
      alert('Failed to submit timesheet.');
    } finally {
      setSubmittingTimesheet(false);
    }
  };

  // Approve/Reject timesheet
  const handleReview = async () => {
    if (!reviewModal.id) return;
    try {
      if (reviewModal.action === 'approve') {
        await approveTimesheet(reviewModal.id!, reviewModal.comments);
      } else if (reviewModal.action === 'reject') {
        await rejectTimesheet(reviewModal.id!, reviewModal.comments);
      }
      setReviewModal({ open: false, id: null, action: '', comments: '' });
      // Refresh timesheets
      const data: TimeSheetEntry[] = await getTimesheets();
      const filtered = data.filter(
        (entry: TimeSheetEntry) => project && entry.ProjectName.toLowerCase() === project.title.toLowerCase()
      );
      setTimeEntries(filtered);
    } catch (err) {
      alert('Failed to update timesheet.');
    }
  };

  if (!project) {
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
      <Modal isOpen={isOpen} onClose={onClose} title="Milestone Details" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {milestoneError && <div className="text-red-600 text-sm mb-2">{milestoneError}</div>}
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-title">Title</label>
          <input id="milestone-title" name="title" value={form.title || ''} onChange={handleChange} className="w-full border p-2 rounded" required />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-description">Description</label>
          <textarea id="milestone-description" name="description" value={form.description || ''} onChange={handleChange} className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-dueDate">Due Date</label>
          <input id="milestone-dueDate" name="dueDate" type="date" value={form.dueDate || ''} onChange={handleChange} className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-amount">Amount</label>
          <input id="milestone-amount" name="amount" type="number" value={form.amount || ''} onChange={handleChange} className="w-full border p-2 rounded" required />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-freelancerComments">Freelancer Comments</label>
          <textarea id="milestone-freelancerComments" name="freelancerComments" value={form.freelancerComments || ''} onChange={handleChange} className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-submittedFileUrls">Submitted File URLs</label>
          <input id="milestone-submittedFileUrls" name="submittedFileUrls" value={form.submittedFileUrls || ''} onChange={handleChange} className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-submissionDate">Submission Date</label>
          <input id="milestone-submissionDate" name="submissionDate" type="date" value={form.submissionDate || ''} onChange={handleChange} className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-status">Status</label>
          <select id="milestone-status" name="status" value={form.status || 0} onChange={handleChange} className="w-full border p-2 rounded">
            <option value={0}>Pending</option>
            <option value={1}>Approved</option>
            <option value={2}>Paid</option>
          </select>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle },
    { id: 'timesheets', label: 'Timesheets', icon: Clock },
    { id: 'milestones', label: 'Milestones', icon: Calendar },
    { id: 'deliverables', label: 'Deliverables', icon: FileText },
    // Hourly Logs tab should always be after Deliverables and before Chat
    ...(user?.role === 'client' || user?.role === 'freelancer' ? [{ id: 'hourlylogs', label: 'Hourly Logs', icon: Clock }] : []),
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    ...(user?.role === 'client' ? [{ id: 'payments', label: 'Payments', icon: CreditCard }] : [])
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{project.progress}%</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Budget</p>
                    <p className="text-2xl font-bold text-gray-900">${project.budget.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Deadline</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(project.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Description</h3>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.skills.map(skill => (
                  <Badge key={skill} variant="info">{skill}</Badge>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {projectMessages.slice(0, 3).map(message => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <Avatar src={message.sender.avatar} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{message.sender.name}</span> {message.content}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              {user?.role === 'client' && (
                <Button size="sm">Invite Member</Button>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Client */}
              <Card>
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar src={project.client.avatar} alt={project.client.name} size="lg" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{project.client.name}</h4>
                    <p className="text-sm text-gray-600">Project Owner</p>
                    <Badge variant="info" size="sm">Client</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </Card>

              {/* Team Members */}
              {project.team.map(member => (
                <Card key={member.id}>
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar src={member.avatar} alt={member.name} size="lg" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{member.name}</h4>
                      <p className="text-sm text-gray-600">${member.hourlyRate}/hour</p>
                      <Badge variant="success" size="sm">Freelancer</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {member.skills?.slice(0, 3).map(skill => (
                        <Badge key={skill} variant="default" size="sm">{skill}</Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'tasks':
        return <KanbanBoard />;

      case 'timesheets':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Time Tracking</h3>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option>All Team Members</option>
                  {project.team.map(member => (
                    <option key={member.id}>{member.name}</option>
                  ))}
                </select>
                <input 
                  type="date" 
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {projectTimeEntries.reduce((sum, entry) => sum + entry.hours, 0)}h
                  </div>
                  <div className="text-sm text-gray-600">Total Hours</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${projectTimeEntries.reduce((sum, entry) => sum + (entry.hours * 85), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Cost</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {projectTimeEntries.filter(e => e.status === 'submitted').length}
                  </div>
                  <div className="text-sm text-gray-600">Pending Approval</div>
                </div>
              </Card>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Team Member</th>
                      <th className="text-left py-3 px-4">Task</th>
                      <th className="text-left py-3 px-4">Hours</th>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectTimeEntries.map(entry => {
                      const task = projectTasks.find(t => t.id === entry.taskId);
                      const member = project.team.find(m => m.id === entry.userId);
                      return (
                        <tr key={entry.id} className="border-b">
                          <td className="py-3 px-4">{entry.date}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Avatar src={member?.avatar} size="sm" />
                              <span>{member?.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{task?.title}</td>
                          <td className="py-3 px-4">{entry.hours}h</td>
                          <td className="py-3 px-4 max-w-xs truncate">{entry.description}</td>
                          <td className="py-3 px-4">
                            <Badge variant={entry.status === 'approved' ? 'success' : 'warning'}>
                              {entry.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );

      case 'milestones':
        const projectMilestones = milestones.filter(m => m.ProjectId == project.id);
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Project Milestones</h3>
              {user?.role === 'client' && (
                <Button size="sm">Add Milestone</Button>
              )}
            </div>
            {milestonesLoading ? (
              <div>Loading milestones...</div>
            ) : (
            <div className="space-y-4">
              {projectMilestones.map((milestone, index) => (
                <Card key={milestone.Id} className="cursor-pointer">
                  <div
                    className="flex items-start justify-between"
                  >
                    <div
                      className="flex-1"
                      onClick={() => setSelectedMilestone(milestone)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          milestone.Status === 2 ? 'bg-green-100 text-green-600' :
                          milestone.Status === 1 ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">{milestone.Title}</h4>
                        <Badge variant={
                          milestone.Status === 2 ? 'success' :
                          milestone.Status === 1 ? 'warning' : 'default'
                        }>
                          {milestone.Status === 2 ? 'Paid' : milestone.Status === 1 ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3 ml-11">{milestone.Description}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500 ml-11">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Due {milestone.DueDate ? new Date(milestone.DueDate).toLocaleDateString() : 'No due date'}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ${milestone.Amount?.toLocaleString()}
                        </div>
                      </div>
                      {milestone.SubmittedFileUrls && (
                        <div className="mt-3 ml-11">
                          <p className="text-sm font-medium text-gray-700 mb-1">Submitted Files:</p>
                          <a
                            href={milestone.SubmittedFileUrls}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline text-xs"
                            onClick={e => e.stopPropagation()}
                          >
                            {milestone.SubmittedFileUrls}
                          </a>
                        </div>
                      )}
                      {milestone.FreelancerComments && (
                        <div className="mt-2 ml-11 text-xs text-gray-700">
                          <span className="font-medium">Freelancer Comments:</span> {milestone.FreelancerComments}
                        </div>
                      )}
                    </div>
                    <div className="ml-6 flex flex-col gap-2">
                      {milestone.Status === 1 && user?.role === 'client' && (
                        <Button size="sm" onClick={e => e.stopPropagation()}>Release Payment</Button>
                      )}
                      {milestone.Status === 2 && (
                        <a
                          href={milestone.SubmittedFileUrls}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 mr-2"
                          onClick={e => e.stopPropagation()}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            )}
            <MilestoneDetailModal
              milestone={selectedMilestone}
              isOpen={!!selectedMilestone}
              onClose={() => setSelectedMilestone(null)}
              onSubmit={handleUpdateMilestone}
              loading={milestoneFormLoading}
            />
          </div>
        );

      case 'deliverables':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Project Deliverables</h3>
              {user?.role === 'freelancer' && (
                <Button size="sm" icon={Upload} onClick={() => { setDeliverableModalOpen(true); setSelectedDeliverable(null); }}>Upload File</Button>
              )}
            </div>
            {deliverablesLoading ? (
              <div>Loading...</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deliverables.map((deliverable) => (
                  <Card key={deliverable.Id} hover>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{deliverable.uploadFiles.split('/').pop()}</h4>
                        <p className="text-sm text-gray-500">{deliverable.comment}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={deliverable.Status === 'Submitted' ? 'warning' : 'success'}>
                        {deliverable.Status}
                      </Badge>
                      <div className="flex space-x-2">
                        <a
                          href={deliverable.uploadFiles}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 mr-2"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </a>
                        {user?.role === 'freelancer' && (
                          <Button size="sm" variant="outline" onClick={() => { setSelectedDeliverable(deliverable); setDeliverableModalOpen(true); }}>Edit</Button>
                        )}
                        {user?.role === 'freelancer' && (
                          <Button size="sm" variant="outline" onClick={() => handleDeleteDeliverable(deliverable.Id)}>Delete</Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <DeliverableModal
              isOpen={deliverableModalOpen}
              onClose={() => { setDeliverableModalOpen(false); setSelectedDeliverable(null); setDeliverableError(null); }}
              onSubmit={(form) => {
                if (selectedDeliverable) {
                  handleUpdateDeliverable(selectedDeliverable.Id, form);
                } else {
                  handleCreateDeliverable(form);
                }
              }}
              loading={deliverableFormLoading}
              error={deliverableError}
              deliverable={selectedDeliverable}
              projectId={Number(project.id)}
            />
          </div>
        );

      case 'hourlylogs':
        return <HourlyLogViewer />;

      case 'chat':
        return (
          <div className="space-y-6">
            <Card className="h-96 flex flex-col">
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {projectMessages.map(message => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <Avatar src={message.sender.avatar} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{message.sender.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button>Send</Button>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Overview</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${project.milestones.filter(m => m.status === 'paid').reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Paid</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    ${project.milestones.filter(m => m.status === 'approved').reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Ready to Pay</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    ${project.milestones.filter(m => m.status === 'pending').reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
              </Card>
            </div>

            <Card>
              <h4 className="font-semibold text-gray-900 mb-4">Payment History</h4>
              <div className="space-y-3">
                {project.milestones.map(milestone => (
                  <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{milestone.title}</p>
                      <p className="text-sm text-gray-600">{new Date(milestone.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${milestone.amount.toLocaleString()}</p>
                      <Badge variant={
                        milestone.status === 'paid' ? 'success' :
                        milestone.status === 'approved' ? 'warning' : 'default'
                      }>
                        {milestone.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );

      default:
        return <div>Tab content not implemented</div>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{project.team.length} team members</span>
              <span>•</span>
              <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                {project.status}
              </Badge>
            </div>
          </div>
          <Button variant="outline" icon={Settings}>
            Settings
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{project.progress}% Complete</span>
          <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}

function DeliverableModal({ isOpen, onClose, onSubmit, loading, error, deliverable, projectId }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: { uploadFiles: string; projectId: number; comment: string; status: string }) => void;
  loading: boolean;
  error: string | null;
  deliverable: Deliverable | null;
  projectId: number;
}) {
  const [form, setForm] = useState<{ uploadFiles: string; projectId: number; comment: string; status: string }>({ uploadFiles: '', projectId, comment: '', status: 'Submitted' });
  useEffect(() => {
    if (deliverable) {
      setForm({
        uploadFiles: deliverable.uploadFiles,
        projectId,
        comment: deliverable.comment,
        status: deliverable.Status,
      });
    } else {
      setForm({ uploadFiles: '', projectId, comment: '', status: 'Submitted' });
    }
  }, [deliverable, projectId]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={deliverable ? 'Edit Deliverable' : 'Upload Deliverable'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="deliverable-projectId">Project ID</label>
        <input id="deliverable-projectId" name="projectId" value={form.projectId} className="w-full border p-2 rounded bg-gray-100" readOnly />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="deliverable-uploadFiles">File URL</label>
        <input id="deliverable-uploadFiles" name="uploadFiles" value={form.uploadFiles} onChange={handleChange} className="w-full border p-2 rounded" required />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="deliverable-comment">Comment</label>
        <textarea id="deliverable-comment" name="comment" value={form.comment} onChange={handleChange} className="w-full border p-2 rounded" />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="deliverable-status">Status</label>
        <select id="deliverable-status" name="status" value={form.status} onChange={handleChange} className="w-full border p-2 rounded">
          <option value="Submitted">Submitted</option>
          <option value="Approved">Approved</option>
        </select>
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
}