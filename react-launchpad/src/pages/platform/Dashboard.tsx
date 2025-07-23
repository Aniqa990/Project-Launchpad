import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FileText, Clock, Users, ArrowUpRight, ArrowDownRight, Calendar, User, CheckCircle, FolderOpen } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { getProjects, getAllocatedResources, getUnallocatedResources, getMilestonesByHandoverStatus, getProjectsWithPendingApproval } from '@/apiendpoints';
import type { Project } from '@/types';

ChartJS.register(ArcElement, Tooltip, Legend);



export function PlatformDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocated, setAllocated] = useState(0);
  const [unallocated, setUnallocated] = useState(0);
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [projectsData, allocatedData, unallocatedData, pendingProjectsData, pendingPaymentsData] = await Promise.all([
          getProjects(),
          getAllocatedResources(),
          getUnallocatedResources(),
          getProjectsWithPendingApproval(),
          getMilestonesByHandoverStatus('pending')
        ]);
        setProjects(projectsData);
        setAllocated(allocatedData.allocated ?? allocatedData);
        setUnallocated(unallocatedData.unallocated ?? unallocatedData);
        setPendingProjects(pendingProjectsData);
        setPendingPayments(pendingPaymentsData);
      } catch (e) {
        setProjects([]);
        setAllocated(0);
        setUnallocated(0);
        setPendingProjects([]);
        setPendingPayments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeProjects = projects.filter(p => p.status === 'active').slice(0, 3);
  const completedProjects = projects.filter(p => p.status === 'completed').slice(0, 3);

  const resourceData = [
    { label: 'Allocated Jobs', value: allocated, color: '#8B5CF6' },
    { label: 'Unallocated Jobs', value: unallocated, color: '#F87171' },
  ];

  const pieData = {
    labels: resourceData.map(d => d.label),
    datasets: [
      {
        data: resourceData.map(d => d.value),
        backgroundColor: resourceData.map(d => d.color),
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: { display: false },
    },
    cutout: '70%',
    responsive: true,
    maintainAspectRatio: false,
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'payments':
        navigate?.('/admin/payments');
        break;
       case 'projects':
         navigate?.('/admin/projects');
         break;
    }
  };

  // Stat cards like freelancer dashboard
  const statCards = [
    {
      label: 'Total Revenue',
      value: '$125,000',
      icon: DollarSign,
      color: 'bg-green-500',
      backgroundColor: 'bg-green-50',
    },
    {
      label: 'Pending Project Reviews',
      value: pendingProjects.length.toString(),
      icon: FileText,
      color: 'bg-blue-500',
      backgroundColor: 'bg-blue-50',
    },
    {
      label: 'Pending Payment Reviews',
      value: pendingPayments.length.toString(),
      icon: Clock,
      color: 'bg-orange-500',
      backgroundColor: 'bg-orange-50',
    },
  ];

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-1">Monitor your platform's performance and activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`${stat.backgroundColor} rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-medium">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ongoing and Completed Projects */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ongoing */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-blue-700">Ongoing Projects</h4>
                <button
                  className="text-blue-600 hover:underline text-xs font-medium"
                  onClick={() => navigate?.('/admin/view-projects')}
                >
                  View All
                </button>
              </div>
              <ul className="space-y-2">
                {activeProjects.length > 0 ? (
                  activeProjects.map((project) => (
                    <li key={project.id} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base mb-0.5">{project.title}</h3>
                          <p className="text-gray-600 text-xs line-clamp-2">{project.description}</p>
                        </div>
                        <div className="ml-3 text-right">
                          <div className="text-xs font-semibold text-gray-900">${project.budget?.toLocaleString()}</div>
                          <div className="text-[10px] text-gray-500">Budget</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Due {project.deadline ? new Date(project.deadline).toLocaleDateString() : ''}
                          </div>
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {project.client?.firstName} {project.client?.lastName}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No active projects</p>
                  </div>
                )}
              </ul>
            </div>
            {/* Completed */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-green-700">Completed Projects</h4>
                <button
                  className="text-green-600 hover:underline text-xs font-medium"
                  onClick={() => navigate?.('/admin/view-projects')}
                >
                  View All
                </button>
              </div>
              <ul className="space-y-2">
                {completedProjects.length > 0 ? (
                  completedProjects.map((project) => (
                    <li key={project.id} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base mb-0.5">{project.title}</h3>
                          <p className="text-gray-600 text-xs line-clamp-2">{project.description}</p>
                        </div>
                        <div className="ml-3 text-right">
                          <div className="text-xs font-semibold text-gray-900">${project.budget?.toLocaleString()}</div>
                          <div className="text-[10px] text-gray-500">Budget</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Due {project.deadline ? new Date(project.deadline).toLocaleDateString() : ''}
                          </div>
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {project.client?.firstName} {project.client?.lastName}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No completed projects</p>
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Resource Allocation Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Allocation</h3>
          <div className="w-40 h-40 mb-4">
            <Pie data={pieData} options={pieOptions} />
          </div>
          <div className="space-y-2">
            {resourceData.map(d => (
              <div key={d.label} className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: d.color }} />
                <span className="text-sm">{d.label}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleQuickAction('payments')}
            className="w-full block flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
          >
            <DollarSign className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-blue-700">Process Payments</span>
          </button>
          <button
            onClick={() => handleQuickAction('projects')}
            className="w-full block flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
          >
            <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-blue-700">Review Projects</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}