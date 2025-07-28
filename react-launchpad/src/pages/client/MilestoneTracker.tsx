import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProjects, getMilestonesByProjectId } from '../../apiendpoints';

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  freelancerName: string;
  freelancerAvatar: string;
  projectName: string;
  deliverables: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
  }[];
  submittedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  progress: number;
  freelancerComments?: string;
  clientFeedback?: string;
  invoiceId?: string;
}

const MilestoneTracker: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [showApprovalDialog, setShowApprovalDialog] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all client projects
        const projectsData = await getProjects();
        setProjects(projectsData);
        // 2. Fetch milestones for each project
        const allMilestones: Milestone[] = [];
        for (const project of projectsData) {
          const projectMilestones = await getMilestonesByProjectId(project.Id || project.id);
          allMilestones.push(
            ...projectMilestones.map((m: any) => ({
              ...m,
              id: m.Id?.toString() || m.id?.toString() || '',
              title: m.Title || m.title,
              description: m.Description || m.description,
              amount: m.Amount || m.amount,
              dueDate: m.DueDate || m.dueDate,
              status: m.Status || m.status,
              freelancerName: m.FreelancerName || m.freelancerName || '',
              freelancerAvatar: m.FreelancerAvatar || m.freelancerAvatar || '',
              projectName: project.Title || project.title,
              deliverables: m.Deliverables || m.deliverables || [],
              submittedAt: m.SubmittedAt || m.submittedAt,
              approvedAt: m.ApprovedAt || m.approvedAt,
              paidAt: m.PaidAt || m.paidAt,
              progress: m.Progress || m.progress || 0,
              freelancerComments: m.FreelancerComments || m.freelancerComments,
              clientFeedback: m.ClientFeedback || m.clientFeedback,
              invoiceId: m.InvoiceId || m.invoiceId,
            }))
          );
        }
        setMilestones(allMilestones);
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const projectNames = projects.map(p => p.Title || p.title);

  const filteredMilestones = milestones.filter(milestone => {
    const matchesProject = selectedProject === 'all' || milestone.projectName === selectedProject;
    const matchesStatus = selectedStatus === 'all' || milestone.status.toLowerCase().replace(' ', '-') === selectedStatus;
    return matchesProject && matchesStatus;
  });

  // ... rest of the original UI logic (stats, filters, milestone cards, etc.) ...
  // Insert the rest of your provided code here, replacing the mock milestones and projects with the above state.

  if (loading) {
    return <div className="text-center py-12">Loading milestones...</div>;
  }

  // ... (rest of your UI code remains unchanged, using filteredMilestones and projectNames)

  // Paste the rest of your original return JSX here, using filteredMilestones and projectNames

};

export default MilestoneTracker; 