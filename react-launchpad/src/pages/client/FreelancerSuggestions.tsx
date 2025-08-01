
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Star, DollarSign, MessageSquare, Eye, Briefcase, Filter, Search, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { getProjectById, getFreelancerById, getFreelancerProjects, sendProjectRequest, getProjectRequestsByProjectId } from '@/apiendpoints';
import type { Project, FreelancerProfile } from '@/types';
import { handleApiError, showSuccessToast } from '@/utils/errorHandler';

export function FreelancerSuggestions() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const navigate = useNavigate();
  // Use FreelancerProfile & add extra fields as needed
  const [freelancers, setFreelancers] = useState<(FreelancerProfile & { summary: string; skills: string[]; activeProjects: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFreelancers, setSelectedFreelancers] = useState<string[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [expandedSkillsId, setExpandedSkillsId] = useState<string | null>(null);
  const [sendingRequests, setSendingRequests] = useState(false);
  const [projectRequests, setProjectRequests] = useState<any[]>([]);

  // Filter states
  const [filters, setFilters] = useState({
    minRate: '',
    maxRate: '',
    experience: 'all',
    minRating: 'all',
    search: ''
  });

  // Check if freelancer has any request (regardless of status)
  const hasAnyRequest = (freelancerId: number) => {
    return projectRequests.some(request => request.freelancerId === freelancerId);
  };

  useEffect(() => {
    const fetchFreelancers = async () => {
      setLoading(true);
      try {
        if (!projectId) return;
        
        // 1. Fetch project details
        const proj: Project = await getProjectById(projectId);
        console.log(proj);
        setProject(proj);
        const summary = proj.description;
        
        // 2. Fetch project requests to check status
        const requests = await getProjectRequestsByProjectId(Number(projectId));
        setProjectRequests(requests);
        
        // 3. Call suggest-freelancers endpoint
        const suggestRes = await fetch("http://localhost:8000/api/suggest-freelancers/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_summary: summary })
        });
        const suggestData = await suggestRes.json();
        const suggestions = suggestData.suggestions || [];
        
        // 4. For each suggestion, fetch freelancer profile and active projects
        const freelancerDetails = await Promise.all(
          suggestions.map(async (sugg: any) => {
            try {
              const profile: FreelancerProfile = await getFreelancerById(Number(sugg.freelancer_id));
              const projects = await getFreelancerProjects(Number(sugg.freelancer_id));
              const activeProjects = Array.isArray(projects)
                ? projects.filter((p: any) => p.status === 'active').length
                : 0;
              return {
                ...profile,
                summary: sugg.summary || '',
                skills: Array.isArray(sugg.skills)
                  ? sugg.skills
                  : (typeof sugg.skills === 'string'
                      ? JSON.parse(sugg.skills)
                      : []),
                activeProjects,
              };
            } catch {
              return null;
            }
          })
        );
        setFreelancers(freelancerDetails.filter(Boolean) as (FreelancerProfile & { summary: string; skills: string[]; activeProjects: number })[]);
      } finally {
        setLoading(false);
      }
    };
    fetchFreelancers();
  }, [projectId]);

  const handleSelectFreelancer = (freelancerId: string) => {
    setSelectedFreelancers(prev =>
      prev.includes(freelancerId)
        ? prev.filter(id => id !== freelancerId)
        : [...prev, freelancerId]
    );
  };

  const handleInviteSelected = () => {
    // Implement invitation logic if needed
      alert(`Invitations sent to ${selectedFreelancers.length} freelancer(s)!`);
      navigate('/client/dashboard');
  };

  const handleBackToProjects = () => {
    navigate('/client/dashboard');
  };

  const handleSendRequests = async () => {
    if (!projectId || selectedFreelancers.length === 0) return;
    setSendingRequests(true);
    try {
      await Promise.all(selectedFreelancers.map(fid => sendProjectRequest(Number(projectId), Number(fid))));
      showSuccessToast(`Requests sent to ${selectedFreelancers.length} freelancer(s)!`);
      setSelectedFreelancers([]);
      
      // Refresh project requests after sending
      const requests = await getProjectRequestsByProjectId(Number(projectId));
      setProjectRequests(requests);
    } catch (err) {
      handleApiError(err, 'sendProjectRequest');
    } finally {
      setSendingRequests(false);
    }
  };

  const filteredFreelancers = freelancers.filter(freelancer => {
    const matchesMinRate = !filters.minRate || freelancer.hourlyRate >= parseInt(filters.minRate);
    const matchesMaxRate = !filters.maxRate || freelancer.hourlyRate <= parseInt(filters.maxRate);
    const matchesRating = filters.minRating === 'all' || (freelancer.avgRating ?? 0) >= parseFloat(filters.minRating);
    const matchesSearch = !filters.search ||
      (`${freelancer.firstName} ${freelancer.lastName}`.toLowerCase().includes(filters.search.toLowerCase())) ||
      (freelancer.summary?.toLowerCase().includes(filters.search.toLowerCase())) ||
      (freelancer.skills && freelancer.skills.some((skill: string) => skill.toLowerCase().includes(filters.search.toLowerCase())));
    return matchesMinRate && matchesMaxRate && matchesRating && matchesSearch;
  });

  const clearFilters = () => {
    setFilters({
      minRate: '',
      maxRate: '',
      experience: 'all',
      minRating: 'all',
      search: ''
    });
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
      <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button 
                variant="ghost" 
                onClick={handleBackToProjects}
                className="p-2 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Find Freelancers</h1>
            </div>
          {project && (
              <div className="ml-12">
              <p className="text-lg font-medium text-gray-900">{project.projectTitle}</p>
                <p className="text-gray-600 mt-1">
                {project.categoryOrDomain} • {project.paymentType === 'fixed' ? `$${project.budget}` : `$${project.budget}/hr`}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                {(project.requiredSkills ? project.requiredSkills.split(',') : []).slice(0, 5).map((skill: string, index: number) => (
                  <Badge key={index} variant="outline" size="sm">
                      {skill}
                    </Badge>
                  ))}
                {project.requiredSkills && project.requiredSkills.split(',').length > 5 && (
                  <Badge variant="outline" size="sm">
                    +{project.requiredSkills.split(',').length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
          {selectedFreelancers.length > 0 && (
            <Button
              onClick={handleInviteSelected}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Invite Selected ({selectedFreelancers.length})
            </Button>
          )}
        </div>

        {/* Filters */}
      <Card className="mb-8">
        <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-semibold">Filter Options</span>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
        <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search freelancers..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
              <Input
                type="number"
                placeholder="Min hourly rate"
                value={filters.minRate}
                onChange={(e) => setFilters({ ...filters, minRate: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Max hourly rate"
                value={filters.maxRate}
                onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
              />
              <Select value={filters.minRating} onValueChange={(value) => setFilters({ ...filters, minRating: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Min Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  <SelectItem value="4.8">4.8+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
        </Card>

        {/* Results */}
        <div className="text-sm text-gray-600 mb-4">
        Showing {filteredFreelancers.length} freelancer(s) {project && `for "${project.projectTitle}"`}
        </div>

        {/* Freelancer Cards */}
        <div className="grid gap-6">
        {filteredFreelancers.map((freelancer) => {
          const isExpanded = expandedSkillsId === freelancer.id?.toString();
          const skillsToShow = Array.isArray(freelancer.skills) ? (isExpanded ? freelancer.skills : freelancer.skills.slice(0, 5)) : [];
          const hasExistingRequest = hasAnyRequest(freelancer.id);
          const requestStatus = projectRequests.find(req => req.freelancerId === freelancer.id)?.status;
          
          return (
            <Card
              key={freelancer.id}
              className={`transition-all duration-200 hover:shadow-md ${
                selectedFreelancers.includes(freelancer.id?.toString()) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <img
                      src={freelancer.profilePicture}
                      alt={`${freelancer.firstName} ${freelancer.lastName}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{freelancer.firstName} {freelancer.lastName}</h3>
                        {freelancer.availability && (
                          <span
                            className={
                              `ml-2 px-2 py-0.5 rounded-full text-xs font-medium ` +
                              (freelancer.availability.toLowerCase() === 'available'
                                ? 'bg-green-100 text-green-800'
                                : freelancer.availability.toLowerCase() === 'unavailable'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800')
                            }
                          >
                            {freelancer.availability}
                          </span>
                        )}
                        {requestStatus && (
                          <span
                            className={
                              `ml-2 px-2 py-0.5 rounded-full text-xs font-medium ` +
                              (requestStatus === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : requestStatus === 'replaced'
                                ? 'bg-orange-100 text-orange-800'
                                : requestStatus === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : requestStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800')
                            }
                          >
                            {requestStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 font-medium mb-1">{freelancer.summary}</p>
                      <div className="flex flex-wrap gap-2 mb-4 items-center">
                        {Array.isArray(skillsToShow) && skillsToShow.map((skill: string, index: number) => (
                          <Badge key={index} variant="outline" size="sm">
                            {skill}
                          </Badge>
                        ))}
                        {freelancer.skills && freelancer.skills.length > 5 && !isExpanded && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-1 py-0 h-auto text-xs"
                            onClick={() => setExpandedSkillsId(freelancer.id?.toString())}
                          >
                            +{freelancer.skills.length - 5} more
                          </Button>
                        )}
                        {freelancer.skills && freelancer.skills.length > 5 && isExpanded && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-1 py-0 h-auto text-xs"
                            onClick={() => setExpandedSkillsId(null)}
                          >
                            Show less
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          {freelancer.avgRating ?? 'N/A'}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${freelancer.hourlyRate}/hr
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {freelancer.activeProjects} active
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    size="sm"
                    variant={selectedFreelancers.includes(freelancer.id?.toString()) ? 'primary' : 'outline'}
                    className="mt-2"
                    onClick={() => handleSelectFreelancer(freelancer.id?.toString())}
                    disabled={hasAnyRequest(freelancer.id)}
                  >
                    {hasAnyRequest(freelancer.id)
                      ? (requestStatus ? requestStatus.charAt(0).toUpperCase() + requestStatus.slice(1) : 'Requested')
                      : selectedFreelancers.includes(freelancer.id?.toString()) 
                      ? 'Selected' 
                      : 'Select'
                    }
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        </div>
        {filteredFreelancers.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No freelancers found</h3>
            <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      {selectedFreelancers.length > 0 && (
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSendRequests}
            disabled={sendingRequests || selectedFreelancers.length === 0}
            variant="primary"
            size="md"
          >
            {sendingRequests ? 'Sending...' : 'Send Requests to Selected'}
          </Button>
        </div>
      )}
      
      {/* Navigation Buttons */}
      <div className="flex justify-center space-x-4 mt-8 pt-6 border-t">
        <Button variant="outline" onClick={() => navigate('/client/projects')}>
          View Projects
        </Button>
        <Button onClick={() => navigate('/client/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
      </div>
  );
};
