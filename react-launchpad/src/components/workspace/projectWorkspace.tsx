import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { KanbanBoard } from './KanbanBoard';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Clock,
  MessageCircle,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  CheckCircle,
  Download,
  Upload
} from 'lucide-react';
import { mockProjects, mockTasks, mockTimeEntries, mockMessages } from '../../utils/mockData';
import { useAuth } from '../../contexts/AuthContext';

export function ProjectWorkspace() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const project = mockProjects.find(p => p.id === projectId);
  const projectTasks = mockTasks.filter(t => t.projectId === projectId);
  const projectTimeEntries = mockTimeEntries.filter(t => t.projectId === projectId);
  const projectMessages = mockMessages.filter(m => m.projectId === projectId);

  if (!project) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle },
    { id: 'timesheets', label: 'Timesheets', icon: Clock },
    { id: 'milestones', label: 'Milestones', icon: Calendar },
    { id: 'deliverables', label: 'Deliverables', icon: FileText },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    ...(user?.role === 'client' ? [{ id: 'payments', label: 'Payments', icon: CreditCard }] : [])
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{project.progress}%</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Budget</p>
                    <p className="text-2xl font-bold text-gray-900">${project.budget.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Deadline</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(project.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Description</h3>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.skills.map(skill => (
                  <Badge key={skill} variant="info">{skill}</Badge>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {projectMessages.slice(0, 3).map(message => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <Avatar src={message.sender.avatar} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{message.sender.name}</span> {message.content}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              {user?.role === 'client' && (
                <Button size="sm">Invite Member</Button>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Client */}
              <Card>
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar src={project.client.avatar} alt={project.client.name} size="lg" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{project.client.name}</h4>
                    <p className="text-sm text-gray-600">Project Owner</p>
                    <Badge variant="info" size="sm">Client</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </Card>

              {/* Team Members */}
              {project.team.map(member => (
                <Card key={member.id}>
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar src={member.avatar} alt={member.name} size="lg" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{member.name}</h4>
                      <p className="text-sm text-gray-600">${member.hourlyRate}/hour</p>
                      <Badge variant="success" size="sm">Freelancer</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {member.skills?.slice(0, 3).map(skill => (
                        <Badge key={skill} variant="default" size="sm">{skill}</Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'tasks':
        return <KanbanBoard />;

      case 'timesheets':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Time Tracking</h3>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option>All Team Members</option>
                  {project.team.map(member => (
                    <option key={member.id}>{member.name}</option>
                  ))}
                </select>
                <input 
                  type="date" 
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {projectTimeEntries.reduce((sum, entry) => sum + entry.hours, 0)}h
                  </div>
                  <div className="text-sm text-gray-600">Total Hours</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${projectTimeEntries.reduce((sum, entry) => sum + (entry.hours * 85), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Cost</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {projectTimeEntries.filter(e => e.status === 'submitted').length}
                  </div>
                  <div className="text-sm text-gray-600">Pending Approval</div>
                </div>
              </Card>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Team Member</th>
                      <th className="text-left py-3 px-4">Task</th>
                      <th className="text-left py-3 px-4">Hours</th>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectTimeEntries.map(entry => {
                      const task = projectTasks.find(t => t.id === entry.taskId);
                      const member = project.team.find(m => m.id === entry.userId);
                      return (
                        <tr key={entry.id} className="border-b">
                          <td className="py-3 px-4">{entry.date}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Avatar src={member?.avatar} size="sm" />
                              <span>{member?.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{task?.title}</td>
                          <td className="py-3 px-4">{entry.hours}h</td>
                          <td className="py-3 px-4 max-w-xs truncate">{entry.description}</td>
                          <td className="py-3 px-4">
                            <Badge variant={entry.status === 'approved' ? 'success' : 'warning'}>
                              {entry.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );

      case 'milestones':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Project Milestones</h3>
              {user?.role === 'client' && (
                <Button size="sm">Add Milestone</Button>
              )}
            </div>

            <div className="space-y-4">
              {project.milestones.map((milestone, index) => (
                <Card key={milestone.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          milestone.status === 'paid' ? 'bg-green-100 text-green-600' :
                          milestone.status === 'approved' ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">{milestone.title}</h4>
                        <Badge variant={
                          milestone.status === 'paid' ? 'success' :
                          milestone.status === 'approved' ? 'warning' : 'default'
                        }>
                          {milestone.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3 ml-11">{milestone.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 ml-11">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Due {new Date(milestone.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ${milestone.amount.toLocaleString()}
                        </div>
                      </div>

                      <div className="mt-3 ml-11">
                        <p className="text-sm font-medium text-gray-700 mb-1">Deliverables:</p>
                        <div className="flex flex-wrap gap-2">
                          {milestone.deliverables.map((deliverable, idx) => (
                            <Badge key={idx} variant="info" size="sm">{deliverable}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="ml-6">
                      {milestone.status === 'approved' && user?.role === 'client' && (
                        <Button size="sm">Release Payment</Button>
                      )}
                      {milestone.status === 'paid' && (
                        <Button size="sm" variant="outline" icon={Download}>
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'deliverables':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Project Deliverables</h3>
              {user?.role === 'freelancer' && (
                <Button size="sm" icon={Upload}>Upload File</Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.milestones.map(milestone => 
                milestone.deliverables.map((deliverable, index) => (
                  <Card key={`${milestone.id}-${index}`} hover>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{deliverable}</h4>
                        <p className="text-sm text-gray-500">{milestone.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant={milestone.status === 'paid' ? 'success' : 'warning'}>
                        {milestone.status === 'paid' ? 'Available' : 'Locked'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={milestone.status !== 'paid'}
                        icon={Download}
                      >
                        Download
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="space-y-6">
            <Card className="h-96 flex flex-col">
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {projectMessages.map(message => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <Avatar src={message.sender.avatar} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{message.sender.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button>Send</Button>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Overview</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${project.milestones.filter(m => m.status === 'paid').reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Paid</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    ${project.milestones.filter(m => m.status === 'approved').reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Ready to Pay</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    ${project.milestones.filter(m => m.status === 'pending').reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
              </Card>
            </div>

            <Card>
              <h4 className="font-semibold text-gray-900 mb-4">Payment History</h4>
              <div className="space-y-3">
                {project.milestones.map(milestone => (
                  <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{milestone.title}</p>
                      <p className="text-sm text-gray-600">{new Date(milestone.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${milestone.amount.toLocaleString()}</p>
                      <Badge variant={
                        milestone.status === 'paid' ? 'success' :
                        milestone.status === 'approved' ? 'warning' : 'default'
                      }>
                        {milestone.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );

      default:
        return <div>Tab content not implemented</div>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{project.team.length} team members</span>
              <span>•</span>
              <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                {project.status}
              </Badge>
            </div>
          </div>
          <Button variant="outline" icon={Settings}>
            Settings
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{project.progress}% Complete</span>
          <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}