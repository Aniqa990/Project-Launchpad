import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { getProjectById } from '../../apiendpoints';

interface FreelancerSuggestionsProps {
  projectId: string;
}

interface Project {
  Id?: number;
  ProjectTitle?: string;
  Title?: string;
  Description?: string;
  PaymentType?: string;
  CategoryOrDomain?: string;
  Category?: string;
  Deadline?: string;
  Duration?: string;
  RequiredSkills?: string;
  Skills?: string[];
  Budget?: number;
  NumberOfFreelancers?: number;
  Status?: string;
  [key: string]: any;
}

const FreelancerSuggestions: React.FC<FreelancerSuggestionsProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProjectById(projectId);
        setProject(data);
      } catch (err: any) {
        setProject(null);
        setError(err?.message || 'Failed to fetch project.');
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600">{error}</div>;
  }

  if (!project) {
    return <div className="text-center text-gray-600">No project found for suggestions.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 font-semibold">{project.Title || project.ProjectTitle}</div>
          <div className="text-gray-600 mb-2">{project.Description}</div>
          <div className="text-sm text-gray-500 mb-2">Category: {project.Category || project.CategoryOrDomain}</div>
          <div className="text-sm text-gray-500 mb-2">Skills: {project.Skills ? project.Skills.join(', ') : project.RequiredSkills}</div>
        </CardContent>
      </Card>
      {/* TODO: Replace below with real freelancer suggestion logic based on project data */}
      <Card>
        <CardHeader>
          <CardTitle>Suggested Freelancers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500">(Freelancer suggestions based on project skills and category will appear here.)</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FreelancerSuggestions; 