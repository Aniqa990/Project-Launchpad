// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import { getFreelancerProjects, createTimesheet, getTimesheets } from '../../apiendpoints';
// import { Play, Square, Clock, Filter, Calendar } from 'lucide-react';

// interface Project {
//   id: number;
//   title: string;
//   status: string;
//   hourlyRate: number;
// }

// interface Timesheet {
//   Id: number;
//   ProjectName: string;
//   DateOfWork: string;
//   StartTime: string;
//   EndTime: string;
//   TotalHours: number;
//   WorkDescription: string;
//   HourlyRate: number;
//   CalculatedAmount: number;
//   ApprovalStatus: string;
//   ReviewerComments?: string;
// }

// const FreelancerTimesheets: React.FC = () => {
//   const { user } = useAuth();
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
//   const [activeSession, setActiveSession] = useState<number | null>(null);
//   const [sessionStart, setSessionStart] = useState<Date | null>(null);
//   const [sessionTime, setSessionTime] = useState(0);
//   const [workDescription, setWorkDescription] = useState('');
//   const [projectFilter, setProjectFilter] = useState('All');
//   const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     if (!user?.id) return;
//     const fetchProjects = async () => {
//       try {
//         if (typeof user?.id !== 'number') return;
//         const data = await getFreelancerProjects(user.id);
//         console.log(data);
//         setProjects(
//           data.map((p: any) => ({
//             id: p.id,
//             title: p.title,
//             status: p.status,
//             hourlyRate: p.hourlyRate || 0,
//           }))
//         );
//       } catch {
//         setProjects([]);
//       }
//     };
//     fetchProjects();
//   }, [user?.id]);

//   useEffect(() => {
//     if (!user?.id) return;
//     const fetchTimesheets = async () => {
//       setLoading(true);
//       try {
//         const data = await getTimesheets();
//         // Filter timesheets for this freelancer
//         setTimesheets(data.filter((t: any) => t.FreelancerId === user.id));
//       } catch {
//         setTimesheets([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchTimesheets();
//   }, [user?.id]);

//   useEffect(() => {
//     // Restore timer state from localStorage on mount
//     const savedSession = localStorage.getItem('activeSession');
//     const savedStart = localStorage.getItem('sessionStart');
//     if (savedSession && savedStart) {
//       setActiveSession(Number(savedSession));
//       setSessionStart(new Date(savedStart));
//     }
//   }, []);

//   useEffect(() => {
//     // Persist timer state to localStorage
//     if (activeSession && sessionStart) {
//       localStorage.setItem('activeSession', String(activeSession));
//       localStorage.setItem('sessionStart', sessionStart.toISOString());
//     } else {
//       localStorage.removeItem('activeSession');
//       localStorage.removeItem('sessionStart');
//     }
//   }, [activeSession, sessionStart]);

//   useEffect(() => {
//     let interval: NodeJS.Timeout;
//     if (activeSession && sessionStart) {
//       interval = setInterval(() => {
//         setSessionTime(Math.floor((Date.now() - sessionStart.getTime()) / 1000));
//       }, 1000);
//     }
//     return () => clearInterval(interval);
//   }, [activeSession, sessionStart]);

//   const handleClockIn = (projectId: number) => {
//     setActiveSession(projectId);
//     setSessionStart(new Date());
//     setSessionTime(0);
//   };

//   const handleClockOut = async (projectId: number) => {
//     if (!user?.id || !sessionStart) return;
//     if (sessionTime > 0) {
//       setSubmitting(true);
//       const now = new Date();
//       const start = sessionStart;
//       const end = now;
//       const totalHours = Math.round((sessionTime / 3600) * 100) / 100;
//       const project = projects.find(p => p.id === projectId);
//       try {
//         await createTimesheet({
//           ProjectId: projectId,
//           FreelancerId: user.id,
//           DateOfWork: start.toISOString().split('T')[0],
//           StartTime: start.toTimeString().split(' ')[0],
//           EndTime: end.toTimeString().split(' ')[0],
//           WorkDescription: workDescription,
//           HourlyRate: project?.hourlyRate || 0,
//         });
//         // Refresh timesheets
//         const data = await getTimesheets();
//         setTimesheets(data.filter((t: any) => t.FreelancerId === user.id));
//       } catch (e) {
//         setError('Failed to submit timesheet.');
//       } finally {
//         setSubmitting(false);
//       }
//     }
//     setActiveSession(null);
//     setSessionStart(null);
//     setSessionTime(0);
//     setWorkDescription('');
//     // Remove from localStorage
//     localStorage.removeItem('activeSession');
//     localStorage.removeItem('sessionStart');
//   };

//   const formatTime = (seconds: number) => {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;
//     return `${hours.toString().padStart(2, '0')}:${minutes
//       .toString()
//       .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   // Helper to format hours as hh:mm:ss
//   function formatHours(hours: number) {
//     const totalSeconds = Math.round(hours * 3600);
//     const h = Math.floor(totalSeconds / 3600);
//     const m = Math.floor((totalSeconds % 3600) / 60);
//     const s = totalSeconds % 60;
//     return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
//   }

//   const filteredProjects = projects.filter(
//     p => (projectFilter === 'All' || p.title === projectFilter) && p.status === 'active'
//   );

//   const filteredTimesheets = timesheets.filter(t => {
//     const matchesDate = t.DateOfWork.split('T')[0] === dateFilter;
//     const matchesProject =
//       projectFilter === 'All' || t.ProjectName === projectFilter;
//     return matchesDate && matchesProject;
//   });

//   return (
//     <div className="space-y-6 max-w-4xl mx-auto p-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
//         <div className="flex items-center space-x-2 text-sm text-gray-600">
//           <Clock className="w-4 h-4" />
//           <span>{timesheets.length} entries logged</span>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-xl p-4 shadow-sm">
//         <div className="flex items-center space-x-4">
//           <div className="flex items-center space-x-2">
//             <Filter className="w-5 h-5 text-gray-500" />
//             <span className="text-sm font-medium text-gray-700">Filters:</span>
//           </div>
//           <div className="flex items-center space-x-2">
//             <label className="text-sm text-gray-600">Project:</label>
//             <select
//               value={projectFilter}
//               onChange={e => setProjectFilter(e.target.value)}
//               className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="All">All Projects</option>
//               {projects.filter(p => p.status === 'active').map(p => (
//                 <option key={p.id} value={p.title}>
//                   {p.title}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="flex items-center space-x-2">
//             <label className="text-sm text-gray-600">Date:</label>
//             <input
//               type="date"
//               value={dateFilter}
//               onChange={e => setDateFilter(e.target.value)}
//               className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Active Projects - Clock In/Out */}
//       <div className="bg-white rounded-xl p-6 shadow-sm">
//         <h2 className="text-xl font-bold text-gray-900 mb-4">Active Projects</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {filteredProjects.map(project => (
//             <div key={project.id} className="rounded-lg p-4 bg-gray-50">
//               <div className="flex items-center justify-between mb-3">
//                 <div>
//                   <h3 className="font-semibold text-gray-900">{project.title}</h3>
//                   <p className="text-sm text-gray-600">${project.hourlyRate}/hour</p>
//                 </div>
//                 {activeSession === project.id && (
//                   <div className="text-right">
//                     <p className="text-lg font-mono font-bold text-blue-600">
//                       {formatTime(sessionTime)}
//                     </p>
//                     <p className="text-xs text-gray-500">Active</p>
//                   </div>
//                 )}
//               </div>
//               {activeSession === project.id ? (
//                 <div className="space-y-3">
//                   <textarea
//                     value={workDescription}
//                     onChange={e => setWorkDescription(e.target.value)}
//                     placeholder="Describe what you worked on today..."
//                     className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
//                     rows={3}
//                   />
//                   <button
//                     onClick={() => handleClockOut(project.id)}
//                     className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
//                     disabled={submitting}
//                   >
//                     <Square className="w-4 h-4" />
//                     <span>Clock Out</span>
//                   </button>
//                 </div>
//               ) : (
//                 <button
//                   onClick={() => handleClockIn(project.id)}
//                   disabled={!!activeSession}
//                   className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <Play className="w-4 h-4" />
//                   <span>Clock In</span>
//                 </button>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Today's Timesheets */}
//       <div className="bg-white rounded-xl p-6 shadow-sm">
//         <h2 className="text-xl font-bold text-gray-900 mb-4">
//           Timesheets for {new Date(dateFilter).toLocaleDateString()}
//         </h2>
//         {loading ? (
//           <p className="text-gray-600 text-center py-8">Loading timesheets...</p>
//         ) : filteredTimesheets.length === 0 ? (
//           <p className="text-gray-600 text-center py-8">No timesheets for selected date and project</p>
//         ) : (
//           <div className="space-y-3">
//             {filteredTimesheets.map(timesheet => (
//               <div
//                 key={timesheet.Id}
//                 className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
//               >
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-gray-900">{timesheet.ProjectName}</h3>
//                   <p className="text-sm text-gray-600 mt-1">{timesheet.WorkDescription}</p>
//                   <p className="text-xs text-gray-500 mt-1">
//                     {formatHours(timesheet.TotalHours)} • {timesheet.StartTime} - {timesheet.EndTime}
//                   </p>
//                 </div>
//                 <div className="flex flex-col items-end space-y-1 min-w-[120px]">
//                   <span
//                     className={`px-2 py-1 text-xs rounded-full text-center ${
//                       timesheet.ApprovalStatus === 'Approved'
//                         ? 'bg-green-100 text-green-800'
//                         : timesheet.ApprovalStatus === 'Pending'
//                         ? 'bg-yellow-100 text-yellow-800'
//                         : 'bg-red-100 text-red-800'
//                     }`}
//                   >
//                     {timesheet.ApprovalStatus}
//                   </span>
//                   <span className="font-semibold text-gray-900">
//                     ${timesheet.CalculatedAmount}
//                   </span>
//                   {timesheet.ApprovalStatus === 'Rejected' && timesheet.ReviewerComments && (
//                     <span className="text-xs text-red-600 mt-1">{timesheet.ReviewerComments}</span>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//       {error && <div className="text-red-600 text-center">{error}</div>}
//     </div>
//   );
// };

// export default FreelancerTimesheets; 

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFreelancerProjects, createTimesheet, getTimesheets } from '../../apiendpoints';
import { Play, Square, Clock, Filter, Calendar } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  status: string;
  hourlyRate: number;
}

interface Timesheet {
  Id: number;
  ProjectName: string;
  DateOfWork: string;
  StartTime: string;
  EndTime: string;
  TotalHours: number;
  WorkDescription: string;
  HourlyRate: number;
  CalculatedAmount: number;
  ApprovalStatus: string;
  ReviewerComments?: string;
}

const FreelancerTimesheets: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [workDescription, setWorkDescription] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!user?.id) return;
    const fetchProjects = async () => {
      try {
        if (typeof user?.id !== 'number') return;
        const data = await getFreelancerProjects(user.id);
        setProjects(
          data.map((p: any) => ({
            id: p.Id,
            title: p.Title,
            status: p.Status,
            hourlyRate: p.HourlyRate || 0,
          }))
        );
      } catch {
        setProjects([]);
      }
    };
    fetchProjects();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchTimesheets = async () => {
      setLoading(true);
      try {
        const data = await getTimesheets();
        // Filter timesheets for this freelancer
        setTimesheets(data.filter((t: any) => t.FreelancerId === user.id));
      } catch {
        setTimesheets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTimesheets();
  }, [user?.id]);

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
        await createTimesheet({
          ProjectId: projectId,
          FreelancerId: user.id,
          DateOfWork: start.toISOString().split('T')[0],
          StartTime: start.toTimeString().split(' ')[0],
          EndTime: end.toTimeString().split(' ')[0],
          WorkDescription: workDescription,
          HourlyRate: project?.hourlyRate || 0,
        });
        // Refresh timesheets
        const data = await getTimesheets();
        setTimesheets(data.filter((t: any) => t.FreelancerId === user.id));
      } catch (e) {
        setError('Failed to submit timesheet.');
      } finally {
        setSubmitting(false);
      }
    }
    setActiveSession(null);
    setSessionStart(null);
    setSessionTime(0);
    setWorkDescription('');
    // Remove from localStorage
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

  // Helper to format hours as hh:mm:ss
  function formatHours(hours: number) {
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  const filteredProjects = projects.filter(
    p => (projectFilter === 'All' || p.title === projectFilter) && p.status === 'active'
  );

  const filteredTimesheets = timesheets.filter(t => {
    const matchesDate = t.DateOfWork.split('T')[0] === dateFilter;
    const matchesProject =
      projectFilter === 'All' || t.ProjectName === projectFilter;
    return matchesDate && matchesProject;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{timesheets.length} entries logged</span>
        </div>
      </div>

      {/* Manual Timesheet Entry */}
      <div className="mb-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => setShowManualForm(v => !v)}
        >
          {showManualForm ? 'Cancel Manual Entry' : 'Add Manual Timesheet'}
        </button>
      </div>
      {showManualForm && (
        <form
          className="bg-white rounded-xl p-6 shadow-sm mb-6 space-y-4"
          onSubmit={async e => {
            e.preventDefault();
            if (!user?.id) return;
            setManualSubmitting(true);
            try {
              const project = projects.find(p => p.id === Number(manualForm.projectId));
              await createTimesheet({
                ProjectId: Number(manualForm.projectId),
                FreelancerId: user.id,
                DateOfWork: manualForm.date,
                StartTime: manualForm.startTime,
                EndTime: manualForm.endTime,
                WorkDescription: manualForm.workDescription,
                HourlyRate: project?.hourlyRate || 0,
              });
              // Refresh timesheets
              const data = await getTimesheets();
              setTimesheets(data.filter((t: any) => t.FreelancerId === user.id));
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
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
            <select
              required
              value={manualForm.projectId}
              onChange={e => setManualForm(f => ({ ...f, projectId: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
            >
              <option value="">Select Project</option>
              {projects.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <input
              type="date"
              required
              value={manualForm.date}
              onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
            />
            <input
              type="time"
              required
              value={manualForm.startTime}
              onChange={e => setManualForm(f => ({ ...f, startTime: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
              placeholder="Start Time"
            />
            <input
              type="time"
              required
              value={manualForm.endTime}
              onChange={e => setManualForm(f => ({ ...f, endTime: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
              placeholder="End Time"
            />
          </div>
          <textarea
            required
            value={manualForm.workDescription}
            onChange={e => setManualForm(f => ({ ...f, workDescription: e.target.value }))}
            placeholder="Describe what you worked on..."
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 mt-2"
            rows={3}
          />
          <div className="flex space-x-2 mt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={manualSubmitting}
            >
              {manualSubmitting ? 'Submitting...' : 'Submit Timesheet'}
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
              onClick={() => setShowManualForm(false)}
              disabled={manualSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Project:</label>
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Projects</option>
              {projects.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.title}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Active Projects - Clock In/Out */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Active Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map(project => (
            <div key={project.id} className="rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{project.title}</h3>
                  <p className="text-sm text-gray-600">${project.hourlyRate}/hour</p>
                </div>
                {activeSession === project.id && (
                  <div className="text-right">
                    <p className="text-lg font-mono font-bold text-blue-600">
                      {formatTime(sessionTime)}
                    </p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                )}
              </div>
              {activeSession === project.id ? (
                <div className="space-y-3">
                  <textarea
                    value={workDescription}
                    onChange={e => setWorkDescription(e.target.value)}
                    placeholder="Describe what you worked on today..."
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <button
                    onClick={() => handleClockOut(project.id)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    disabled={submitting}
                  >
                    <Square className="w-4 h-4" />
                    <span>Clock Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleClockIn(project.id)}
                  disabled={!!activeSession}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  <span>Clock In</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Today's Timesheets */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Timesheets for {new Date(dateFilter).toLocaleDateString()}
        </h2>
        {loading ? (
          <p className="text-gray-600 text-center py-8">Loading timesheets...</p>
        ) : filteredTimesheets.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No timesheets for selected date and project</p>
        ) : (
          <div className="space-y-3">
            {filteredTimesheets.map(timesheet => (
              <div
                key={timesheet.Id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{timesheet.ProjectName}</h3>
                  <p className="text-sm text-gray-600 mt-1">{timesheet.WorkDescription}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatHours(timesheet.TotalHours)} • {timesheet.StartTime} - {timesheet.EndTime}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-1 min-w-[120px]">
                  <span
                    className={`px-2 py-1 text-xs rounded-full text-center ${
                      timesheet.ApprovalStatus === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : timesheet.ApprovalStatus === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {timesheet.ApprovalStatus}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ${timesheet.CalculatedAmount}
                  </span>
                  {timesheet.ApprovalStatus === 'Rejected' && timesheet.ReviewerComments && (
                    <span className="text-xs text-red-600 mt-1">{timesheet.ReviewerComments}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <div className="text-red-600 text-center">{error}</div>}
    </div>
  );
};

export default FreelancerTimesheets; 