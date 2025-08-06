import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/avatar';
import { Modal } from '../../components/ui/Modal';
import {
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
import { handleApiError, showSuccessToast } from '@/utils/errorHandler';
import { InvoicePage } from './InvoicePage'; // Restore InvoicePage import
import { MultiFreelancerPaymentModal } from '../../components/ui/MultiFreelancerPaymentModal';
import { createStripeCheckoutSession, getClientProjects, getMilestonesByProjectId, getClientPayments, getPaymentsByProject, releasePayment, getPaymentByMilestone, getMilestoneFreelancers, getDeliverablesByMilestoneId } from '../../apiendpoints';
import PaymentForm from './PaymentForm'; // Added import for PaymentForm
import { validatePaymentData, formatPaymentAmount, calculatePlatformFee, calculateFreelancerAmount, getPaymentStatusColor, formatPaymentDate } from '../../utils/paymentHelpers';
import { useAuth } from '../../contexts/AuthContext';

export function ClientPayments() {

  const { user } = useAuth();
  const clientId = user?.id;

  if (!clientId) {
    return;
  }

  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'notStarted' |'inProgress' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [payingMilestone, setPayingMilestone] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | number>('all');
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'milestone' | 'fixed'>('all');
  const [payments, setPayments] = useState<any[]>([]);
  const [milestonePayments, setMilestonePayments] = useState<{[key: number]: any}>({});
  const [viewMode, setViewMode] = useState<'milestones' | 'payments'>('milestones');
  const [showMultiFreelancerModal, setShowMultiFreelancerModal] = useState(false);
  const [selectedMilestoneForMultiPayment, setSelectedMilestoneForMultiPayment] = useState<any>(null);

  useEffect(() => {
    // Fetch projects for the current client
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await getClientProjects(clientId);
        setProjects(data);
      } catch (err) {
        handleApiError(err, 'fetchProjects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [clientId, user]);

  // Set default project when projects are loaded (only on initial load)
  useEffect(() => {
    if (projects.length > 0 && selectedProjectId === 'all') {
      const firstProject = projects.find(project => project && (project.id));
      if (firstProject) {
        const projectId = firstProject.id;
        const projectTitle = firstProject.projectTitle;
        if (projectId) {
          console.log('Auto-selecting project:', projectId, projectTitle);
          setSelectedProjectId(projectId.toString());
        } else {
          console.log('Project found but no valid ID:', firstProject);
        }
      } else {
        console.log('No valid projects found:', projects);
      }
    } else if (projects.length === 0 && selectedProjectId === 'all') {
      console.log('No projects found for client. This could mean:');
      console.log('1. Client has no projects');
      console.log('2. API call failed');
      console.log('3. Client ID is incorrect');
    }
  }, [projects]);

  useEffect(() => {
    // Fetch payments for the current client
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const data = await getClientPayments(clientId);
        setPayments(data);
      } catch (err) {
        handleApiError(err, 'fetchPayments');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  // Fetch milestones when project is selected
  useEffect(() => {
    const fetchMilestones = async () => {
      if (selectedProjectId === 'all') {
        setMilestones([]);
        return;
      }
      try {
        setLoading(true);
        const data = await getMilestonesByProjectId(Number(selectedProjectId));
        
        // For each milestone, fetch deliverables and attach them
        const milestonesWithDeliverables = await Promise.all(
          data.map(async (milestone: any) => {
            const milestoneId = milestone.Id || milestone.id;
            let deliverables = [];
            try {
              deliverables = await getDeliverablesByMilestoneId(milestoneId);
            } catch (err) {
              console.error(`Failed to fetch deliverables for milestone ${milestoneId}:`, err);
              deliverables = [];
            }
            return {
              ...milestone,
              Deliverables: deliverables
            };
          })
        );
        
        setMilestones(milestonesWithDeliverables);
      } catch (err) {
        handleApiError(err, 'fetchMilestones');
      } finally {
        setLoading(false);
      }
    };
    if (selectedProjectId !== 'all') {
      fetchMilestones();
    } else {
      setMilestones([]);
    }
  }, [selectedProjectId]);

  // Fetch payment status for milestones
  useEffect(() => {
    const fetchMilestonePayments = async () => {
      if (milestones.length > 0) {
        const paymentPromises = milestones.map(async (milestone) => {
          const milestoneId = milestone.id;
          try {
            const payments = await getPaymentByMilestone(milestoneId);
            // getPaymentByMilestone now returns an array of payments
            return { milestoneId, payments: Array.isArray(payments) ? payments : [] };
          } catch (error) {
            return { milestoneId, payments: [] };
          }
        });
        
        const results = await Promise.all(paymentPromises);
        const paymentMap: {[key: number]: any[]} = {};
        results.forEach(({ milestoneId, payments }) => {
          paymentMap[milestoneId] = payments.filter(p => p); // Filter out null/undefined payments
        });
        setMilestonePayments(paymentMap);
      }
    };

    fetchMilestonePayments();
  }, [milestones]);

  // Check if all freelancers for a milestone are paid
  const checkAllFreelancersPaid = async (milestone: any) => {
    try {
      // Get all freelancers assigned to this milestone
      const freelancers = await getMilestoneFreelancers(milestone.Id || milestone.id);
      
      if (freelancers.length === 0) {
        return false; // No freelancers assigned
      }

      // Get all payments for this milestone
      const payments = await getPaymentByMilestone(milestone.Id || milestone.id);
      
      // If no payments exist, not all are paid
      if (!payments || payments.length === 0) {
        return false;
      }

      // Check if all freelancers have paid payments
      const paidFreelancerIds = payments
        .filter((payment: any) => 
          payment.PaymentStatus === 'Paid' || payment.PaymentStatus === 'paid' ||
          payment.PaymentStatus === 'Released' || payment.PaymentStatus === 'released'
        )
        .map((payment: any) => payment.FreelancerId);

      const allFreelancerIds = freelancers.map((f: any) => f.FreelancerId);
      
      // Check if all freelancers have paid payments
      return allFreelancerIds.every((freelancerId: number) => 
        paidFreelancerIds.includes(freelancerId)
      );
    } catch (error) {
      handleApiError(error, 'checkFreelancerPayments');
      return false;
    }
  };

  // Get payment status for milestone (for display)
  const getMilestonePaymentStatus = (milestone: any) => {
    const milestoneId = milestone.id;
    const payment = milestonePayments[milestoneId];
    
    if (!payment) {
      return { status: 'none', message: 'No payment' };
    }

    const paymentStatus = payment.PaymentStatus || payment.paymentStatus || 'Unknown';
    
    if (paymentStatus === 'Paid' || paymentStatus === 'paid') {
      return { status: 'paid', message: 'Payment Paid' };
    } else if (paymentStatus === 'Released' || paymentStatus === 'released') {
      return { status: 'released', message: 'Payment Released' };
    } else {
      return { status: 'pending', message: `Payment: ${paymentStatus}` };
    }
  };

  // Filtered milestones based on search and status
  const filteredMilestones = milestones.filter((milestone: any) => {
    const matchesSearch = (milestone.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'notStarted') matchesStatus = (milestone.Status || milestone.status) === 0;
      else if (statusFilter === 'inProgress') matchesStatus = (milestone.Status || milestone.status) === 1;
      else if (statusFilter === 'completed') matchesStatus = (milestone.Status || milestone.status) === 2;
      else matchesStatus = true;
    }
    return matchesSearch && matchesStatus;
  });

  // Filtered payments based on search and filters
  const filteredPayments = payments.filter((payment: any) => {
    const matchesSearch = (payment.ProjectTitle || payment.projectTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.PaymentStatus?.toLowerCase() === statusFilter;
    const matchesProject = selectedProjectId === 'all' || payment.ProjectId?.toString() === selectedProjectId.toString();
    const matchesPaymentType = paymentTypeFilter === 'all' || payment.PaymentType?.toLowerCase() === paymentTypeFilter;
    return matchesSearch && matchesStatus && matchesProject && matchesPaymentType;
  });

  // Stats
  const totalPaid = milestones.filter((m: any) => (m.Status || m.status) === 2).reduce((sum: number, m: any) => sum + (m.Amount || m.amount || 0), 0);
  const totalPending = milestones.filter((m: any) => (m.Status || m.status) === 1).reduce((sum: number, m: any) => sum + (m.Amount || m.amount || 0), 0);
  const totalBudget = projects.reduce((sum: number, p: any) => sum + (p.Budget || p.budget || 0), 0);

  const handleReleasePayment = async (paymentId: number) => {
    try {
      await releasePayment(paymentId);
      showSuccessToast('Payment released successfully!');
      setShowPaymentModal(false);
      // Refresh payments
      const data = await getClientPayments(clientId);
      setPayments(data);
    } catch (err) {
      handleApiError(err, 'releasePayment');
    }
  };

  const getStatusColor = (status: string | number) => {
    switch (status) {
      case 2: return 'success'; // Completed
      case 1: return 'warning'; // In Progress
      case 0: return 'default'; // Not Started
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string | number) => {
    switch (status) {
      case 2: return CheckCircle; // Completed
      case 1: return Clock; // In Progress
      case 0: return AlertCircle; // Not Started
      default: return Clock;
    }
  };

  // Fixed project payment handler with selected freelancer
  const handleFixedProjectPaymentWithFreelancer = async (project: any, selectedFreelancerId: number) => {
    try {
      const paymentData = {
        clientId: project.ClientId || project.clientId || clientId,
        freelancerId: selectedFreelancerId,
        projectId: project.ProjectId || project.projectId,
        paymentType: 'Fixed',
        milestoneId: null, // Fixed payments don't have milestone IDs
        timesheetId: null,
        amount: project.Amount || project.amount || 0,
      };

      // Validate payment data
      const validation = validatePaymentData(paymentData);
      if (!validation.isValid) {
        handleApiError(new Error(validation.error), 'validation');
        return;
      }

      const { url } = await createStripeCheckoutSession(paymentData);
      if (url) {
        window.location.href = url;
      } else {
        handleApiError(new Error('Failed to initiate Stripe Checkout.'), 'processPayment');
      }
    } catch (err: any) {
      handleApiError(err, 'processPayment');
    }
  };

  // Fixed project payment handler (fallback)
  const handleFixedProjectPayment = async (project: any) => {
    try {
      const paymentData = {
        clientId: project.ClientId || project.clientId || clientId,
        freelancerId: project.FreelancerId || project.freelancerId || 2, // Use 2 as fallback
        projectId: project.Id || project.id,
        paymentType: 'Fixed',
        milestoneId: null, // Fixed payments don't have milestone IDs
        timesheetId: null,
        amount: project.Budget || project.budget || 0,
      };

      // Validate payment data
      const validation = validatePaymentData(paymentData);
      if (!validation.isValid) {
        handleApiError(new Error(validation.error), 'validation');
        return;
      }

      const { url } = await createStripeCheckoutSession(paymentData);
      if (url) {
        window.location.href = url;
      } else {
        handleApiError(new Error('Failed to initiate Stripe Checkout.'), 'processPayment');
      }
    } catch (err: any) {
      handleApiError(err, 'processPayment');
    }
  };

  // Stripe checkout handler with selected freelancer
  const handleStripeCheckoutWithFreelancer = async (milestone: any, selectedFreelancerId: number) => {
    try {
      const paymentData = {
        clientId: milestone.ClientId || milestone.clientId || clientId,
        freelancerId: selectedFreelancerId,
        projectId: milestone.ProjectId || milestone.projectId || selectedProjectId,
        paymentType: 'Milestone',
        milestoneId: milestone.MilestoneId || milestone.Id || milestone.id,
        timesheetId: null,
        amount: milestone.amount || milestone.Amount || 0,
      };

      // Validate payment data
      const validation = validatePaymentData(paymentData);
      if (!validation.isValid) {
        handleApiError(new Error(validation.error), 'validation');
        return;
      }

      const { url } = await createStripeCheckoutSession(paymentData);
      if (url) {
        window.location.href = url;
      } else {
        handleApiError(new Error('Failed to initiate Stripe Checkout.'), 'processPayment');
      }
    } catch (err: any) {
      handleApiError(err, 'processPayment');
    }
  };

  // Check if milestone has multiple freelancers
  const checkMilestoneFreelancers = async (milestone: any) => {
    try {
      const freelancers = await getMilestoneFreelancers(milestone.Id || milestone.id);
      return freelancers.length > 1;
    } catch (error) {
      console.error('Failed to check milestone freelancers:', error);
      return false;
    }
  };

  // Handle milestone payment (single or multi-freelancer)
  const handleMilestonePayment = async (milestone: any) => {
    try {
      console.log('Pay Now clicked for milestone:', milestone);
      const hasMultipleFreelancers = await checkMilestoneFreelancers(milestone);
      console.log('Has multiple freelancers:', hasMultipleFreelancers);
      
      if (hasMultipleFreelancers) {
        // Show multi-freelancer payment modal
        console.log('Opening multi-freelancer modal');
        setSelectedMilestoneForMultiPayment(milestone);
        setShowMultiFreelancerModal(true);
      } else {
        // Open InvoicePage for single freelancer
        console.log('Opening InvoicePage for single freelancer');
        try {
          // Fetch the correct freelancers for this milestone
          const milestoneFreelancers = await getMilestoneFreelancers(milestone.Id || milestone.id);
          setPayingMilestone({
            Title: milestone.Title || milestone.title,
            ProjectId: milestone.ProjectId || milestone.projectId,
            Amount: milestone.Amount || milestone.amount,
            PaymentType: 'Milestone',
            MilestoneId: milestone.Id || milestone.id,
            milestoneFreelancers: milestoneFreelancers
          });
          setShowInvoiceModal(true);
        } catch (err) {
          console.error('Failed to fetch milestone freelancers:', err);
          // Fallback to opening without freelancer data
          setPayingMilestone({
            Title: milestone.Title || milestone.title,
            ProjectId: milestone.ProjectId || milestone.projectId,
            Amount: milestone.Amount || milestone.amount,
            PaymentType: 'Milestone',
            MilestoneId: milestone.Id || milestone.id
          });
          setShowInvoiceModal(true);
        }
      }
    } catch (error) {
      console.error('Error in handleMilestonePayment:', error);
      handleApiError(error, 'processPayment');
    }
  };

  // Stripe checkout handler (fallback)
  const handleStripeCheckout = async (milestone: any) => {
    try {
      // Get the project to find the freelancer ID
      const project = projects.find(p => (p.Id || p.id) === (milestone.ProjectId || milestone.projectId));
      const freelancerId = project?.FreelancerId || project?.freelancerId || 2; // Use 2 as fallback

      const paymentData = {
        clientId: milestone.ClientId || milestone.clientId || clientId,
        freelancerId: milestone.FreelancerId || milestone.freelancerId || freelancerId,
        projectId: milestone.ProjectId || milestone.projectId || selectedProjectId,
        paymentType: 'Milestone',
        milestoneId: milestone.id,
        timesheetId: null,
        amount: milestone.amount ?? 0,
      };

      // Validate payment data
      const validation = validatePaymentData(paymentData);
      if (!validation.isValid) {
        handleApiError(new Error(validation.error), 'validation');
        return;
      }

      const { url } = await createStripeCheckoutSession(paymentData);
      if (url) {
        window.location.href = url;
      } else {
        handleApiError(new Error('Failed to initiate Stripe Checkout.'), 'processPayment');
      }
    } catch (err: any) {
      handleApiError(err, 'processPayment');
    }
  };

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

      {/* View Mode Toggle */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'milestones' ? 'primary' : 'outline'}
              onClick={() => setViewMode('milestones')}
            >
              Milestones
            </Button>
            <Button
              variant={viewMode === 'payments' ? 'primary' : 'outline'}
              onClick={() => setViewMode('payments')}
            >
              Payment History
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Debug info */}
          <div className="text-xs text-gray-500">
            Projects: {projects.length} | Selected: {selectedProjectId}
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={viewMode === 'milestones' ? "Search milestones..." : "Search payments..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Projects</option>
            {projects.filter(project => project && (project.Id || project.id)).map((project: any) => {
              const projectId = project.Id || project.id;
              const projectTitle = project.ProjectTitle || project.projectTitle;
              return projectId ? (
                <option key={projectId} value={projectId.toString()}>
                  {projectTitle || 'Untitled Project'}
                </option>
              ) : null;
            })}
          </select>
          {viewMode === 'payments' && (
            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Payment Types</option>
              <option value="milestone">Milestone-based</option>
              <option value="fixed">Fixed-price</option>
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            {viewMode === 'milestones' ? (
              <>
            <option value="pending">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
              </>
            ) : (
              <>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="released">Released</option>
              </>
            )}
          </select>
        </div>
      </Card>

      {/* Milestones List */}
      <div className="space-y-4">
        {filteredMilestones.map((milestone: any) => {
          const StatusIcon = getStatusIcon(milestone.Status || milestone.status);
          return (
            <Card key={milestone.Id || milestone.id} hover>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <StatusIcon className={`w-5 h-5 ${
                      (milestone.Status || milestone.status) === 2 ? 'text-green-600' :
                      (milestone.Status || milestone.status) === 1 ? 'text-orange-600' :
                      'text-gray-400'
                    }`} />
                    <h3 className="text-lg font-semibold text-gray-900">{milestone.Title || milestone.title}</h3>
                    <Badge variant={getStatusColor(milestone.Status || milestone.status) as any}>
                      {milestone.Status === 0 || milestone.status === 0 ? 'Not Started' :
                       milestone.Status === 1 || milestone.status === 1 ? 'In Progress' :
                       milestone.Status === 2 || milestone.status === 2 ? 'Completed' :
                       milestone.Status || milestone.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-2">{milestone.Description || milestone.description}</p>
                  <p className="text-sm text-blue-600 font-medium mb-3">
                    {projects.find(p => (p.Id || p.id) === (milestone.ProjectId || milestone.projectId))?.Title || ''}
                  </p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Due {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : ''}
                    </div>
                    <div className="flex items-center">
                      ${milestone.amount?.toLocaleString() || ''}
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Deliverables:</p>
                    <div className="flex flex-wrap gap-2">
                      {(milestone.Deliverables || milestone.deliverables || []).map((deliverable: any, index: number) => (
                        <Badge key={index} variant="info" size="sm">
                          {/* Show file name and comment if available, fallback to ID */}
                          {deliverable.uploadFiles || deliverable.UploadFiles || deliverable.comment || deliverable.Comment || `Deliverable #${deliverable.id || deliverable.Id || index}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="ml-6 text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    ${milestone.amount?.toLocaleString() || ''}
                  </div>
                  {/* Payment Button Logic for Completed Milestones */}
                  {/* 
                    Logic:
                    1. If milestone status is completed (2)
                    2. Check if ALL freelancers for this milestone are paid
                    3. If all paid → Show "All Paid" status
                    4. If some paid → Show "Partial Payment" status
                    5. If none paid → Show "Pay Now" button
                  */}
                                    {(milestone.Status === 2 || milestone.status === 2) && (
                    (() => {
                      const milestoneId = milestone.Id || milestone.id;
                      const payments = milestonePayments[milestoneId] || [];
                      
                      // Check if any payments exist for this milestone
                      if (payments.length > 0) {
                        // Get freelancers for this milestone to check if all are paid
                        const paidPayments = payments.filter((payment: any) => 
                          payment.PaymentStatus === 'Paid' || payment.PaymentStatus === 'paid' ||
                          payment.PaymentStatus === 'Released' || payment.PaymentStatus === 'released'
                        );
                        
                        const pendingPayments = payments.filter((payment: any) => 
                          payment.PaymentStatus === 'Pending' || payment.PaymentStatus === 'pending'
                        );

                        // Get unique freelancer IDs to count actual freelancers
                        const uniqueFreelancerIds = [...new Set(payments.map((p: any) => p.FreelancerId))];
                        const uniquePaidFreelancerIds = [...new Set(paidPayments.map((p: any) => p.FreelancerId))];
                        const uniquePendingFreelancerIds = [...new Set(pendingPayments.map((p: any) => p.FreelancerId))];

                        // Check if all freelancers are paid
                        if (uniquePaidFreelancerIds.length === uniqueFreelancerIds.length) {
                          // All freelancers are paid
                          return (
                            <div className="flex flex-col items-end space-y-2">
                              <Badge variant="success" size="sm">
                                All Paid
                              </Badge>
                              <p className="text-xs text-gray-500">
                                {uniqueFreelancerIds.length} freelancer{uniqueFreelancerIds.length > 1 ? 's' : ''} paid
                              </p>
                            </div>
                          );
                        } else if (uniquePaidFreelancerIds.length > 0 && uniquePendingFreelancerIds.length > 0) {
                          // Some freelancers paid, some pending
                          return (
                            <div className="flex flex-col items-end space-y-2">
                              <Badge variant="warning" size="sm">
                                Partial Payment
                              </Badge>
                              <p className="text-xs text-gray-500">
                                {uniquePaidFreelancerIds.length}/{uniqueFreelancerIds.length} paid
                              </p>
                              <Button
                                icon={CreditCard}
                                onClick={() => handleMilestonePayment(milestone)}
                                size="sm"
                              >
                                Pay Remaining
                              </Button>
                            </div>
                          );
                        } else {
                          // All freelancers are pending
                          return (
                            <div className="flex flex-col items-end space-y-2">
                              <Badge variant="warning" size="sm">
                                Payment Pending
                              </Badge>
                              <p className="text-xs text-gray-500">
                                {uniqueFreelancerIds.length} freelancer{uniqueFreelancerIds.length > 1 ? 's' : ''} pending
                              </p>
                              <Button
                                icon={CreditCard}
                                onClick={() => handleMilestonePayment(milestone)}
                                size="sm"
                              >
                                Pay Now
                              </Button>
                            </div>
                          );
                        }
                      } else {
                        // No payments exist for this milestone - show Pay Now button
                        return (
                          <Button
                            icon={CreditCard}
                            onClick={() => handleMilestonePayment(milestone)}
                          >
                            Pay Now
                          </Button>
                        );
                      }
                    })()
                  )}
                  {(milestone.Status || milestone.status) === 1 && (
                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant="warning" size="sm">
                        In Progress
                      </Badge>
                      <p className="text-xs text-gray-500">Awaiting completion</p>
                    </div>
                  )}
                  {(milestone.Status || milestone.status) === 0 && (
                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant="default" size="sm">
                        Not Started
                      </Badge>
                      <p className="text-xs text-gray-500">Awaiting selection</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Fixed Projects Section */}
      {viewMode === 'milestones' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Fixed Price Projects</h2>
          <div className="space-y-4">
            {projects
              .filter((project: any) => project.PaymentType === 'Fixed' && project.status === 'completed')
              .map((project: any) => (
                <Card key={project.Id || project.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between p-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.ProjectTitle || project.projectTitle || project.Title || project.title}</h3>
                        <Badge variant="success">Fixed Price</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{project.Description || project.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Due {project.Deadline ? new Date(project.Deadline).toLocaleDateString() : ''}
                        </div>
                        <div className="flex items-center">
                          Budget: ${project.Budget?.toLocaleString() || ''}
                        </div>
                      </div>
                    </div>
                    <div className="ml-6 text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        ${project.Budget?.toLocaleString() || ''}
                      </div>
                      <Button
                        icon={CreditCard}
                        onClick={() => {
                          setPayingMilestone({
                            Title: project.ProjectTitle || project.projectTitle || project.Title || project.title,
                            ProjectId: project.Id || project.id,
                            Amount: project.Budget || project.budget || 0,
                            PaymentType: 'Fixed'
                          });
                          setShowInvoiceModal(true);
                        }}
                      >
                        Pay Full Amount
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Payment History View */}
      {viewMode === 'payments' && (
        <div className="space-y-4">
          {filteredPayments.map((payment: any) => {
            const project = projects.find(p => (p.Id || p.id) === payment.ProjectId);
            return (
              <Card key={payment.Id || payment.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between p-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {payment.PaymentType === 'Fixed' ? 'Fixed Project Payment' : 'Milestone Payment'}
                      </h3>
                      <Badge variant={getPaymentStatusColor(payment.PaymentStatus)}>
                        {payment.PaymentStatus}
                      </Badge>
                      {payment.PaymentStatus === 'Released' && (
                        <span className="text-green-600 text-sm font-medium">✓ Payment Released</span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-2">
                      {project?.ProjectTitle || project?.projectTitle || project?.Title || project?.title || `Project #${payment.ProjectId}`}
                    </p>
                    
                    {payment.PaymentType !== 'Fixed' && payment.MilestoneId && (
                      <p className="text-sm text-blue-600 font-medium mb-2">
                        Milestone ID: {payment.MilestoneId}
                      </p>
                    )}
                    
                                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatPaymentDate(payment.PaymentDate)}
                        </div>
                        <div className="flex items-center">
                          <Receipt className="w-4 h-4 mr-1" />
                          Ref: {payment.TransactionReference || 'N/A'}
                        </div>
                      </div>
                  </div>
                  
                  <div className="ml-6 text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {formatPaymentAmount(payment.Amount || 0)}
                    </div>
                    
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {((viewMode === 'milestones' && filteredMilestones.length === 0) || (viewMode === 'payments' && filteredPayments.length === 0)) && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {viewMode === 'milestones' ? 'No milestones found' : 'No payments found'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || (viewMode === 'payments' && paymentTypeFilter !== 'all')
              ? 'Try adjusting your search or filters' 
              : viewMode === 'milestones' 
                ? 'Milestone payments will appear here as your projects progress'
                : 'Payment history will appear here as you make payments'
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
              <h3 className="font-semibold text-gray-900 mb-1">{selectedMilestone.Title || selectedMilestone.title}</h3>
              <p className="text-sm text-gray-600">
                {projects.find(p => (p.Id || p.id) === (selectedMilestone.ProjectId || selectedMilestone.projectId))?.Title || ''}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Milestone Amount</span>
                <span className="font-semibold">${selectedMilestone.amount?.toLocaleString() || ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (5%)</span>
                <span className="font-semibold">-{formatPaymentAmount(calculatePlatformFee(selectedMilestone.amount || 0))}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Freelancer Receives</span>
                <span className="font-semibold text-green-600">
                  {formatPaymentAmount(calculateFreelancerAmount(selectedMilestone.amount || 0))}
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
              {/* Removed Release button from client invoice modal */}
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
             {/* Invoice Modal for Pay Now */}
             {showInvoiceModal && payingMilestone && (
               <InvoicePage
                 invoiceData={{
                   milestoneTitle: payingMilestone.Title || payingMilestone.title,
                   projectTitle: projects.find(p => (p.Id || p.id) === (payingMilestone.ProjectId || payingMilestone.projectId))?.ProjectTitle || projects.find(p => (p.Id || p.id) === (payingMilestone.ProjectId || payingMilestone.projectId))?.projectTitle || '',
                   projectId: payingMilestone.ProjectId || payingMilestone.projectId,
                   amount: payingMilestone.Amount || payingMilestone.amount,
                   paymentType: payingMilestone.PaymentType || 'Milestone',
                   milestoneId: payingMilestone.MilestoneId || payingMilestone.Id || payingMilestone.id,
                   milestoneFreelancers: payingMilestone.milestoneFreelancers || [],
                   // Add more fields as needed
                 }}
                 onPayNow={(data) => {
                   console.log('InvoicePage onPayNow called with data:', data);
                   if (payingMilestone.PaymentType === 'Fixed') {
                     handleFixedProjectPaymentWithFreelancer(payingMilestone, data.selectedFreelancerId);
                   } else {
                     handleStripeCheckoutWithFreelancer(payingMilestone, data.selectedFreelancerId);
                   }
                   setShowInvoiceModal(false);
                 }}
                 onClose={() => setShowInvoiceModal(false)}
               />
             )}

      {/* Multi-Freelancer Payment Modal */}
      {showMultiFreelancerModal && selectedMilestoneForMultiPayment && (
        <MultiFreelancerPaymentModal
          milestone={selectedMilestoneForMultiPayment}
          projectId={selectedMilestoneForMultiPayment.ProjectId || selectedMilestoneForMultiPayment.projectId || Number(selectedProjectId)}
          clientId={clientId}
          onClose={() => {
            setShowMultiFreelancerModal(false);
            setSelectedMilestoneForMultiPayment(null);
          }}
          onSuccess={() => {
            setShowMultiFreelancerModal(false);
            setSelectedMilestoneForMultiPayment(null);
            // fetchPayments();
            // fetchMilestones();
            // Refresh payments and milestones
            // Note: The component will automatically refresh when the modal closes
          }}
        />
      )}
    </div>
  );
}