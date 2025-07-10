import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
import { useAuth } from '@/contexts/AuthContext';
import { getFreelancerProjects } from '@/apiendpoints';
import { Project } from '@/types';
import { format } from 'date-fns';

export function FreelancerProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      if (user?.id) {
        try {
          const data = await getFreelancerProjects(user.id);
          // Map backend data to frontend Project type
          const mappedProjects: Project[] = data.map((proj: any) => {
            // Calculate progress: percent of milestones with status 'Submitted' or 'Approved' (if such status exists)
            let progress = 0;
            if (proj.milestones && proj.milestones.length > 0) {
              const completed = proj.milestones.filter((m: any) => m.status === 'Submitted' || m.status === 'Approved').length;
              progress = Math.round((completed / proj.milestones.length) * 100);
            }
            return {
              id: proj.Id || proj.id,
              title: proj.Title || proj.title,
              description: proj.Description || proj.description,
              status: (proj.Status || proj.status || '').toLowerCase(),
              budget: proj.Budget || proj.budget,
              deadline: proj.Deadline ? new Date(proj.Deadline).toISOString() : '',
              clientId: proj.ClientId || proj.clientId,
              client: proj.Client && proj.Client.User ? {
                id: proj.Client.User.Id,
                firstName: proj.Client.User.FirstName,
                lastName: proj.Client.User.LastName,
                email: proj.Client.User.Email,
                phone: proj.Client.User.PhoneNo,
                avatar: proj.Client.User.ProfilePicture,
                role: proj.Client.User.Role,
                gender: proj.Client.User.Gender,
                location: '',
                joinedDate: proj.Client.User.CreatedAt,
                password: '',
              } : undefined,
              skills: proj.SkillsRequired ? (typeof proj.SkillsRequired === 'string' ? JSON.parse(proj.SkillsRequired) : proj.SkillsRequired) : [],
              team: proj.AssignedFreelancers ? proj.AssignedFreelancers.map((f: any) => f.Freelancer && f.Freelancer.User ? {
                id: f.Freelancer.User.Id,
                firstName: f.Freelancer.User.FirstName,
                lastName: f.Freelancer.User.LastName,
                email: f.Freelancer.User.Email,
                phone: f.Freelancer.User.PhoneNo,
                avatar: f.Freelancer.User.ProfilePicture,
                role: f.Freelancer.User.Role,
                gender: f.Freelancer.User.Gender,
                location: '',
                joinedDate: f.Freelancer.User.CreatedAt,
                password: '',
              } : undefined) : [],
              progress,
              createdAt: proj.CreatedAt || '',
              milestones: proj.milestones || [],
            };
          });
          setProjects(mappedProjects);
        } catch (err) {
          // handle error
        }
      }
    };
    fetchProjects();
  }, [user?.id]);

  const filteredProjects = projects.filter((project) => {
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

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card className="flex flex-col justify-between h-full p-4">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{project.title}</h3>
            <p className="text-gray-600 text-xs line-clamp-1 mb-1">{project.description}</p>
          </div>
          <Badge variant={getStatusColor(project.status) as any}>{project.status}</Badge>
        </div>
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={project.client?.avatar} alt={project.client?.firstName} />
            <AvatarFallback>{project.client?.firstName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-medium text-gray-900">{project.client?.firstName} {project.client?.lastName}</p>
            <p className="text-xs text-gray-500">Client</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Due {project.deadline ? format(new Date(project.deadline), 'dd MMM yyyy') : ''}
          </div>
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            ${project.budget?.toLocaleString()}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <div className="text-blue-600 font-medium">{project.progress}% Complete</div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {project.team?.length || 0} team members
          </div>
        </div>
        {project.milestones && project.milestones.length > 0 && (
          <div className="text-xs text-gray-700 mb-2">
            <strong>Milestones:</strong>
            <ul className="list-disc list-inside ml-2">
              {project.milestones.map(m => (
                <li key={m.name}>{m.name}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="bg-gray-200 rounded-full h-2 mb-3">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {project.status === 'active' && (
          <>
            <Button size="sm" variant="outline">
              <Play className="w-4 h-4 mr-1" /> Clock In
            </Button>
            <Button size="sm" variant="outline">
              <Pause className="w-4 h-4 mr-1" /> Break
            </Button>
          </>
        )}
        <Button size="sm" onClick={() => navigate(`/workspace/${project.id}`)}>
          <Eye className="w-4 h-4 mr-1" /> Open Workspace
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
            {projects.filter((p) => p.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Projects</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {projects.filter((p) => p.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            ${projects.reduce((sum, p) => sum + ((p.budget || 0) / (p.team?.length || 1)), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Earnings</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length) : 0}%
          </div>
          <div className="text-sm text-gray-600">Avg Progress</div>
        </Card>
      </div>
    </div>
  );
}