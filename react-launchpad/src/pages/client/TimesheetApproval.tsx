import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
// import DashboardLayout from '../../components/Layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
// Use native elements for textarea, select, input
import { CheckSquare, X, Clock, MessageSquare, User, Calendar, Filter, Search } from 'lucide-react';
import { getTimesheets, approveTimesheet, rejectTimesheet } from '../../apiendpoints';

interface TimesheetEntry {
  id: string;
  freelancerName: string;
  freelancerAvatar: string;
  projectName: string;
  weekEnding: string;
  totalHours: number;
  hourlyRate: number;
  totalAmount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  tasks: {
    id: string;
    name: string;
    hours: number;
    description: string;
    date: string;
  }[];
  submittedAt: string;
}

// Helper to get week ending date (Sunday) for a given date string
function getWeekEnding(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  // 0 = Sunday, so if already Sunday, keep; else add days to get to Sunday
  const diff = 7 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
}

// Transform flat backend data to grouped timesheet structure
function groupTimesheets(flat: any[]): TimesheetEntry[] {
  const grouped: { [key: string]: TimesheetEntry } = {};
  flat.forEach(entry => {
    const weekEnding = getWeekEnding(entry.DateOfWork);
    const key = `${entry.FreelancerName}|${entry.ProjectName}|${weekEnding}`;
    if (!grouped[key]) {
      grouped[key] = {
        id: key,
        freelancerName: entry.FreelancerName,
        freelancerAvatar: '', // Optionally fetch avatar if available
        projectName: entry.ProjectName,
        weekEnding,
        totalHours: 0,
        hourlyRate: entry.HourlyRate,
        totalAmount: 0,
        status: entry.ApprovalStatus,
        tasks: [],
        submittedAt: entry.DateOfWork,
      };
    }
    grouped[key].totalHours += entry.TotalHours;
    grouped[key].totalAmount += entry.CalculatedAmount;
    grouped[key].tasks.push({
      id: String(entry.Id),
      name: entry.WorkDescription.substring(0, 32),
      hours: entry.TotalHours,
      description: entry.WorkDescription,
      date: entry.DateOfWork,
    });
    // Use the latest status/submittedAt if needed
    if (entry.ApprovalStatus !== 'Approved' && grouped[key].status === 'Approved') {
      grouped[key].status = entry.ApprovalStatus;
    }
    if (new Date(entry.DateOfWork) > new Date(grouped[key].submittedAt)) {
      grouped[key].submittedAt = entry.DateOfWork;
    }
  });
  return Object.values(grouped);
}

const TimesheetApproval: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedTimesheet, setSelectedTimesheet] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedFreelancer, setSelectedFreelancer] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getTimesheets()
      .then((data) => {
        setTimesheets(groupTimesheets(data));
        setError(null);
      })
      .catch(() => {
        setError('Failed to fetch timesheets.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const projects = ['E-commerce Website', 'Mobile App Backend', 'Marketing Dashboard'];

  const filteredTimesheets = timesheets.filter(timesheet => {
    const matchesProject = selectedProject === 'all' || timesheet.projectName === selectedProject;
    const matchesFreelancer = selectedFreelancer === 'all' || timesheet.freelancerName === selectedFreelancer;
    const matchesStatus = selectedStatus === 'all' || timesheet.status.toLowerCase() === selectedStatus;
    const matchesDateRange = (!dateRange.start || timesheet.weekEnding >= dateRange.start) && 
                            (!dateRange.end || timesheet.weekEnding <= dateRange.end);
    
    return matchesProject && matchesFreelancer && matchesStatus && matchesDateRange;
  });

  const handleApprove = async (timesheetId: string) => {
    setActionLoading(timesheetId + '-approve');
    const comment = comments[timesheetId] || '';
    try {
      // Use the first task's id as the backend id (since grouped)
      const backendId = timesheets.find(t => t.id === timesheetId)?.tasks[0]?.id;
      await approveTimesheet(Number(backendId), comment);
      setTimesheets(prev => prev.map(t => t.id === timesheetId ? { ...t, status: 'Approved' } : t));
    } catch (err) {
      alert('Failed to approve timesheet.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (timesheetId: string) => {
    const comment = comments[timesheetId] || '';
    if (!comment.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    setActionLoading(timesheetId + '-reject');
    try {
      const backendId = timesheets.find(t => t.id === timesheetId)?.tasks[0]?.id;
      await rejectTimesheet(Number(backendId), comment);
      setTimesheets(prev => prev.map(t => t.id === timesheetId ? { ...t, status: 'Rejected' } : t));
    } catch (err) {
      alert('Failed to reject timesheet.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setSelectedProject('all');
    setSelectedFreelancer('all');
    setSelectedStatus('all');
    setDateRange({ start: '', end: '' });
  };

  const uniqueFreelancers = [...new Set(timesheets.map(t => t.freelancerName))];

  return (
    <div className="space-y-6 px-4 sm:px-8 lg:px-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Timesheet Approval</h1>
        <p className="text-gray-600 mt-1">Review and approve freelancer timesheets</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {filteredTimesheets.filter(t => t.status === 'Pending').length}
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
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {filteredTimesheets.reduce((sum, t) => sum + t.totalHours, 0).toFixed(1)}h
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${filteredTimesheets.reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Freelancers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{uniqueFreelancers.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
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
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="border rounded px-2 py-1">
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>

            <select value={selectedFreelancer} onChange={e => setSelectedFreelancer(e.target.value)} className="border rounded px-2 py-1">
              <option value="all">All Freelancers</option>
              {uniqueFreelancers.map(freelancer => (
                <option key={freelancer} value={freelancer}>{freelancer}</option>
              ))}
            </select>

            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="border rounded px-2 py-1">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <input
              type="date"
              placeholder="Start Date"
              value={dateRange.start}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border rounded px-2 py-1"
            />

            <input
              type="date"
              placeholder="End Date"
              value={dateRange.end}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border rounded px-2 py-1"
            />
          </div>
        </div>
      </Card>

      {/* Timesheets */}
      <div className="space-y-6">
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading timesheets...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-12 text-red-600">
            <p>{error}</p>
          </div>
        )}
        {!loading && filteredTimesheets.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No timesheets to review</h3>
            <p className="text-gray-600">Timesheets will appear here when freelancers submit them for approval.</p>
          </div>
        )}
        {!loading && filteredTimesheets.length > 0 && filteredTimesheets.map((timesheet) => (
          <Card key={timesheet.id} className="overflow-hidden">
            {/* Timesheet Header */}
            <div className="border-b border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <img 
                    src={timesheet.freelancerAvatar} 
                    alt={timesheet.freelancerName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{timesheet.freelancerName}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{timesheet.projectName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Week ending {new Date(timesheet.weekEnding).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{timesheet.totalHours} hours</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:items-end space-y-2">
                  <Badge variant={
                    timesheet.status === 'Approved' ? 'success' :
                    timesheet.status === 'Pending' ? 'warning' :
                    timesheet.status === 'Rejected' ? 'danger' : 'default'
                  }>
                      {timesheet.status}
                   </Badge>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${timesheet.totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">${timesheet.hourlyRate}/hour</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Breakdown */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Task Breakdown</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTimesheet(selectedTimesheet === timesheet.id ? null : timesheet.id)}
                >
                  {selectedTimesheet === timesheet.id ? 'Hide Details' : 'View Details'}
                </Button>
              </div>

              {/* Task Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {timesheet.tasks.slice(0, 3).map((task) => (
                  <Card key={task.id} className="p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-900 text-sm">{task.name}</h5>
                      <span className="text-sm font-semibold text-gray-700">{task.hours}h</span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(task.date).toLocaleDateString()}</p>
                  </Card>
                ))}
                {timesheet.tasks.length > 3 && (
                  <Card className="p-4 bg-gray-50 flex items-center justify-center">
                    <span className="text-sm text-gray-600">+{timesheet.tasks.length - 3} more tasks</span>
                  </Card>
                )}
              </div>

              {/* Detailed Task List */}
              {selectedTimesheet === timesheet.id && (
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {timesheet.tasks.map((task) => (
                          <tr key={task.id}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{task.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{new Date(task.date).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{task.hours}h</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{task.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden divide-y divide-gray-200">
                    {timesheet.tasks.map((task) => (
                      <div key={task.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{task.name}</h5>
                          <span className="text-sm font-semibold text-gray-700">{task.hours}h</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <p className="text-xs text-gray-500">{new Date(task.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {timesheet.status === 'Pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments (optional)
                    </label>
                    <textarea
                      value={comments[timesheet.id] || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(prev => ({ ...prev, [timesheet.id]: e.target.value }))}
                      rows={3}
                      placeholder="Add any comments or feedback..."
                      className="border rounded px-2 py-1 w-full"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => handleApprove(timesheet.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={actionLoading === timesheet.id + '-approve' || actionLoading === timesheet.id + '-reject'}
                    >
                      {actionLoading === timesheet.id + '-approve' ? (
                        <span className="animate-spin mr-2">⏳</span>
                      ) : (
                        <CheckSquare className="w-4 h-4 mr-2" />
                      )}
                      Approve Timesheet
                    </Button>
                    <Button
                      onClick={() => handleReject(timesheet.id)}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                      disabled={actionLoading === timesheet.id + '-approve' || actionLoading === timesheet.id + '-reject'}
                    >
                      {actionLoading === timesheet.id + '-reject' ? (
                        <span className="animate-spin mr-2">⏳</span>
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      Reject Timesheet
                    </Button>
                  </div>
                </div>
              )}

              {timesheet.status === 'Approved' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckSquare className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Timesheet approved on {new Date(timesheet.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              {timesheet.status === 'Rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <X className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800 font-medium">Timesheet rejected</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TimesheetApproval; 