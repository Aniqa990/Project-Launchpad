import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getLogsByFreelancerId, getClientProjects, getFreelancerProjects } from '../../apiendpoints';
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

interface Project {
  id: number;
  projectTitle: string;
  description: string;
}

interface Freelancer {
  Id: number;
  FirstName: string;
  LastName: string;
  Email: string;
}

export const ClientHourlyLogViewer: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<HourlyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedFreelancer, setSelectedFreelancer] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFreelancers, setProjectFreelancers] = useState<Freelancer[]>([]);
  const [loadingFreelancers, setLoadingFreelancers] = useState(false);

  // Fetch client's projects
  useEffect(() => {
    async function fetchProjects() {
      if (!user?.id) return;
      try {
        const data = await getClientProjects(user.id);
        setProjects(data);
      } catch (e) {
        setProjects([]);
        setError('Failed to fetch projects');
      }
    }
    fetchProjects();
  }, [user?.id]);

  // Fetch freelancers for selected project
  useEffect(() => {
    async function fetchProjectFreelancers() {
      if (!selectedProject || selectedProject === 'all') {
        setProjectFreelancers([]);
        return;
      }
      
      setLoadingFreelancers(true);
      try {
        const data = await getFreelancerProjects(Number(selectedProject));
        setProjectFreelancers(data);
      } catch (e) {
        setProjectFreelancers([]);
        setError('Failed to fetch project freelancers');
      } finally {
        setLoadingFreelancers(false);
      }
    }
    fetchProjectFreelancers();
  }, [selectedProject]);

  // Fetch logs based on selected freelancer
  useEffect(() => {
    async function fetchLogs() {
      if (!selectedFreelancer || selectedFreelancer === 'all') {
        setLogs([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        const data = await getLogsByFreelancerId(Number(selectedFreelancer));
        
        // Transform API data to match UI expectations
        const transformed: HourlyLog[] = data.map((log: any) => ({
          logId: log.Id?.toString() ?? '',
          freelancerId: log.FreelancerId?.toString() ?? '',
          freelancerName: log.FreelancerName || '',
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
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [selectedFreelancer]);

  // Filter logs based on search and date range
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.taskName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.logId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDateRange = (!dateRange.start || log.date >= dateRange.start) && 
                            (!dateRange.end || log.date <= dateRange.end);
    return matchesSearch && matchesDateRange;
  });

  const totalHours = filteredLogs.length; // Each log represents 1 hour

  const clearFilters = () => {
    setSelectedProject('all');
    setSelectedFreelancer('all');
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hourly Logs</h1>
          <p className="text-gray-600 mt-1">View hourly work logs from your project freelancers</p>
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{projectFreelancers.length}</p>
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
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.projectTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Freelancer Filter */}
            <Select 
              value={selectedFreelancer} 
              onValueChange={setSelectedFreelancer}
              disabled={selectedProject === 'all' || loadingFreelancers}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingFreelancers ? "Loading..." : "Select Freelancer"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Freelancers</SelectItem>
                {projectFreelancers.map((freelancer) => (
                  <SelectItem key={freelancer.Id} value={freelancer.Id.toString()}>
                    {freelancer.FirstName} {freelancer.LastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Start */}
            <Input
              type="date"
              placeholder="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />

            {/* Date Range End */}
            <Input
              type="date"
              placeholder="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">Loading logs...</div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500">{error}</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">
                {selectedFreelancer === 'all' 
                  ? 'Select a freelancer to view their hourly logs' 
                  : 'No logs found for the selected filters'}
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Freelancer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.logId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {log.freelancerName || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.taskName}</div>
                      <div className="text-sm text-gray-500">ID: {log.taskId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.projectName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(log.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.startTime} - {log.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="info">1h</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};
