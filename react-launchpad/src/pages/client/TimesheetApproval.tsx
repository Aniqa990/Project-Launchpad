import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { CheckSquare, X, Clock, MessageSquare, User, Calendar, Filter, Search } from 'lucide-react';
import { getTimesheets, getTimesheetsByFreelancer, approveTimesheet, rejectTimesheet, getProjectById, getProjectsByClient, getFreelancersByProject, getTimesheetsByFreelancerId, getFreelancerById } from '../../apiendpoints';
import { useAuth } from '../../contexts/AuthContext';

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

interface Project {
  Id: number;
  ProjectTitle: string;
  Description: string;
  Status: string;
  Budget: number;
  Deadline: string;
  CategoryOrDomain: string;
  PaymentType: string;
  NumberOfFreelancers: number;
  RequiredSkills: string;
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

// Helper to format hours as hh:mm:ss
function formatHours(hours: number) {
  const totalSeconds = Math.round(hours * 3600);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}


async function groupTimesheets(flat: any[]): Promise<TimesheetEntry[]> {
  const grouped: { [key: string]: TimesheetEntry } = {};
  
  // Create a map to store freelancer profiles to avoid duplicate API calls
  const freelancerProfiles: { [key: number]: any } = {};
  
  const getFreelancerProfile = async (freelancerId: number) => {
    if (freelancerProfiles[freelancerId]) {
      return freelancerProfiles[freelancerId];
    }
    try {
      const profile = await getFreelancerById(freelancerId);
      freelancerProfiles[freelancerId] = profile;
      return profile;
    } catch (error) {
      console.error(`Error fetching freelancer profile for ID ${freelancerId}:`, error);
      return null;
    }
  };
  
  // Process all entries and fetch freelancer profiles
  for (const entry of flat) {
    const freelancerId = entry.FreelancerId;
    const freelancerProfile = await getFreelancerProfile(freelancerId);
    const freelancerHourlyRate = freelancerProfile?.hourlyRate || 0;
    
    const weekEnding = getWeekEnding(entry.DateOfWork);
    // Use FreelancerId if FreelancerName is not available
    const freelancerName = entry.FreelancerName || `Freelancer ${entry.FreelancerId}`;
    const key = `${freelancerName}|${entry.ProjectName}|${weekEnding}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        id: key,
        freelancerName: freelancerName,
        freelancerAvatar: '', 
        projectName: entry.ProjectName,
        weekEnding,
        totalHours: 0,
        hourlyRate: freelancerHourlyRate, // Use freelancer's hourly rate
        totalAmount: 0,
        status: entry.ApprovalStatus,
        tasks: [],
        submittedAt: entry.DateOfWork,
      };
    }
    grouped[key].totalHours += entry.TotalHours;
    // Recalculate total amount using freelancer's hourly rate
    grouped[key].totalAmount = grouped[key].totalHours * freelancerHourlyRate;
    grouped[key].tasks.push({
      id: String(entry.Id),
      name: entry.WorkDescription.substring(0, 32),
      hours: entry.TotalHours,
      description: entry.WorkDescription,
      date: entry.DateOfWork,
    });
    if (entry.ApprovalStatus !== 'Approved' && grouped[key].status === 'Approved') {
      grouped[key].status = entry.ApprovalStatus;
    }
    if (new Date(entry.DateOfWork) > new Date(grouped[key].submittedAt)) {
      grouped[key].submittedAt = entry.DateOfWork;
    }
  }
  
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
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    
    const fetchData = async () => {
      try {
        if (!user?.id) throw new Error('Client not logged in');
        
        let allTimesheets: any[] = [];
        let targetProject: Project | null = null;
        
        if (projectId) {
          // If specific projectId is provided, only fetch data for that project
          console.log('Fetching specific project:', projectId);
          try {
            targetProject = await getProjectById(projectId);
            console.log('Target project:', targetProject);
            
            if (targetProject) {
              // Get freelancers for this specific project
              const freelancers = await getFreelancersByProject(Number(projectId));
              console.log('Freelancers for project', projectId, ':', freelancers);
              
              // For each freelancer, get their timesheets
              for (const freelancer of freelancers) {
                const freelancerId = freelancer.Id || freelancer.id;
                if (!freelancerId) {
                  console.warn('Skipping freelancer with missing Id:', freelancer);
                  continue;
                }
                
                console.log('Fetching timesheets for freelancer:', freelancerId);
                const freelancerTimesheets = await getTimesheetsByFreelancerId(freelancerId);
                console.log('Timesheets for freelancer', freelancerId, ':', freelancerTimesheets);
                if (freelancerTimesheets.length > 0) {
                  console.log('Sample timesheet structure:', freelancerTimesheets[0]);
                }
                
                // Filter timesheets to only include those for the specific project
                const projectTimesheets = freelancerTimesheets.filter((ts: any) => {
                  const timesheetProjectId = ts.projectId || ts.ProjectId;
                  const matchesProject = timesheetProjectId === Number(projectId);
                  console.log(`Timesheet ${ts.id}: projectId=${timesheetProjectId}, targetProjectId=${projectId}, matches=${matchesProject}`);
                  return matchesProject;
                });
                
                // Add project name to each timesheet entry
                const timesheetsWithProject = projectTimesheets.map((ts: any) => ({ 
                  ...ts, 
                  ProjectName: targetProject!.ProjectTitle,
                  FreelancerName: freelancer.FirstName + ' ' + freelancer.LastName || freelancer.Name || `Freelancer ${freelancerId}`
                }));
                
                allTimesheets.push(...timesheetsWithProject);
              }
            }
          } catch (projectErr) {
            console.error('Error fetching specific project:', projectErr);
            setError('Failed to fetch project details');
            setLoading(false);
            return;
          }
        } else {
          // If no projectId, fetch all projects and their timesheets
          console.log('Fetching all projects for client:', user.id);
          const projects = await getProjectsByClient(user.id);
          console.log('Projects fetched:', projects);
          
          // For each project, get the assigned freelancers
          for (const project of projects) {
            console.log('Fetching freelancers for project:', project.Id);
            const freelancers = await getFreelancersByProject(project.Id);
            console.log('Freelancers for project', project.Id, ':', freelancers);
            
            // For each freelancer, get their timesheets
            for (const freelancer of freelancers) {
              const freelancerId = freelancer.Id || freelancer.id;
              if (!freelancerId) {
                console.warn('Skipping freelancer with missing Id:', freelancer);
                continue;
              }
              
              console.log('Fetching timesheets for freelancer:', freelancerId);
              const freelancerTimesheets = await getTimesheetsByFreelancerId(freelancerId);
              console.log('Timesheets for freelancer', freelancerId, ':', freelancerTimesheets);
              if (freelancerTimesheets.length > 0) {
                console.log('Sample timesheet structure:', freelancerTimesheets[0]);
              }
              
                             // Filter timesheets to only include those for the current project
               const projectTimesheets = freelancerTimesheets.filter((ts: any) => {
                 const timesheetProjectId = ts.projectId || ts.ProjectId;
                 const matchesProject = timesheetProjectId === project.Id;
                 console.log(`Timesheet ${ts.id}: projectId=${timesheetProjectId}, currentProjectId=${project.Id}, matches=${matchesProject}`);
                 return matchesProject;
               });
              
              // Add project name to each timesheet entry
              const timesheetsWithProject = projectTimesheets.map((ts: any) => ({ 
                ...ts, 
                ProjectName: project.ProjectTitle,
                FreelancerName: freelancer.FirstName + ' ' + freelancer.LastName || freelancer.Name || `Freelancer ${freelancerId}`
              }));
              
              allTimesheets.push(...timesheetsWithProject);
            }
          }
        }
        
        console.log('All timesheets before grouping:', allTimesheets);
        const groupedTimesheets = await groupTimesheets(allTimesheets);
        console.log('Grouped timesheets:', groupedTimesheets);
        
        setTimesheets(groupedTimesheets);
        if (targetProject) {
          setProject(targetProject);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, projectId]);

  // Get unique projects from the actual timesheet data
  const projects = [...new Set(timesheets.map(t => t.projectName))];
  
  // If we have a specific project, only show that project in the dropdown
  const availableProjects = projectId && project ? [project.ProjectTitle] : projects;

  // Set the selected project to the specific project when projectId is provided
  useEffect(() => {
    if (projectId && project && timesheets.length > 0) {
      // Set the selected project to the project title from the fetched project data
      setSelectedProject(project.ProjectTitle);
    }
  }, [projectId, project, timesheets]);

  const filteredTimesheets = timesheets.filter(timesheet => {
    // If projectId is provided in URL, only show timesheets for that project
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
        <p className="text-gray-600 mt-1">
          {project 
            ? `Review and approve freelancer timesheets for: ${project.ProjectTitle}`
            : projectId 
            ? `Review and approve freelancer timesheets for Project ID: ${projectId}`
            : 'Review and approve freelancer timesheets'
          }
        </p>
        {project && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Category:</span> {project.CategoryOrDomain}
              </div>
              <div>
                <span className="font-medium text-gray-700">Payment Type:</span> {project.PaymentType}
              </div>
              <div>
                <span className="font-medium text-gray-700">Budget:</span> ${project.Budget?.toLocaleString()}
              </div>
            </div>
          </div>
        )}
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
            <select 
              value={selectedProject} 
              onChange={e => setSelectedProject(e.target.value)} 
              className="border rounded px-2 py-1"
              disabled={!!projectId}
            >
              <option value="all">
                {projectId ? (project?.ProjectTitle || 'Loading...') : 'All Projects'}
              </option>
              {availableProjects.map(projectName => (
                <option key={projectName} value={projectName}>{projectName}</option>
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
            <p className="text-gray-600">
              {projectId ? 'Loading project and timesheets...' : 'Loading timesheets...'}
            </p>
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
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {timesheet.freelancerName.charAt(0).toUpperCase()}
                  </div>
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
                        <span>{formatHours(timesheet.totalHours)} hours</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:items-end space-y-2">
                  <Badge variant={
                    timesheet.status === 'Approved' ? 'success' :
                    timesheet.status === 'Pending' ? 'info' :
                    timesheet.status === 'Rejected' ? 'destructive' : 'default'
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
              </div>

              {/* Detailed Task List */}
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
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
                        <td className="px-4 py-3 text-sm text-gray-900">{formatHours(task.hours)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{task.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Approval/Rejection Controls */}
              {timesheet.status === 'Pending' && (
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                  <input
                    type="text"
                    placeholder="Add a comment (required for rejection)"
                    value={comments[timesheet.id] || ''}
                    onChange={e => setComments(prev => ({ ...prev, [timesheet.id]: e.target.value }))}
                    className="border rounded px-3 py-2 flex-1"
                    disabled={actionLoading !== null}
                  />
                  <Button
                    variant="primary"
                    onClick={() => handleApprove(timesheet.id)}
                    disabled={actionLoading === timesheet.id + '-approve'}
                    className="min-w-[100px]"
                  >
                    {actionLoading === timesheet.id + '-approve' ? 'Approving...' : 'Approve'}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleReject(timesheet.id)}
                    disabled={actionLoading === timesheet.id + '-reject'}
                    className="min-w-[100px]"
                  >
                    {actionLoading === timesheet.id + '-reject' ? 'Rejecting...' : 'Reject'}
                  </Button>
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