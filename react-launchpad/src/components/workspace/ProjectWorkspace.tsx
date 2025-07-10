import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
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

  const project = mockProjects.find(p => p.id === projectId);
  const projectTasks = mockTasks.filter(t => t.projectId === projectId);
  const projectTimeEntries = mockTimeEntries.filter(t => t.projectId === projectId);
  const projectMessages = mockMessages.filter(m => m.projectId === projectId);

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle },
    { id: 'timesheets', label: 'Timesheets', icon: Clock },
    { id: 'milestones', label: 'Milestones', icon: Calendar },
    { id: 'deliverables', label: 'Deliverables', icon: FileText },
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
                {user?.role === 'freelancer' && (
                  <Button size="sm" onClick={() => setShowTimesheetModal(true)}>
                    Submit Timesheet
                  </Button>
                )}
              </div>
            </div>
            {loadingTimesheets ? (
              <Card className="text-center py-12">Loading timesheets...</Card>
            ) : timesheetError ? (
              <Card className="text-center py-12 text-red-500">{timesheetError}</Card>
            ) : (
              <>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                        {timeEntries.reduce((sum: number, entry: TimeSheetEntry) => sum + entry.TotalHours, 0)}h
                  </div>
                  <div className="text-sm text-gray-600">Total Hours</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                        ${timeEntries.reduce((sum: number, entry: TimeSheetEntry) => sum + entry.CalculatedAmount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Cost</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                        {timeEntries.filter((e: TimeSheetEntry) => e.ApprovalStatus === 'Pending').length}
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
                          <th className="text-left py-3 px-4">Freelancer</th>
                      <th className="text-left py-3 px-4">Hours</th>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                        {timeEntries.map((entry: TimeSheetEntry) => (
                          <tr key={entry.Id} className="border-b">
                            <td className="py-3 px-4">{new Date(entry.DateOfWork).toLocaleDateString()}</td>
                            <td className="py-3 px-4">{entry.FreelancerName}</td>
                            <td className="py-3 px-4">{entry.TotalHours}h</td>
                            <td className="py-3 px-4 max-w-xs truncate">{entry.WorkDescription}</td>
                          <td className="py-3 px-4">
                              <Badge variant={
                                entry.ApprovalStatus === 'Approved' ? 'success' :
                                entry.ApprovalStatus === 'Pending' ? 'warning' : 'danger'
                              }>
                                {entry.ApprovalStatus}
                            </Badge>
                          </td>
                            <td className="py-3 px-4">
                              {user?.role === 'client' && entry.ApprovalStatus === 'Pending' && (
                                <>
                                  <Button size="sm" variant="primary" onClick={() => setReviewModal({ open: true, id: entry.Id, action: 'approve', comments: '' })}>Approve</Button>
                                  <Button size="sm" variant="danger" className="ml-2" onClick={() => setReviewModal({ open: true, id: entry.Id, action: 'reject', comments: '' })}>Reject</Button>
                                </>
                              )}
                              {entry.ReviewerComments && (
                                <span className="text-xs text-gray-500 ml-2">{entry.ReviewerComments}</span>
                              )}
                            </td>
                        </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </Card>
              </>
            )}

            {/* Timesheet Submission Modal */}
            {showTimesheetModal && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Submit Timesheet</h3>
                  <form onSubmit={submitTimesheet} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date of Work</label>
                      <input type="date" name="DateOfWork" value={timesheetForm.DateOfWork} onChange={handleTimesheetInput} required className="w-full border px-3 py-2 rounded" />
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Start Time</label>
                        <input type="time" name="StartTime" value={timesheetForm.StartTime} onChange={handleTimesheetInput} required className="w-full border px-3 py-2 rounded" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">End Time</label>
                        <input type="time" name="EndTime" value={timesheetForm.EndTime} onChange={handleTimesheetInput} required className="w-full border px-3 py-2 rounded" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Work Description</label>
                      <textarea name="WorkDescription" value={timesheetForm.WorkDescription} onChange={handleTimesheetInput} required className="w-full border px-3 py-2 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Hourly Rate</label>
                      <input type="number" name="HourlyRate" value={timesheetForm.HourlyRate} onChange={handleTimesheetInput} required className="w-full border px-3 py-2 rounded" min="0" step="0.01" />
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button type="button" variant="outline" onClick={() => setShowTimesheetModal(false)}>Cancel</Button>
                      <Button type="submit" variant="primary" disabled={submittingTimesheet}>{submittingTimesheet ? 'Submitting...' : 'Submit'}</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Approve/Reject Modal */}
            {reviewModal.open && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">{reviewModal.action === 'approve' ? 'Approve' : 'Reject'} Timesheet</h3>
                  <textarea
                    className="w-full border px-3 py-2 rounded mb-4"
                    placeholder="Reviewer comments (optional)"
                    value={reviewModal.comments}
                    onChange={e => setReviewModal({ ...reviewModal, comments: e.target.value })}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setReviewModal({ open: false, id: null, action: '', comments: '' })}>Cancel</Button>
                    <Button variant={reviewModal.action === 'approve' ? 'primary' : 'danger'} onClick={handleReview}>
                      {reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'milestones':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Project Milestones</h3>
              {user?.role === 'client' && (
                <Button size="sm">Add Milestone</Button>
              )}
            </div>

            <div className="space-y-4">
              {project.milestones.map((milestone, index) => (
                <Card key={milestone.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          milestone.status === 'paid' ? 'bg-green-100 text-green-600' :
                          milestone.status === 'approved' ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">{milestone.title}</h4>
                        <Badge variant={
                          milestone.status === 'paid' ? 'success' :
                          milestone.status === 'approved' ? 'warning' : 'default'
                        }>
                          {milestone.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3 ml-11">{milestone.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 ml-11">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Due {new Date(milestone.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ${milestone.amount.toLocaleString()}
                        </div>
                      </div>

                      <div className="mt-3 ml-11">
                        <p className="text-sm font-medium text-gray-700 mb-1">Deliverables:</p>
                        <div className="flex flex-wrap gap-2">
                          {milestone.deliverables.map((deliverable, idx) => (
                            <Badge key={idx} variant="info" size="sm">{deliverable}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="ml-6">
                      {milestone.status === 'approved' && user?.role === 'client' && (
                        <Button size="sm">Release Payment</Button>
                      )}
                      {milestone.status === 'paid' && (
                        <Button size="sm" variant="outline" icon={Download}>
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'deliverables':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Project Deliverables</h3>
              {user?.role === 'freelancer' && (
                <Button size="sm" icon={Upload}>Upload File</Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.milestones.map(milestone => 
                milestone.deliverables.map((deliverable, index) => (
                  <Card key={`${milestone.id}-${index}`} hover>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{deliverable}</h4>
                        <p className="text-sm text-gray-500">{milestone.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant={milestone.status === 'paid' ? 'success' : 'warning'}>
                        {milestone.status === 'paid' ? 'Available' : 'Locked'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={milestone.status !== 'paid'}
                        icon={Download}
                      >
                        Download
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        );

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