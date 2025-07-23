import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getFreelancerProjects } from '../../apiendpoints';
import { Calendar, User, ExternalLink, Filter, Search } from 'lucide-react';
import { Project } from '@/types';

export function FreelancerProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) return;
      try {
        const projectsData = await getFreelancerProjects(user.id);
        const transformedProjects: Project[] = projectsData.map((project: any) => ({
          id: project.Id,
          title: project.Title,
          description: project.Description,
          status: project.Status,
          budget: project.Budget,
          deadline: project.Deadline,
          clientId: project.ClientId,
          category: project.Category,
          paymentType: project.PaymentType,
          numberOfFreelancers: project.NumberOfFreelancers,
          attachedDocumentPath: project.AttachedDocumentPath,
          client: project.Client ? {
            firstName: project.Client.FirstName,
            lastName: project.Client.LastName,
            email: project.Client.Email,
            password: '',
            phone: project.Client.PhoneNo,
            avatar: '',
            role: project.Client.Role,
            gender: project.Client.Gender,
            location: '',
            joinedDate: '',
          } : undefined,
          skills: project.Skills || [],
          team: project.Team || [],
          progress: project.Progress ?? 0,
          milestones: project.Milestones || [],
        }));
        setProjects(transformedProjects);
      } catch (error) {
        setProjects([]);
      }
    };
    fetchProjects();
  }, [user?.id]);

  const filteredProjects = projects.filter((project: Project) => {
    const matchesTab = activeTab === 'all' || project.status === activeTab;
    const clientName = project.client ? `${project.client.firstName ?? ''} ${project.client.lastName ?? ''}` : '';
    const matchesSearch = (project.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (clientName.toLowerCase()).includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs = [
    { id: 'all', label: 'All Projects', count: projects.length },
    { id: 'draft', label: 'Draft', count: projects.filter((p: Project) => p.status === 'draft').length },
    { id: 'active', label: 'Active', count: projects.filter((p: Project) => p.status === 'active').length },
    { id: 'completed', label: 'Completed', count: projects.filter((p: Project) => p.status === 'completed').length },
    { id: 'cancelled', label: 'Cancelled', count: projects.filter((p: Project) => p.status === 'cancelled').length }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage all your projects in one place</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>
      {/* Tabs */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project: Project) => {
          const clientName = project.client ? `${project.client.firstName} ${project.client.lastName}` : '';
          return (
            <div key={project.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status || '')}`}>
                  {project.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.skills?.slice(0, 3).map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
                {project.skills?.length && project.skills.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    +{project.skills.length - 3} more
                  </span>
                )}
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{clientName}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Due: {new Date(project.deadline || '').toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Link
                  to={`/freelancer/kanban`} //see later if we need to add the project id to view certaon project tasks
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <span>View Tasks</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}