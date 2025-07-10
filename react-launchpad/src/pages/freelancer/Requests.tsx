import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
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
import { mockProjectRequests } from '../../utils/mockData';
import toast from 'react-hot-toast';

export function FreelancerRequests() {
  const [requests, setRequests] = useState(mockProjectRequests);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleAcceptRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'accepted' } : req
    ));
    toast.success('Project request accepted!');
    setShowDetailModal(false);
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'rejected' } : req
    ));
    toast.success('Project request declined');
    setShowDetailModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const RequestCard = ({ request }: { request: any }) => (
    <Card hover>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar src={request.project.client.avatar} alt={request.project.client.name} size="sm" />
            <div>
              <p className="font-medium text-gray-900">{request.project.client.name}</p>
              <p className="text-sm text-gray-500">wants to hire you as</p>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{request.role}</h3>
          <h4 className="text-md font-medium text-blue-600 mb-2">{request.project.title}</h4>
        </div>
        <Badge variant={getStatusColor(request.status) as any}>
          {request.status}
        </Badge>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{request.message}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            ${request.project.budget.toLocaleString()} budget
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Due {new Date(request.project.deadline).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-4 h-4 mr-1" />
          Sent {new Date(request.sentAt).toLocaleDateString()}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {request.project.skills.slice(0, 3).map((skill: string) => (
          <Badge key={skill} variant="info" size="sm">{skill}</Badge>
        ))}
        {request.project.skills.length > 3 && (
          <Badge variant="default" size="sm">+{request.project.skills.length - 3} more</Badge>
        )}
      </div>

      <div className="flex space-x-2">
        <Button 
          size="sm" 
          variant="outline"
          icon={Eye}
          onClick={() => {
            setSelectedRequest(request);
            setShowDetailModal(true);
          }}
          className="flex-1"
        >
          View Details
        </Button>
        {request.status === 'pending' && (
          <>
            <Button 
              size="sm" 
              variant="primary"
              icon={Check}
              onClick={() => handleAcceptRequest(request.id)}
            >
              Accept
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              icon={X}
              onClick={() => handleRejectRequest(request.id)}
            >
              Decline
            </Button>
          </>
        )}
      </div>
    </Card>
  );

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const respondedRequests = requests.filter(req => req.status !== 'pending');

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
                {requests.filter(r => r.status === 'accepted').length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Potential Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                ${pendingRequests.reduce((sum, req) => sum + req.project.budget, 0).toLocaleString()}
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
              <RequestCard key={request.id} request={request} />
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
              <RequestCard key={request.id} request={request} />
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

      {/* Request Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Project Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Client Info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <Avatar src={selectedRequest.project.client.avatar} alt={selectedRequest.project.client.name} size="lg" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{selectedRequest.project.client.name}</h3>
                <p className="text-gray-600">Client</p>
                <div className="flex items-center mt-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">4.8 (23 reviews)</span>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Project: {selectedRequest.project.title}</h4>
              <p className="text-gray-600 mb-4">{selectedRequest.project.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <p className="text-lg font-semibold text-green-600">${selectedRequest.project.budget.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(selectedRequest.project.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.project.skills.map((skill: string) => (
                    <Badge key={skill} variant="info">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Role & Message */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Role: {selectedRequest.role}</h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700">{selectedRequest.message}</p>
              </div>
            </div>

            {/* Actions */}
            {selectedRequest.status === 'pending' && (
              <div className="flex space-x-4 pt-4 border-t">
                <Button 
                  className="flex-1"
                  onClick={() => handleAcceptRequest(selectedRequest.id)}
                >
                  Accept Project
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleRejectRequest(selectedRequest.id)}
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}