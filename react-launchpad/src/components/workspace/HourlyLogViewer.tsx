import React, { useState, useEffect } from 'react';
import { Download, Filter, Search, Clock, Calendar, User } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { getHourlyLogs } from '../../apiendpoint';

interface HourlyLog {
  logId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  taskId: string;
  taskName: string;
  startTime: string;
  endTime: string;
  date: string;
  projectName: string;
}

const HourlyLogViewer: React.FC = () => {
  const [selectedFreelancer, setSelectedFreelancer] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [hourlyLogs, setHourlyLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const data = await getHourlyLogs();
        setHourlyLogs(data);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch logs');
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  // Map API data to UI fields
  const mappedLogs = hourlyLogs.map((log) => ({
    logId: log.Id,
    freelancerId: log.FreelancerId,
    freelancerName: log.Freelancer?.Name || `Freelancer #${log.FreelancerId}`,
    freelancerAvatar: log.Freelancer?.Avatar || 'https://ui-avatars.com/api/?name=F',
    taskId: log.TaskId,
    taskName: log.Task?.Title || `Task #${log.TaskId}`,
    startTime: log.StartTime ? new Date(log.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    endTime: log.EndTime && log.EndTime !== '0001-01-01T00:00:00' ? new Date(log.EndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    date: log.StartTime ? new Date(log.StartTime).toISOString().split('T')[0] : '',
    projectName: log.Task?.ProjectName || 'N/A',
  }));

  const projects = Array.from(new Set(mappedLogs.map(log => log.projectName)));

  const filteredLogs = mappedLogs.filter(log => {
    const matchesFreelancer = selectedFreelancer === 'all' || log.freelancerName === selectedFreelancer;
    const matchesProject = selectedProject === 'all' || log.projectName === selectedProject;
    const matchesSearch = log.taskName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         String(log.logId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDateRange = (!dateRange.start || log.date >= dateRange.start) && 
                            (!dateRange.end || log.date <= dateRange.end);
    return matchesFreelancer && matchesProject && matchesSearch && matchesDateRange;
  });

  const totalHours = filteredLogs.length; // Each log represents 1 hour
  const uniqueFreelancers = [...new Set(mappedLogs.map(log => log.freelancerName))];

  const clearFilters = () => {
    setSelectedFreelancer('all');
    setSelectedProject('all');
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading hourly logs...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hourly Logs</h1>
          <p className="text-gray-600 mt-1">View automatically logged hourly work entries</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-indigo-600">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours Logged</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalHours}h</p>
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
                <p className="text-sm font-medium text-gray-600">Active Freelancers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{uniqueFreelancers.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Hours</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {filteredLogs.filter(log => log.date === new Date().toISOString().split('T')[0]).length}h
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Tasks</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {new Set(filteredLogs.map(log => log.taskId)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-semibold">Filters</span>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Project Filter */}
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>

            {/* Freelancer Filter */}
            <select value={selectedFreelancer} onChange={(e) => setSelectedFreelancer(e.target.value)}>
              <option value="all">All Freelancers</option>
              {uniqueFreelancers.map(freelancer => (
                <option key={freelancer} value={freelancer}>{freelancer}</option>
              ))}
            </select>

            {/* Date Range */}
            <input
              type="date"
              placeholder="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />

            <input
              type="date"
              placeholder="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      {/* Hourly Logs Table */}
      <Card>
        <div className="p-4">
          <div className="mb-4">
            <span className="font-semibold">Hourly Work Logs ({filteredLogs.length})</span>
            <span className="ml-2 text-gray-500 text-sm">Automatically logged work entries per hour</span>
          </div>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Log ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Freelancer ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.logId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{log.logId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          src={log.freelancerAvatar} 
                          alt={log.freelancerName}
                          className="w-8 h-8 rounded-full object-cover mr-3"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{log.freelancerId}</span>
                          <div className="text-xs text-gray-500">{log.freelancerName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{log.taskId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{log.taskName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{new Date(log.date).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{log.startTime}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{log.endTime}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-xs">
                        {log.projectName}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredLogs.map((log) => (
              <Card key={log.logId}>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-600">{log.logId}</span>
                    <Badge variant="outline" className="text-xs">
                      {log.projectName}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3">
                    <img 
                      src={log.freelancerAvatar} 
                      alt={log.freelancerName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.freelancerId}</p>
                      <p className="text-xs text-gray-500">{log.freelancerName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.taskName}</p>
                    <p className="text-xs text-gray-500">Task ID: {log.taskId}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{new Date(log.date).toLocaleDateString()}</span>
                    <span className="text-gray-600">{log.startTime} - {log.endTime}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hourly logs found</h3>
              <p className="text-gray-600">Logs will appear here as freelancers work on tasks.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default HourlyLogViewer; 