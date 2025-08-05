import { useState, useEffect } from 'react';
import { getClientProjects, getProjectRequestsByProjectId, getFreelancerById, updateProjectRequestStatus } from '@/apiendpoints';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Clock, X } from 'lucide-react';

export function ClientProjectRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replacingRequestId, setReplacingRequestId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchAllRequests() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const projects = await getClientProjects(user.id);
        let allRequests: any[] = [];
        for (const project of projects) {
          const projectRequests = await getProjectRequestsByProjectId(project.id);
          console.log(projectRequests);
          if (Array.isArray(projectRequests) && projectRequests.length > 0) {
            for (const req of projectRequests) {
              if (req.status === 'pending' || req.status === 'rejected') {
                                  try {
                    const freelancer = await getFreelancerById(Number(req.freelancerId));
                    console.log(freelancer);
                    allRequests.push({
                      ...req,
                      projectTitle: project.projectTitle,
                      projectDescription: project.description,
                      freelancerName: `${freelancer.firstName} ${freelancer.lastName}`,
                      freelancerEmail: freelancer.email,
                    });
                  } catch (error) {
                    console.error('Error fetching freelancer details for ID:', req.freelancerId, error);
                  }
              }
            }
          }
        }
        setRequests(allRequests);
        console.log(allRequests);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load project requests');
      } finally {
        setLoading(false);
      }
    }
    fetchAllRequests();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'rejected':
      case 'cancelled': return 'danger';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const pendingRequests = requests.filter((req) => req.status === 'pending');
  const rejectedRequests = requests.filter((req) => req.status === 'rejected');

  const handleReplaceFreelancerRequest = async (projectId: number, freelancerId: number) => {
    setReplacingRequestId(projectId);
    try {
      await updateProjectRequestStatus(projectId, 'replaced', freelancerId);
      navigate(`/client/freelancer-suggestions?projectId=${projectId}`);
    } catch (err: any) {
      toast.error('Failed to update request status.');
    } finally {
      setReplacingRequestId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Requests</h1>
        <p className="text-gray-600">Review and respond to project invitations</p>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{rejectedRequests.length}</p>
            </div>
          </div>
        </Card>
      </div>
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Pending Requests ({pendingRequests.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {pendingRequests.map((request) => (
               <Card key={request.projectId + '-' + request.freelancerId} className="transition-shadow hover:shadow-md cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div>
                        <p className="font-bold text-blue-700 text-lg">{request.freelancerName}</p>
                        <p className="text-sm text-gray-500">{request.freelancerEmail}</p>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Hired for: <span className="text-blue-600">{request.projectTitle}</span></h3>
                  </div>
                  <Badge variant={getStatusColor(request.status) as any}>
                    {request.status}
                  </Badge>
                </div>
                <div className="text-gray-700 mb-2">{request.projectDescription}</div>
              </Card>
            ))}
          </div>
        </div>
      )}
      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Rejected Requests ({rejectedRequests.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {rejectedRequests.map((request) => (
               <Card key={request.projectId + '-' + request.freelancerId} className="transition-shadow hover:shadow-md cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div>
                        <p className="font-bold text-blue-700 text-lg">{request.freelancerName}</p>
                        <p className="text-sm text-gray-500">{request.freelancerEmail}</p>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Hired for: <span className="text-blue-600">{request.projectTitle}</span></h3>
                  </div>
                  <Badge variant={getStatusColor(request.status) as any}>
                    {request.status}
                  </Badge>
                </div>
                <div className="text-gray-700 mb-2">{request.projectDescription}</div>
                <div className="flex justify-end mt-4">
                  <Button
                    variant="primary"
                    disabled={replacingRequestId === request.projectId}
                    onClick={() => handleReplaceFreelancerRequest(request.projectId, request.freelancerId)}
                  >
                    {replacingRequestId === request.projectId ? 'Processing...' : 'Select Another Freelancer'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      {/* Empty State */}
      {pendingRequests.length === 0 && rejectedRequests.length === 0 && (
        <Card className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No project requests yet</h3>
          <p className="text-gray-600">
            Project requests will appear here when you send requests to freelancers.
          </p>
        </Card>
      )}
    </div>
  );
}