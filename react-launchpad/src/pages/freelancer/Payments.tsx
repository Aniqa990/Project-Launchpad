import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  Filter,
  Search,
  Download,
  Eye
} from 'lucide-react';
import { handleError, showSuccessToast } from '@/utils/errorHandler';
import { getFreelancerPayments, getFreelancerProjects, getClientById } from '../../apiendpoints';
import { useAuth } from '../../contexts/AuthContext';

export function FreelancerPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'released'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  // Get freelancer ID from current logged-in user
  const freelancerId = user?.id || 1;

  useEffect(() => {
    fetchPayments();
    fetchProjects();
  }, []);

  // Fetch client details for payments
  useEffect(() => {
    const fetchClients = async () => {
      if (payments.length > 0) {
        const uniqueClientIds = [...new Set(payments.map(p => p.ClientId))];
        const clientPromises = uniqueClientIds.map(id => getClientById(id));
        try {
          const clientData = await Promise.all(clientPromises);
          setClients(clientData);
        } catch (err) {
          handleError(err, 'fetchClientDetails');
        }
      }
    };

    fetchClients();
  }, [payments]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await getFreelancerPayments(freelancerId);
      setPayments(data);
    } catch (err) {
      handleError(err, 'fetchPayments');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await getFreelancerProjects(freelancerId);
      setProjects(data);
    } catch (err) {
      handleError(err, 'fetchProjects');
    }
  };

  // Filtered payments based on search and filters
  const filteredPayments = payments.filter((payment: any) => {
    // Get project title from projects array since API doesn't include it
    const project = projects.find(p => (p.Id || p.id) === payment.ProjectId);
    const projectTitle = project?.ProjectTitle || project?.projectTitle || project?.Title || project?.title || `Project #${payment.ProjectId}`;
    
    const matchesSearch = projectTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.PaymentStatus?.toLowerCase() === statusFilter;
    const matchesProject = projectFilter === 'all' || payment.ProjectId?.toString() === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  // Stats
  const totalEarnings = payments
    .filter((p: any) => p.PaymentStatus === 'Released')
    .reduce((sum: number, p: any) => sum + (p.Amount || 0), 0);
  
  const pendingPayments = payments
    .filter((p: any) => p.PaymentStatus === 'Paid')
    .reduce((sum: number, p: any) => sum + (p.Amount || 0), 0);
  
  const totalPayments = payments.length;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'released': return 'success';
      case 'paid': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'released': return CheckCircle;
      case 'paid': return Clock;
      case 'pending': return AlertCircle;
      default: return Clock;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownloadInvoice = (payment: any) => {
    // Implement invoice download logic
    showSuccessToast('Invoice download started');
  };

  const handleViewDetails = (payment: any) => {
    // Implement payment details view
    toast.info('Payment details feature coming soon');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Payments</h1>
        <p className="text-gray-600">Track your earnings and payment history</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">${totalEarnings.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-gray-900">${pendingPayments.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{totalPayments}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                ${payments
                  .filter((p: any) => {
                    const paymentDate = new Date(p.PaymentDate);
                    const now = new Date();
                    return paymentDate.getMonth() === now.getMonth() && 
                           paymentDate.getFullYear() === now.getFullYear() &&
                           p.PaymentStatus === 'Released';
                  })
                  .reduce((sum: number, p: any) => sum + (p.Amount || 0), 0)
                  .toLocaleString()}
              </p>
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
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Projects</option>
            {projects.map((project: any) => (
              <option key={project.Id || project.id} value={project.Id || project.id}>
                {project.ProjectTitle || project.projectTitle || project.Title || project.title || `Project #${project.Id || project.id}`}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="released">Released</option>
          </select>
        </div>
      </Card>

      {/* Payments List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading payments...</p>
          </Card>
        ) : filteredPayments.length > 0 ? (
          filteredPayments.map((payment: any) => {
            const StatusIcon = getStatusIcon(payment.PaymentStatus);
            const project = projects.find(p => (p.Id || p.id) === payment.ProjectId);
            const client = clients.find(c => (c.Id || c.id) === payment.ClientId);
            
            return (
              <Card key={payment.Id || payment.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between p-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <StatusIcon className={`w-5 h-5 ${
                        payment.PaymentStatus?.toLowerCase() === 'released' ? 'text-green-600' :
                        payment.PaymentStatus?.toLowerCase() === 'paid' ? 'text-orange-600' :
                        'text-gray-400'
                      }`} />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {payment.PaymentType === 'Fixed' ? 'Fixed Project Payment' : 'Milestone Payment'}
                      </h3>
                      <Badge variant={getStatusColor(payment.PaymentStatus) as any}>
                        {payment.PaymentStatus}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-2">
                      {project?.ProjectTitle || project?.projectTitle || project?.Title || project?.title || `Project #${payment.ProjectId}`}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      Client: {client ? `${client.FirstName} ${client.LastName}` : `Client #${payment.ClientId}`}
                    </p>
                    
                    {payment.PaymentType !== 'Fixed' && payment.MilestoneId && (
                      <p className="text-sm text-blue-600 font-medium mb-2">
                        Milestone ID: {payment.MilestoneId}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(payment.PaymentDate)}
                      </div>
                      <div className="flex items-center">
                        <Receipt className="w-4 h-4 mr-1" />
                        Ref: {payment.TransactionReference || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      ${payment.Amount?.toLocaleString() || '0'}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleViewDetails(payment)}
                      >
                        Details
                      </Button>
                      
                      {payment.PaymentStatus === 'Released' && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Download}
                          onClick={() => handleDownloadInvoice(payment)}
                        >
                          Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
                ? 'Try adjusting your search or filters' 
                : 'Your payment history will appear here as you complete milestones and projects'
              }
            </p>
          </Card>
        )}
      </div>
    </div>
  );
} 