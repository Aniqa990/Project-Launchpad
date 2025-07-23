import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { getProjectById, getMilestonesByProjectId } from '../../apiendpoints';

// Helper to format duration string like '7.20:58:14.2388752' to '7 days, 20 hours, 58 minutes'
function formatDuration(duration: string) {
  if (!duration) return '';
  // Format: '7.20:58:14.2388752' => 7 days, 20 hours, 58 minutes
  const match = duration.match(/(\d+)\.(\d+):(\d+):/);
  if (match) {
    const days = parseInt(match[1], 10);
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    let result = [];
    if (days) result.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours) result.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes) result.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    return result.join(', ');
  }
  return duration;
}

// Helper to map milestone status code to label and badge color
function getMilestoneStatusInfo(status: any) {
  if (status === 0 || status === '0') return { label: 'Pending', badge: 'bg-yellow-100 text-yellow-800 border border-yellow-300' };
  if (status === 1 || status === '1') return { label: 'UnderReview', badge: 'bg-blue-100 text-blue-800 border border-blue-300' };
  if (status === 2 || status === '2') return { label: 'Submitted', badge: 'bg-green-100 text-green-800 border border-green-300' };
  return { label: status, badge: 'bg-gray-100 text-gray-800 border border-gray-300' };
}

export function ProjectWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Milestones state
  const [milestones, setMilestones] = useState<any[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(true);
  const [milestonesError, setMilestonesError] = useState('');

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      setError('');
      try {
        const data = await getProjectById(projectId!);
        setProject(data);
      } catch (e) {
        setProject(null);
        setError('Project not found or failed to load.');
      } finally {
        setLoading(false);
      }
    }
    if (projectId) fetchProject();
  }, [projectId]);

  useEffect(() => {
    async function fetchMilestones() {
      setMilestonesLoading(true);
      setMilestonesError('');
      try {
        const data = await getMilestonesByProjectId(projectId!);
        setMilestones(data);
      } catch (e) {
        setMilestones([]);
        setMilestonesError('Failed to load milestones.');
      } finally {
        setMilestonesLoading(false);
      }
    }
    if (projectId) fetchMilestones();
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
        </Card>
      </div>
    );
  }

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

  // Helper to format skills
  const renderSkills = () => {
    if (Array.isArray(project.RequiredSkills)) {
      return project.RequiredSkills.map((skill: string) => (
                  <Badge key={skill} variant="info">{skill}</Badge>
      ));
    } else if (typeof project.RequiredSkills === 'string') {
      return project.RequiredSkills.split(',').map((skill: string) => (
        <Badge key={skill.trim()} variant="info">{skill.trim()}</Badge>
      ));
    }
    return null;
  };

  // Helper to format milestones
  const renderMilestones = () => {
    if (milestonesLoading) {
      return <span className="text-gray-500 ml-2">Loading milestones...</span>;
    }
    if (milestonesError) {
      return <span className="text-red-500 ml-2">{milestonesError}</span>;
    }
    if (Array.isArray(milestones) && milestones.length > 0) {
        return (
        <div className="grid gap-4 mt-2">
          {milestones.map((m: any, idx: number) => {
            const statusInfo = getMilestoneStatusInfo(m.Status);
        return (
              <div
                key={idx}
                className={`relative p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4 bg-white`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-lg text-gray-900">{m.Title || m.title}</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${statusInfo.badge}`}>{statusInfo.label}</span>
                  </div>
                  {m.Description && <div className="mb-1 text-gray-700 text-sm">{m.Description}</div>}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-2">
                    {m.DueDate && <span><span className="font-semibold">Due:</span> {new Date(m.DueDate).toLocaleDateString()}</span>}
                    {m.Amount && <span><span className="font-semibold">Amount:</span> ${m.Amount}</span>}
                  </div>
                </div>
          </div>
        );
          })}
          </div>
        );
    }
    return <span className="text-gray-500 ml-2">No milestones</span>;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-6 p-6">
        <h1 className="text-2xl font-bold mb-4">{project.ProjectTitle || project.Title}</h1>
        <div className="space-y-3 mb-6">
          <div><span className="font-semibold">Status:</span> <Badge>{project.Status}</Badge></div>
          <div><span className="font-semibold">Budget:</span> ${project.Budget}</div>
          <div><span className="font-semibold">Deadline:</span> {project.Deadline ? new Date(project.Deadline).toLocaleDateString() : ''}</div>
          <div><span className="font-semibold">Category:</span> {project.CategoryOrDomain || project.Category}</div>
          <div><span className="font-semibold">Payment Type:</span> {project.PaymentType}</div>
          <div><span className="font-semibold"># Freelancers:</span> {project.NumberOfFreelancers}</div>
          <div><span className="font-semibold">Duration:</span> {formatDuration(project.Duration)}</div>
          <div><span className="font-semibold">Attached Document:</span> {project.AttachedDocumentPath ? (
            <a href={project.AttachedDocumentPath} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">View Document</a>
          ) : <span className="text-gray-500 ml-2">None</span>}</div>
        </div>
        <div className="mb-6">
          <span className="font-semibold">Description:</span>
          <p className="text-gray-700 mt-1">{project.Description}</p>
        </div>
        <div className="mb-6">
          <span className="font-semibold">Skills:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {renderSkills()}
          </div>
        </div>
        {/* Only show milestones if PaymentType is 'milestone' */}
        {String(project.PaymentType).toLowerCase() === 'milestone' && (
          <div className="mb-2">
            <span className="font-semibold">Milestones:</span>
            {renderMilestones()}
      </div>
        )}
      </Card>
    </div>
  );
}