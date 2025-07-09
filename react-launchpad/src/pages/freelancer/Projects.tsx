import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Clock,
  Eye,
  Play,
  Pause
} from 'lucide-react';
import { mockProjects, mockFreelancers } from '../../utils/mockData';

export function FreelancerProjects() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  // Filter projects where current freelancer is a team member
  const currentFreelancer = mockFreelancers[0]; // Alex Chen
  const myProjects = mockProjects.filter(project => 
    project.team.some(member => member.id === currentFreelancer.id)
  );

  const filteredProjects = myProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const ProjectCard = ({ project }: { project: any }) => (
    <Card hover>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{project.description}</p>
        </div>
        <Badge variant={getStatusColor(project.status) as any}>
          {project.status}
        </Badge>
      </div>

      <div className="flex items-center space-x-3 mb-4">
        <Avatar src={project.client.avatar} alt={project.client.name} size="sm" />
        <div>
          <p className="text-sm font-medium text-gray-900">{project.client.name}</p>
          <p className="text-xs text-gray-500">Client</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Due {new Date(project.deadline).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            ${project.budget.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="text-blue-600 font-medium">{project.progress}% Complete</div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {project.team.length} team members
          </div>
        </div>

        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {project.status === 'active' && (
            <>
              <Button size="sm" variant="outline" icon={Play}>
                Clock In
              </Button>
              <Button size="sm" variant="outline" icon={Pause}>
                Break
              </Button>
            </>
          )}
        </div>
        
        <Button 
          size="sm" 
          icon={Eye}
          onClick={() => navigate(`/workspace/${project.id}`)}
        >
          Open Workspace
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Projects</h1>
          <p className="text-gray-600">Track your active projects and deliverables</p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </Card>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'You haven\'t been assigned to any projects yet'
            }
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {myProjects.filter(p => p.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Projects</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {myProjects.filter(p => p.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            ${myProjects.reduce((sum, p) => sum + (p.budget / p.team.length), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Earnings</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {myProjects.length > 0 ? Math.round(myProjects.reduce((sum, p) => sum + p.progress, 0) / myProjects.length) : 0}%
          </div>
          <div className="text-sm text-gray-600">Avg Progress</div>
        </Card>
      </div>
    </div>
  );
}