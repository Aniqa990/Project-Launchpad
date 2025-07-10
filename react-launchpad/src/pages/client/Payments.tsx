import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '../../components/ui/Modal';
import { 
  DollarSign,
  Calendar,
  Download,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  Filter,
  Search
} from 'lucide-react';
import { mockProjects } from '../../utils/mockData';
import toast from 'react-hot-toast';

export function ClientPayments() {
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Flatten all milestones from all projects
  const allMilestones = mockProjects.flatMap(project => 
    project.milestones.map(milestone => ({
      ...milestone,
      project: project
    }))
  );

  const filteredMilestones = allMilestones.filter(milestone => {
    const matchesSearch = milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         milestone.project.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || milestone.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReleasePayment = (milestoneId: string) => {
    // In a real app, this would process the payment
    toast.success('Payment released successfully!');
    setShowPaymentModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'approved': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'approved': return Clock;
      case 'pending': return AlertCircle;
      default: return Clock;
    }
  };

  const calculatePlatformFee = (amount: number) => amount * 0.05; // 5% platform fee
  const calculateFreelancerAmount = (amount: number) => amount - calculatePlatformFee(amount);

  const totalPaid = allMilestones.filter(m => m.status === 'paid').reduce((sum, m) => sum + m.amount, 0);
  const totalPending = allMilestones.filter(m => m.status === 'approved').reduce((sum, m) => sum + m.amount, 0);
  const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
        <p className="text-gray-600">Manage milestone payments and track your spending</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">${totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Release</p>
              <p className="text-2xl font-bold text-gray-900">${totalPending.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">${totalBudget.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Platform Fees</p>
              <p className="text-2xl font-bold text-gray-900">${(totalPaid * 0.05).toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search milestones or projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Ready to Pay</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </Card>

      {/* Milestones List */}
      <div className="space-y-4">
        {filteredMilestones.map((milestone) => {
          const StatusIcon = getStatusIcon(milestone.status);
          return (
            <Card key={milestone.id} hover>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <StatusIcon className={`w-5 h-5 ${
                      milestone.status === 'paid' ? 'text-green-600' :
                      milestone.status === 'approved' ? 'text-orange-600' :
                      'text-gray-400'
                    }`} />
                    <h3 className="text-lg font-semibold text-gray-900">{milestone.title}</h3>
                    <Badge variant={getStatusColor(milestone.status) as any}>
                      {milestone.status}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{milestone.description}</p>
                  <p className="text-sm text-blue-600 font-medium mb-3">{milestone.project.title}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Due {new Date(milestone.dueDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ${milestone.amount.toLocaleString()}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Deliverables:</p>
                    <div className="flex flex-wrap gap-2">
                      {milestone.deliverables.map((deliverable, index) => (
                        <Badge key={index} variant="info" size="sm">{deliverable}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ml-6 text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    ${milestone.amount.toLocaleString()}
                  </div>
                  
                  {milestone.status === 'approved' && (
                    <Button
                      icon={CreditCard}
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setShowPaymentModal(true);
                      }}
                    >
                      Release Payment
                    </Button>
                  )}
                  
                  {milestone.status === 'paid' && (
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" icon={Download}>
                        Download Files
                      </Button>
                      <Button variant="outline" size="sm" icon={Receipt}>
                        Receipt
                      </Button>
                    </div>
                  )}
                  
                  {milestone.status === 'pending' && (
                    <p className="text-sm text-gray-500">Awaiting completion</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredMilestones.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Milestone payments will appear here as your projects progress'
            }
          </p>
        </Card>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Release Payment"
        size="md"
      >
        {selectedMilestone && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1">{selectedMilestone.title}</h3>
              <p className="text-sm text-gray-600">{selectedMilestone.project.title}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Milestone Amount</span>
                <span className="font-semibold">${selectedMilestone.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (5%)</span>
                <span className="font-semibold">-${calculatePlatformFee(selectedMilestone.amount).toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Freelancer Receives</span>
                <span className="font-semibold text-green-600">
                  ${calculateFreelancerAmount(selectedMilestone.amount).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Payment Release</p>
                  <p className="text-sm text-yellow-700">
                    Once released, this payment cannot be reversed. Make sure you've reviewed and approved all deliverables.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button 
                className="flex-1"
                onClick={() => handleReleasePayment(selectedMilestone.id)}
              >
                Release ${selectedMilestone.amount.toLocaleString()}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}