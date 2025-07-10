import { useState, useEffect } from 'react';
import {getProjectRequests, respondToProjectRequest} from '../../apiendpoints';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { 
  Calendar,
  DollarSign,
  Clock,
  MapPin,
  Star,
  Check,
  X,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ProjectRequest } from '@/types';

export function FreelancerRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        if (user?.id) {
          const data = await getProjectRequests(user.id);
          console.log(data);

          const parsedData: ProjectRequest[] = data.map((req: any) => ({
            projectId: req.ProjectId,
            freelancerId: req.FreelancerId,
            projectTitle: req.ProjectTitle,
            projectDescription: req.ProjectDescription,
            projectCategory: req.ProjectCategory,
            deadline: req.Deadline ? new Date(req.Deadline) : undefined,
            skills: typeof req.Skills === 'string' ? JSON.parse(req.Skills) : req.Skills || [],
            budget: req.Budget,
            clientId: req.ClientId,
            clientName: req.ClientName,
            clientEmail: req.ClientEmail,
            clientPhone: req.ClientPhoneNumber,
            clientProfile: req.ClientProfilePicture,
            status: req.Status,
            sentAt: req.RequestedAt ? new Date(req.RequestedAt) : undefined,
          }));
          setRequests(parsedData);
          console.log(parsedData);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load project requests');
      }
    };
    fetchRequests();
  }, [user?.id]);

  const handleAcceptRequest = async (projectId: number) => {
    try {
      await respondToProjectRequest(projectId, 'accepted', user?.id);
      setRequests((prev) => prev.map((req) =>
        req.projectId === projectId ? { ...req, status: 'accepted' } : req
      ));
      toast.success('Project request accepted!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setShowDetailDialog(false);
    }
  };

  const handleRejectRequest = async (projectId: number) => {
    try {
      await respondToProjectRequest(projectId, 'rejected', user?.id);
      setRequests((prev) => prev.map((req) =>
        req.projectId === projectId ? { ...req, status: 'rejected' } : req
      ));
      toast.success('Project request declined');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setShowDetailDialog(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'default';
    }
  };

  const RequestCard = ({ request }: { request: ProjectRequest }) => (
    <Card className="transition-shadow hover:shadow-md cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={request.clientProfile} alt={request.clientName} />
              <AvatarFallback>{request.clientName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{request.clientName}</p>
              <p className="text-sm text-gray-500">wants to hire you as</p>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{request.projectCategory}</h3>
          <h4 className="text-md font-medium text-blue-600 mb-2">{request.projectTitle}</h4>
        </div>
        <Badge variant={getStatusColor(request.status) as any}>
          {request.status}
        </Badge>
      </div>

      {/*<p className="text-gray-600 text-sm mb-4 line-clamp-3">{request.message}</p>*/}

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          {request.budget && (<div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            ${request.budget.toLocaleString()} budget
          </div>)}
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Due {request.deadline ? format(request.deadline, 'dd MMM yyyy') : ''}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {request.skills.slice(0, 3).map((skill: string) => (
          <Badge key={skill} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{skill}</Badge>
        ))}
        {request.skills.length > 3 && (
          <Badge className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">+{request.skills.length - 3} more</Badge>
        )}
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setSelectedRequest(request);
            setShowDetailDialog(true);
          }}
        >
          <Eye className="w-4 h-4" />
          View Details
        </Button>
        {request.status === 'pending' && (
          <>
            <Button 
              size="sm" 
              variant="primary"
              icon={Check}
              onClick={() => handleAcceptRequest(request.projectId)}
            >
              Accept
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              icon={X}
              onClick={() => handleRejectRequest(request.projectId)}
            >
              Decline
            </Button>
          </>
        )}
      </div>
    </Card>
  );

  const pendingRequests = requests.filter((req) => req.status === 'pending');
  const respondedRequests = requests.filter((req) => req.status !== 'pending');

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
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter((r) => r.status === 'accepted').length}
              </p>
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
              <RequestCard key={request.projectId} request={request} />
            ))}
          </div>
        </div>
      )}
      {/* Previous Responses */}
      {respondedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Previous Responses ({respondedRequests.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {respondedRequests.map((request) => (
              <RequestCard key={request.projectId} request={request} />
            ))}
          </div>
        </div>
      )}
      {/* Empty State */}
      {requests.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No project requests yet</h3>
          <p className="text-gray-600">
            Project requests from clients will appear here. Make sure your profile is complete to attract more opportunities.
          </p>
        </Card>
      )}
      {/* Request Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Project Request Details</DialogTitle>
            <DialogDescription>
              Review full project details before responding.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={selectedRequest.clientProfile}
                    alt={selectedRequest.clientName}
                  />
                  <AvatarFallback>
                    {selectedRequest.clientName?.[0] || "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {selectedRequest.clientName}
                  </h3>
                  <p className="text-gray-600">Client</p>
                </div>
              </div>
              {/* Project Details */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Project: {selectedRequest.projectTitle}
                </h4>
                <p className="text-gray-600 mb-4">
                  {selectedRequest.projectDescription}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {selectedRequest.budget && (<div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget
                    </label>
                    <p className="text-lg font-semibold text-green-600">
                      ${selectedRequest.budget.toLocaleString()}
                    </p>
                  </div>)}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedRequest.deadline ? format(selectedRequest.deadline, 'dd MMM yyyy') : ''}
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              {/* Actions */}
              {selectedRequest.status === "pending" && (
                <div className="flex space-x-4 pt-4 border-t">
                  <Button className="flex-1" onClick={() => handleAcceptRequest(selectedRequest.projectId)}>
                    Accept Project
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleRejectRequest(selectedRequest.projectId)}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}