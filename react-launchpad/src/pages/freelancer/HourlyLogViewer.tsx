import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFreelancerHourlyLogs, getFreelancerProjects, getLogsByProjectId } from '../../apiendpoints';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Clock, Calendar, User, Filter, Download, Search } from 'lucide-react';

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
  const { user } = useAuth();
  const [logs, setLogs] = useState<HourlyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [projects, setProjects] = useState<{ id: number; projectTitle: string; description: string }[]>([]);

  // Fetch projects for the freelancer
  useEffect(() => {
    async function fetchProjects() {
      if (!user?.id) return;
      try {
        const data = await getFreelancerProjects(user.id);
        setProjects(data);
      } catch (e) {
        setProjects([]);
      }
    }
    fetchProjects();
  }, [user?.id]);

  // Fetch logs based on selected project or all
  useEffect(() => {
    async function fetchLogs() {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        let data;
        if (selectedProject !== 'all') {
          data = await getLogsByProjectId(Number(selectedProject));
        } else {
          data = await getFreelancerHourlyLogs(user.id);
        }
        // Transform API data to match UI expectations
        const transformed: HourlyLog[] = data.map((log: any) => ({
          logId: log.Id?.toString() ?? '',
          freelancerId: log.FreelancerId?.toString() ?? '',
          freelancerName: '', // Not available in API response
          freelancerAvatar: '', // Not available in API response
          taskId: log.TaskId?.toString() ?? '',
          taskName: log.TaskName || '',
          startTime: log.StartTime ? log.StartTime.split('T')[1]?.slice(0, 5) : '',
          endTime: log.EndTime ? log.EndTime.split('T')[1]?.slice(0, 5) : '',
          date: log.StartTime ? log.StartTime.split('T')[0] : '',
          projectName: log.ProjectName || '',
        }));
        setLogs(transformed);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch logs');
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [user?.id, selectedProject]);

  // Derive filter options and filtered logs
  const uniqueFreelancers = Array.from(new Set(logs.map(log => log.freelancerName).filter(Boolean)));

  const filteredLogs = logs.filter(log => {
    const matchesFreelancer = selectedFreelancer === 'all' || log.freelancerName === selectedFreelancer;
    const matchesSearch = log.taskName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.logId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDateRange = (!dateRange.start || log.date >= dateRange.start) && 
                            (!dateRange.end || log.date <= dateRange.end);
    return matchesFreelancer && matchesSearch && matchesDateRange;
  });

  const totalHours = filteredLogs.length; // Each log represents 1 hour

  const clearFilters = () => {
    setSelectedFreelancer('all');
    setSelectedProject('all');
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
  };

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
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <div className="text-lg font-semibold">Filters</div>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Project Filter */}
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.projectTitle && p.projectTitle !== 'na'
                        ? p.projectTitle
                        : (p.description && p.description !== 'na'
                            ? p.description
                            : (p.projectTitle === 'na' && p.description === 'na' ? 'na' : `Project #${p.id}`))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Freelancer Filter */}
              <Select value={selectedFreelancer} onValueChange={setSelectedFreelancer}>
                <SelectTrigger>
                  <SelectValue placeholder="All Freelancers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Freelancers</SelectItem>
                  {uniqueFreelancers.map(freelancer => (
                    <SelectItem key={freelancer} value={freelancer}>{freelancer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Input
                type="date"
                placeholder="Start Date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />

              <Input
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
          <div className="border-b px-6 py-4">
            <div className="text-lg font-semibold">Hourly Work Logs ({filteredLogs.length})</div>
            <div className="text-sm text-gray-500">Automatically logged work entries per hour</div>
          </div>
          <div className="px-6 py-4">
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
                          {log.freelancerAvatar ? (
                            <img 
                              src={log.freelancerAvatar} 
                              alt={log.freelancerName}
                              className="w-8 h-8 rounded-full object-cover mr-3"
                            />
                          ) : null}
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
                        <span className="text-sm text-gray-900">{log.date ? new Date(log.date).toLocaleDateString() : ''}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{log.startTime}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{log.endTime}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" size="sm">
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
                <Card key={log.logId} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600">{log.logId}</span>
                      <Badge variant="outline" size="sm">
                        {log.projectName}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {log.freelancerAvatar ? (
                        <img 
                          src={log.freelancerAvatar} 
                          alt={log.freelancerName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : null}
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
                      <span className="text-gray-600">{log.date ? new Date(log.date).toLocaleDateString() : ''}</span>
                      <span className="text-gray-600">{log.startTime} - {log.endTime}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredLogs.length === 0 && !loading && !error && (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hourly logs found</h3>
                <p className="text-gray-600">Logs will appear here as freelancers work on tasks.</p>
              </div>
            )}
            {loading && <div className="text-center py-12">Loading logs...</div>}
            {error && <div className="text-center py-12 text-red-500">{error}</div>}
          </div>
        </Card>
      </div>
  );
};

export { HourlyLogViewer };