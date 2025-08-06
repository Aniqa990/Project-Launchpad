import { useState, useEffect } from 'react';
import { CheckCircle, Clock, DollarSign, Download, Calendar, Upload, FileText, AlertCircle, Send, CreditCard } from 'lucide-react';
import { getMilestonesWithPaymentInfo, updateHandoverStatus, adminReleasePaymentAndApproveMilestone, releasePayment, getPaymentByMilestone, getDeliverablesByMilestoneId } from '../../apiendpoints';
import type { MilestoneWithPayment } from '../../types';
import { handleApiError, showSuccessToast } from '@/utils/errorHandler';

export function MilestonePayments() {
  const [milestones, setMilestones] = useState<MilestoneWithPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [releasingPaymentId, setReleasingPaymentId] = useState<number | null>(null);

  useEffect(() => {
    // Fetch milestones for the selected project
    const fetchMilestones = async () => {
      try {
        setLoading(true);
        const data = await getMilestonesWithPaymentInfo('pending');
        // For each milestone, fetch deliverables and attach them
        const milestonesWithDeliverables = await Promise.all(
          data.map(async (milestone: any) => {
            const milestoneId = milestone.Id || milestone.id;
            let deliverables = [];
            try {
              deliverables = await getDeliverablesByMilestoneId(milestoneId);
            } catch (err) {
              deliverables = [];
            }
            return {
              ...milestone,
              Deliverables: deliverables || [],
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
    fetchMilestones();
  }, []);

  const handleReleasePaymentAndHandover = async (milestoneId: number) => {
    try {
      // Find the milestone to get its payment ID
      const milestone = milestones.find(m => m.id === milestoneId);
      
      await updateHandoverStatus(milestoneId, 'completed');
      
      // Get all payments for this milestone and release them
      if (milestone?.paymentId) {
        try {
          // Release the main payment
          await releasePayment(milestone.paymentId);
          
          // Also try to get all payments for this milestone and release them
          // This handles cases where multiple freelancers are assigned to the same milestone
          const allPayments = await getPaymentByMilestone(milestoneId);
          if (allPayments && Array.isArray(allPayments)) {
            for (const payment of allPayments) {
              if (payment.id && payment.paymentStatus !== 'released') {
                try {
                  await releasePayment(payment.id);
                } catch (paymentErr: any) {
                  console.error(`Failed to release payment ${payment.id}:`, paymentErr);
                }
              }
            }
          }
        } catch (paymentErr: any) {
          console.error('Failed to release payment:', paymentErr);
          // Don't fail the entire operation if payment release fails
        }
      }
      
      // Update the milestone in the local state to reflect both handover and payment status changes
      setMilestones((prev) => prev.map((m) => 
        m.id === milestoneId 
          ? { ...m, handoverStatus: 'completed', paymentStatus: 'released' }
          : m
      ));
      
      showSuccessToast('Milestone released and handed over successfully');
    } catch (err: any) {
      handleApiError(err, 'updateHandoverStatus');
      setError('Failed to update handover status');
    }
  };

  const handleReleasePaymentAndApproveMilestone = async (_milestoneId: number, paymentId?: number) => {
    try {
      console.log('Release button clicked with paymentId:', paymentId);
      if (!paymentId) {
        setError('Payment ID not found for this milestone');
        return;
      }
      
      setReleasingPaymentId(paymentId);
      console.log('Calling adminReleasePaymentAndApproveMilestone with paymentId:', paymentId);
      await adminReleasePaymentAndApproveMilestone(paymentId);
      
      // Refresh the data to get the updated payment status
      const updatedData = await getMilestonesWithPaymentInfo('pending');
      const milestonesWithDeliverables = await Promise.all(
        updatedData.map(async (milestone: any) => {
          const milestoneId = milestone.Id || milestone.id;
          let deliverables = [];
          try {
            deliverables = await getDeliverablesByMilestoneId(milestoneId);
          } catch (err) {
            deliverables = [];
          }
          return {
            ...milestone,
            Deliverables: deliverables || [],
          };
        })
      );
      setMilestones(milestonesWithDeliverables);
      
      showSuccessToast('Payment released and milestone approved successfully');
    } catch (err: any) {
      handleApiError(err, 'adminReleasePaymentAndApproveMilestone');
      setError('Failed to release payment and approve milestone');
    } finally {
      setReleasingPaymentId(null);
    }
  };



  const getPaymentStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'released': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientStatusColor = (isApproved: boolean) => {
    return isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getClientStatusIcon = (isApproved: boolean) => {
    return isApproved ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />;
  };

  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Milestone Payments</h2>
      </div>
      <div className="grid gap-6">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading milestone payments...</p>
          </div>
        ) : !loading && milestones.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No milestone payments found</h3>
            <p className="text-gray-600 mb-4">
              There are currently no milestone payments pending review. Payments will appear here when:
            </p>
            <ul className="text-sm text-gray-500 space-y-1 text-left max-w-md mx-auto">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Freelancers submit their deliverables</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Clients approve milestone submissions</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Payments are ready for release</span>
              </li>
            </ul>
          </div>
        ) : (
          milestones.map((milestone) => (
          <div key={milestone.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{milestone.title}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getClientStatusColor(milestone.isApproved)}`}>
                  {getClientStatusIcon(milestone.isApproved)}
                  <span>{milestone.isApproved ? 'Client Approved' : 'Client Pending Review'}</span>
                </span>
                {milestone.paymentStatus && (
                  <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(milestone.paymentStatus)}`}>
                    <CreditCard className="w-3 h-3" />
                    <span>Payment: {milestone.paymentStatus}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-sm font-medium">${milestone.amount}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Submitted</p>
                  <p className="text-sm font-medium">{new Date(milestone.submissionDate).toLocaleDateString()}</p>
                </div>
              </div>
              {milestone.paymentDate && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Payment Date</p>
                    <p className="text-sm font-medium">{new Date(milestone.paymentDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              {milestone.transactionReference && (
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Transaction Ref</p>
                    <p className="text-sm font-medium">{milestone.transactionReference}</p>
                  </div>
                </div>
              )}
            </div>
            {/* Freelancer Submitted Files */}
            {milestone.submittedFileUrls && milestone.submittedFileUrls.length > 0 && (
              <div className="mb-4 bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Freelancer Deliverables</span>
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {(Array.isArray(milestone.submittedFileUrls) ? milestone.submittedFileUrls : []).map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">{file}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Ready for handover</span>
                        <Download className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-end space-x-2">
              {/* Debug: Show payment status */}
              <div className="text-xs text-gray-500 mr-2">
                Status: {milestone.paymentStatus} | ID: {milestone.paymentId}
              </div>
              
              {/* Show Release & Approve button for debugging */}
              <button
                onClick={() => {
                  console.log('Button clicked for milestone:', milestone);
                  console.log('milestone.id:', milestone.id);
                  console.log('milestone.paymentId:', milestone.paymentId);
                  console.log('milestone.paymentStatus:', milestone.paymentStatus);
                  handleReleasePaymentAndApproveMilestone(milestone.id, milestone.paymentId);
                }}
                disabled={releasingPaymentId === milestone.paymentId}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  releasingPaymentId === milestone.paymentId
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{releasingPaymentId === milestone.paymentId ? 'Releasing...' : 'Release & Approve'}</span>
              </button>
              
              {/* Show Release & Handover button for other cases */}
              {milestone.paymentStatus?.toLowerCase() !== 'paid' && (
                <button
                  onClick={async () => {
                    console.log('Release & Handover button clicked for milestone:', milestone);
                    try {
                      // First get the payments for this milestone
                      const payments = await getPaymentByMilestone(milestone.id);
                      console.log('Payments for milestone:', payments);
                      
                      if (payments && payments.length > 0) {
                        // Use the first payment ID
                        const paymentId = payments[0].Id || payments[0].id;
                        console.log('Using payment ID:', paymentId);
                        
                        if (paymentId) {
                          await handleReleasePaymentAndApproveMilestone(milestone.id, paymentId);
                        } else {
                          setError('Payment ID not found in payments data');
                        }
                      } else {
                        setError('No payments found for this milestone');
                      }
                    } catch (error) {
                      console.error('Error fetching payments:', error);
                      setError('Failed to fetch payments for milestone');
                    }
                  }}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Release & Handover</span>
                </button>
              )}
            </div>
          </div>
        ))
      )}
      </div>
    </div>
  );
}