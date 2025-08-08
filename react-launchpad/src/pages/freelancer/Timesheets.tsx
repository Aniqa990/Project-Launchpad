import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFreelancerProjects, createTimesheet, getTimesheets, getFreelancerById } from '../../apiendpoints';
import { 
  Play, 
  Square, 
  Clock, 
  Filter, 
  Calendar, 
  Plus, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  TrendingUp,
  CalendarDays,
  Timer,
  FileText,
  Users,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react';
import {Timesheet} from '../../types';
import { handleApiError } from '@/utils/errorHandler';

interface Project {
  id: number;
  title: string;
  status: string;
  hourlyRate: number;
  description?: string;
  deadline?: string;
  progress?: number;
}

export function FreelancerTimesheets() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [freelancerProfile, setFreelancerProfile] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [workDescription, setWorkDescription] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    workDescription: '',
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    timesheetId?: number;
  }>>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate summary statistics
  const totalHoursThisWeek = timesheets
    .filter(t => {
      const timesheetDate = new Date(t.dateOfWork);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return timesheetDate >= weekAgo;
    })
    .reduce((sum, t) => sum + t.totalHours, 0);

  const totalEarningsThisWeek = timesheets
    .filter(t => {
      const timesheetDate = new Date(t.dateOfWork);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return timesheetDate >= weekAgo;
    })
    .reduce((sum, t) => sum + t.calculatedAmount, 0);

  const pendingTimesheets = timesheets.filter(t => t.approvalStatus === 'Pending').length;
  const approvedTimesheets = timesheets.filter(t => t.approvalStatus === 'Approved').length;

  useEffect(() => {
    if (!user?.id) return;
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        console.log('=== DEBUGGING PROJECT FETCH ===');
        console.log('User ID:', user.id);
        
        if (typeof user?.id !== 'number') {
          setProjectsLoading(false);
          return;
        }
        
        const data = await getFreelancerProjects(user.id);
        console.log('Raw API response:', data);
        console.log('Data type:', typeof data);
        console.log('Is array?', Array.isArray(data));
        
        if (Array.isArray(data)) {
          console.log('Number of projects:', data.length);
          console.log('First project:', data[0]);
          // Add detailed logging for hourly rate fields
          if (data.length > 0) {
            console.log('=== HOURLY RATE DEBUG ===');
            console.log('First project raw data:', data[0]);
            console.log('Available fields:', Object.keys(data[0]));
            console.log('hourlyRate field:', data[0].hourlyRate);
            console.log('hourly_rate field:', data[0].hourly_rate);
            console.log('HourlyRate field:', data[0].HourlyRate);
            console.log('All projects hourly rates:');
            data.forEach((p, index) => {
              console.log(`Project ${index}:`, {
                id: p.id || p.Id,
                title: p.title || p.Title,
                hourlyRate: p.hourlyRate,
                hourly_rate: p.hourly_rate,
                HourlyRate: p.HourlyRate,
                allFields: Object.keys(p)
              });
            });
          }
        }
        
        setProjects(
          data.map((p: any) => ({
            id: p.id || p.Id || p.projectId || p.project_id,
            title: p.title || p.Title || p.projectTitle || p.project_title || p.name || p.Name || 'Untitled Project',
            status: p.status || p.Status || 'active',
            hourlyRate: p.hourlyRate || p.hourly_rate || p.HourlyRate || 0,
            description: p.description || p.Description || p.projectDescription || p.project_description,
            deadline: p.deadline || p.Deadline || p.dueDate || p.due_date,
            progress: p.progress || p.Progress || 0,
          }))
        );
      } catch (error) {
        console.error('Error fetching projects:', error);
        handleApiError(error, 'fetchProjects');
        setError('Failed to fetch projects');
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchProjects();
  }, [user?.id]);

  // Fetch freelancer profile to get hourly rate
  useEffect(() => {
    if (!user?.id) return;
    const fetchFreelancerProfile = async () => {
      try {
        console.log('=== FETCHING FREELANCER PROFILE ===');
        console.log('User ID:', user.id);
        
        if (typeof user?.id !== 'number') {
          return;
        }
        
        const profile = await getFreelancerById(user.id);
        console.log('Freelancer profile:', profile);
        console.log('Hourly rate from profile:', profile.hourlyRate);
        setFreelancerProfile(profile);
      } catch (error) {
        console.error('Error fetching freelancer profile:', error);
        handleApiError(error, 'fetchProfile');
      }
    };
    fetchFreelancerProfile();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || projects.length === 0) return;
    const fetchTimesheets = async () => {
      setLoading(true);
      try {
        console.log('=== DEBUGGING TIMESHEET FETCH ===');
        console.log('User ID:', user.id);
        console.log('Available projects:', projects.length);
        
        const data = await getTimesheets();
        console.log('Raw timesheet data:', data);
        console.log('Data type:', typeof data);
        console.log('Is array?', Array.isArray(data));
        
        if (Array.isArray(data)) {
          console.log('Number of timesheets:', data.length);
          if (data.length > 0) {
            console.log('First timesheet:', data[0]);
            console.log('Available fields:', Object.keys(data[0]));
          }
        }
        
                 // Transform timesheet data to camelCase and add project names
         const transformedTimesheets = data.map((t: any) => {
           // Get project name from projects array
           const project = projects.find(p => p.id === t.ProjectId);
           
           return {
             id: t.Id || t.id,
             projectId: t.ProjectId || t.projectId,
             projectName: project?.title || `Project ${t.ProjectId || t.projectId}`,
             dateOfWork: t.DateOfWork || t.dateOfWork || '',
             startTime: t.StartTime || t.startTime || '',
             endTime: t.EndTime || t.endTime || '',
             totalHours: t.TotalHours || t.totalHours || 0,
             workDescription: t.WorkDescription || t.workDescription || '',
             hourlyRate: t.HourlyRate || t.hourlyRate || 0,
             calculatedAmount: t.CalculatedAmount || t.calculatedAmount || 0,
             approvalStatus: t.ApprovalStatus || t.approvalStatus || 'Pending',
             reviewerComments: t.ReviewerComments || t.reviewerComments || '',
             freelancerId: t.FreelancerId || t.freelancerId,
           };
         });
        
        console.log('Transformed timesheets:', transformedTimesheets);
        
                 // Filter timesheets for this freelancer and use transformed data
         const freelancerTimesheets = transformedTimesheets.filter((t: any) => t.freelancerId === user.id);
         setTimesheets(freelancerTimesheets);
      } catch (error) {
        console.error('Error fetching timesheets:', error);
        handleApiError(error, 'fetchTimesheets');
        setError('Failed to fetch timesheets');
        setTimesheets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTimesheets();
  }, [user?.id, projects]);

  // Add periodic refresh to get real-time updates
  useEffect(() => {
    if (!user?.id || projects.length === 0) return;

         const interval = setInterval(async () => {
       try {
         const data = await getTimesheets();
         
         // Transform timesheet data to camelCase and add project names
         const transformedTimesheets = data.map((t: any) => {
           const project = projects.find(p => p.id === t.ProjectId);
           return {
             id: t.Id || t.id,
             projectId: t.ProjectId || t.projectId,
             projectName: project?.title || `Project ${t.ProjectId || t.projectId}`,
             dateOfWork: t.DateOfWork || t.dateOfWork || '',
             startTime: t.StartTime || t.startTime || '',
             endTime: t.EndTime || t.endTime || '',
             totalHours: t.TotalHours || t.totalHours || 0,
             workDescription: t.WorkDescription || t.workDescription || '',
             hourlyRate: t.HourlyRate || t.hourlyRate || 0,
             calculatedAmount: t.CalculatedAmount || t.calculatedAmount || 0,
             approvalStatus: t.ApprovalStatus || t.approvalStatus || 'Pending',
             reviewerComments: t.ReviewerComments || t.reviewerComments || '',
             freelancerId: t.FreelancerId || t.freelancerId,
           };
         });
         
         const freelancerTimesheets = transformedTimesheets.filter((t: any) => t.freelancerId === user.id);
         
         // Only update if there are changes
         setTimesheets(prev => {
           const prevIds = prev.map(t => t.id).sort();
           const newIds = freelancerTimesheets.map((t: any) => t.id).sort();
           
           if (JSON.stringify(prevIds) !== JSON.stringify(newIds)) {
             return freelancerTimesheets;
           }
           
           // Check for status changes and show notifications
           const statusChanges = freelancerTimesheets.filter((newTs: any) => {
             const oldTs = prev.find(p => p.id === newTs.id);
             return oldTs && oldTs.approvalStatus !== newTs.approvalStatus;
           });
           
           if (statusChanges.length > 0) {
             statusChanges.forEach((changedTs: any) => {
               const oldTs = prev.find(p => p.id === changedTs.id);
               if (oldTs) {
                 const message = changedTs.approvalStatus === 'Approved' 
                   ? `Your timesheet for ${changedTs.projectName || 'project'} has been approved!`
                   : `Your timesheet for ${changedTs.projectName || 'project'} has been rejected. ${changedTs.reviewerComments ? `Reason: ${changedTs.reviewerComments}` : ''}`;
                 
                 setNotifications(prev => [...prev, {
                   id: Date.now().toString(),
                   message,
                   type: changedTs.approvalStatus === 'Approved' ? 'success' : 'error',
                   timesheetId: changedTs.id
                 }]);
               }
             });
           }
           
           return statusChanges.length > 0 ? freelancerTimesheets : prev;
         });
       } catch (error) {
         console.error('Error refreshing timesheets:', error);
       }
     }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [user?.id, projects]);

  useEffect(() => {
    // Restore timer state from localStorage on mount
    const savedSession = localStorage.getItem('activeSession');
    const savedStart = localStorage.getItem('sessionStart');
    if (savedSession && savedStart) {
      setActiveSession(Number(savedSession));
      setSessionStart(new Date(savedStart));
    }
  }, []);

  useEffect(() => {
    // Persist timer state to localStorage
    if (activeSession && sessionStart) {
      localStorage.setItem('activeSession', String(activeSession));
      localStorage.setItem('sessionStart', sessionStart.toISOString());
    } else {
      localStorage.removeItem('activeSession');
      localStorage.removeItem('sessionStart');
    }
  }, [activeSession, sessionStart]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession && sessionStart) {
      interval = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - sessionStart.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, sessionStart]);

  const handleClockIn = (projectId: number) => {
    setActiveSession(projectId);
    setSessionStart(new Date());
    setSessionTime(0);
  };

  const handleClockOut = async (projectId: number) => {
    if (!user?.id || !sessionStart) return;
    if (sessionTime > 0) {
      setSubmitting(true);
      const now = new Date();
      const start = sessionStart;
      const end = now;
      const totalHours = Math.round((sessionTime / 3600) * 100) / 100;
      const project = projects.find(p => p.id === projectId);
      try {
        console.log('=== TIMESHEET CREATION DEBUG ===');
        console.log('Project found:', project);
        console.log('Project hourly rate:', project?.hourlyRate);
        console.log('Freelancer profile:', freelancerProfile);
        console.log('Freelancer hourly rate:', freelancerProfile?.hourlyRate);
        console.log('User ID:', user.id);
        console.log('Session time:', sessionTime);
        console.log('Total hours:', totalHours);
        
        await createTimesheet({
          ProjectId: projectId,
          FreelancerId: user.id,
          DateOfWork: start.toISOString().split('T')[0],
          StartTime: start.toTimeString().split(' ')[0],
          EndTime: end.toTimeString().split(' ')[0],
          WorkDescription: workDescription,
          HourlyRate: freelancerProfile?.hourlyRate || 0,
        });
        // Refresh timesheets
        const data = await getTimesheets();
        setTimesheets(data.filter((t: any) => t.FreelancerId === user.id));
        setError(''); // Clear any previous errors
      } catch (e) {
        console.error('Error submitting timesheet:', e);
        handleApiError(e, 'createTimesheet');
        setError('Failed to submit timesheet.');
      } finally {
        setSubmitting(false);
      }
    }
    setActiveSession(null);
    setSessionStart(null);
    setSessionTime(0);
    setWorkDescription('');
    localStorage.removeItem('activeSession');
    localStorage.removeItem('sessionStart');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHours = (hours: number) => {
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredProjects = projects.filter(
    p => (projectFilter === 'All' || p.title === projectFilter) && (p.status === 'active' || p.status === 'Active' || p.status === 'ACTIVE')
  );

  console.log('=== FILTERING DEBUG ===');
  console.log('All projects:', projects);
  console.log('Project filter:', projectFilter);
  console.log('Projects with active status:', projects.filter(p => p.status === 'active'));
  console.log('Final filtered projects:', filteredProjects);

  // For debugging, show all timesheets if none match the date filter
  const allTimesheets = timesheets.filter(t => {
    const matchesProject = projectFilter === 'All' || t.projectName === projectFilter;
    return matchesProject;
  });
  
  const filteredTimesheets = timesheets.filter(t => {
    const matchesDate = t.dateOfWork?.split('T')[0] === dateFilter;
    const matchesProject = projectFilter === 'All' || t.projectName === projectFilter;
    
    console.log(`Timesheet filtering: ${t.id} - date: ${t.dateOfWork}, project: ${t.projectName}`);
    console.log(`  matchesDate: ${matchesDate} (${t.dateOfWork?.split('T')[0]} === ${dateFilter})`);
    console.log(`  matchesProject: ${matchesProject} (${projectFilter} === 'All' || ${t.projectName} === ${projectFilter})`);
    
    return matchesDate && matchesProject;
  });
  
  // Use all timesheets for debugging if filtered is empty
  const displayTimesheets = filteredTimesheets.length > 0 ? filteredTimesheets : allTimesheets;
  
  console.log('=== FILTERING RESULTS ===');
  console.log('Total timesheets:', timesheets.length);
  console.log('Filtered timesheets:', filteredTimesheets.length);
  console.log('Display timesheets:', displayTimesheets.length);
  console.log('Date filter:', dateFilter);
  console.log('Project filter:', projectFilter);

     // Manual refresh function
   const refreshTimesheets = async () => {
     if (!user?.id || projects.length === 0) return;
     
     setRefreshing(true);
     try {
       const data = await getTimesheets();
       
       // Transform timesheet data to camelCase and add project names
       const transformedTimesheets = data.map((t: any) => {
         const project = projects.find(p => p.id === t.ProjectId);
         return {
           id: t.Id || t.id,
           projectId: t.ProjectId || t.projectId,
           projectName: project?.title || `Project ${t.ProjectId || t.projectId}`,
           dateOfWork: t.DateOfWork || t.dateOfWork || '',
           startTime: t.StartTime || t.startTime || '',
           endTime: t.EndTime || t.endTime || '',
           totalHours: t.TotalHours || t.totalHours || 0,
           workDescription: t.WorkDescription || t.workDescription || '',
           hourlyRate: t.HourlyRate || t.hourlyRate || 0,
           calculatedAmount: t.CalculatedAmount || t.calculatedAmount || 0,
           approvalStatus: t.ApprovalStatus || t.approvalStatus || 'Pending',
           reviewerComments: t.ReviewerComments || t.reviewerComments || '',
           freelancerId: t.FreelancerId || t.freelancerId,
         };
       });
       
       const freelancerTimesheets = transformedTimesheets.filter((t: any) => t.freelancerId === user.id);
       setTimesheets(freelancerTimesheets);
       setError('');
     } catch (error) {
       console.error('Error refreshing timesheets:', error);
       setError('Failed to refresh timesheets');
     } finally {
       setRefreshing(false);
     }
   };

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg max-w-sm ${
                notification.type === 'success' 
                  ? 'bg-green-500 text-white' 
                  : notification.type === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium">{notification.message}</p>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="ml-2 text-white hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
              </div>
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>{timesheets.length} entries</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Timer className="w-4 h-4" />
                                     <span>{(totalHoursThisWeek || 0).toFixed(1)}h this week</span>
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshTimesheets}
                disabled={refreshing}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => setShowManualForm(v => !v)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Timesheet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week's Hours</p>
                                 <p className="text-2xl font-bold text-gray-900">{(totalHoursThisWeek || 0).toFixed(1)}h</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week's Earnings</p>
                                 <p className="text-2xl font-bold text-gray-900">${(totalEarningsThisWeek || 0).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{pendingTimesheets}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Timesheets</p>
                <p className="text-2xl font-bold text-gray-900">{approvedTimesheets}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Manual Timesheet Form */}
        {showManualForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Manual Timesheet</h2>
              <button
                onClick={() => setShowManualForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form
              className="space-y-6"
              onSubmit={async e => {
                e.preventDefault();
                if (!user?.id) return;
                setManualSubmitting(true);
                try {
                  const project = projects.find(p => p.id === Number(manualForm.projectId));
                  console.log('=== MANUAL TIMESHEET CREATION DEBUG ===');
                  console.log('Selected project:', project);
                  console.log('Project hourly rate:', project?.hourlyRate);
                  console.log('Freelancer profile:', freelancerProfile);
                  console.log('Freelancer hourly rate:', freelancerProfile?.hourlyRate);
                  console.log('Manual form data:', manualForm);
                  
                  await createTimesheet({
                    ProjectId: Number(manualForm.projectId),
                    FreelancerId: user.id,
                    DateOfWork: manualForm.date,
                    StartTime: manualForm.startTime,
                    EndTime: manualForm.endTime,
                    WorkDescription: manualForm.workDescription,
                    HourlyRate: freelancerProfile?.hourlyRate || 0,
                  });
                  const data = await getTimesheets();
                  setTimesheets(data.filter((t: any) => t.freelancerId === user.id));
                  setShowManualForm(false);
                  setManualForm({
                    projectId: '',
                    date: new Date().toISOString().split('T')[0],
                    startTime: '',
                    endTime: '',
                    workDescription: '',
                  });
                } catch (e) {
                  setError('Failed to submit manual timesheet.');
                } finally {
                  setManualSubmitting(false);
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                  <select
                    required
                    value={manualForm.projectId}
                    onChange={e => setManualForm(f => ({ ...f, projectId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Project</option>
                                         {projects.filter(p => p.status === 'active' || p.status === 'Active' || p.status === 'ACTIVE').map(p => (
                       <option key={p.id} value={p.id}>{p.title}</option>
                     ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    required
                    value={manualForm.startTime}
                    onChange={e => setManualForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    required
                    value={manualForm.endTime}
                    onChange={e => setManualForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Description</label>
                <textarea
                  required
                  value={manualForm.workDescription}
                  onChange={e => setManualForm(f => ({ ...f, workDescription: e.target.value }))}
                  placeholder="Describe what you worked on..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={manualSubmitting}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{manualSubmitting ? 'Submitting...' : 'Submit Timesheet'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={manualSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Project:</label>
                <select
                  value={projectFilter}
                  onChange={e => setProjectFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">All Projects</option>
                                     {projects.filter(p => p.status === 'active' || p.status === 'Active' || p.status === 'ACTIVE').map(p => (
                     <option key={p.id} value={p.title}>{p.title}</option>
                   ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Date:</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Active Projects</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Target className="w-4 h-4" />
              <span>{filteredProjects.length} active</span>
            </div>
          </div>
          
          {projectsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading projects...</p>
            </div>
                         ) : filteredProjects.length === 0 ? (
             <div className="text-center py-12">
               <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
               <p className="text-gray-600 mb-2">
                 {projects.length === 0 
                   ? "No projects assigned to you yet." 
                   : "No active projects found. Please check your project filters."}
               </p>
               {/* Debug section */}
               {projects.length > 0 && (
                 <div className="mt-4 text-left">
                   <p className="font-semibold mb-2">Debug: All Projects ({projects.length})</p>
                   {projects.map(project => (
                     <div key={project.id} className="text-sm mb-1 p-2 bg-gray-100 rounded">
                       <strong>{project.title}</strong> - Status: {project.status} - ID: {project.id}
                     </div>
                   ))}
                 </div>
               )}
             </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map(project => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>${freelancerProfile?.hourlyRate || 0}/hour</span>
                        </span>
                        {project.deadline && (
                          <span className="flex items-center space-x-1">
                            <CalendarDays className="w-4 h-4" />
                            <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {activeSession === project.id && (
                      <div className="text-right">
                        <div className="text-2xl font-mono font-bold text-blue-600 mb-1">
                          {formatTime(sessionTime)}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-blue-600">
                          <Zap className="w-3 h-3" />
                          <span>Recording</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {activeSession === project.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          What are you working on?
                        </label>
                        <textarea
                          value={workDescription}
                          onChange={e => setWorkDescription(e.target.value)}
                          placeholder="Describe your current work..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                        />
                      </div>
                      <button
                        onClick={() => handleClockOut(project.id)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        disabled={submitting}
                      >
                        <Square className="w-4 h-4" />
                        <span>{submitting ? 'Stopping...' : 'Stop Timer'}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleClockIn(project.id)}
                      disabled={!!activeSession}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Timer</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timesheet List */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Timesheets</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{displayTimesheets.length} entries</span>
            </div>
          </div>
          
          {displayTimesheets.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No timesheets found</h3>
              <p className="text-gray-600">
                {filteredTimesheets.length === 0 && allTimesheets.length > 0 
                  ? 'Try adjusting your filters to see timesheets' 
                  : 'Start tracking your time to see timesheets here'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayTimesheets.map((timesheet) => (
                <div 
                  key={timesheet.id} 
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    timesheet.approvalStatus === 'Approved' 
                      ? 'border-green-200 bg-green-50' 
                      : timesheet.approvalStatus === 'Rejected'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{timesheet.projectName}</h3>
                        <div className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(timesheet.approvalStatus)}`}>
                          {timesheet.approvalStatus}
                        </div>
                        {getStatusIcon(timesheet.approvalStatus)}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium text-gray-700">Date:</span>
                          <p className="text-gray-600">{new Date(timesheet.dateOfWork).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Time:</span>
                          <p className="text-gray-600">{timesheet.startTime} - {timesheet.endTime}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Hours:</span>
                          <p className="text-gray-600">{formatHours(timesheet.totalHours)}</p>
                        </div>
                                                 <div>
                           <span className="font-medium text-gray-700">Amount:</span>
                           <p className="text-gray-600">${(timesheet.calculatedAmount || 0).toFixed(2)}</p>
                         </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Work Description:</span>
                        <p className="text-gray-600 mt-1">{timesheet.workDescription}</p>
                      </div>
                      
                      {/* Show reviewer comments if rejected */}
                      {timesheet.approvalStatus === 'Rejected' && timesheet.reviewerComments && (
                        <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                              <p className="text-sm text-red-700 mt-1">{timesheet.reviewerComments}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show approval message if approved */}
                      {timesheet.approvalStatus === 'Approved' && (
                        <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-sm font-medium text-green-800">Timesheet approved!</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FreelancerTimesheets; 