import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, DollarSign, Download, User, Calendar, Upload, FileText, AlertCircle, Send } from 'lucide-react';
import { getMilestonesByHandoverStatus, updateHandoverStatus } from '../../apiendpoints';
import type { MilestoneWithPayment } from '../../types';
import toast from 'react-hot-toast';

export function MilestonePayments() {
  const [milestones, setMilestones] = useState<MilestoneWithPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getMilestonesByHandoverStatus('pending')
      .then((data) => {
        // Ensure submittedFileUrls is always an array
        const normalized = data.map((m: any) => ({
          ...m,
          submittedFileUrls: Array.isArray(m.submittedFileUrls)
            ? m.submittedFileUrls
            : m.submittedFileUrls
              ? m.submittedFileUrls.split(',').map((s: string) => s.trim())
              : [],
        }));
        setMilestones(normalized);
      })
      .catch((err) => setError(err.message || 'Failed to fetch milestones'))
      .finally(() => setLoading(false));
  }, []);

  const handleReleasePaymentAndHandover = async (milestoneId: number) => {
    try {
      await updateHandoverStatus(milestoneId, 'completed');
      setMilestones((prev) => prev.filter((m) => Number(m.id) !== milestoneId));
      toast.success('Milestone released and handed over successfully');
    } catch (err: any) {
      toast.error('Failed to update handover status');
      setError(err.message || 'Failed to update handover status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      //case 'In Progress': return 'bg-blue-100 text-blue-800';
      //case 'Submitted': return 'bg-purple-100 text-purple-800';
      case 'Client Review': return 'bg-yellow-100 text-yellow-800';
      case 'Client Approved': return 'bg-green-100 text-green-800';
      //case 'Revision Requested': return 'bg-orange-100 text-orange-800';
      //case 'Completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Progress': return <Clock className="w-4 h-4" />;
      case 'Submitted': return <Upload className="w-4 h-4" />;
      case 'Client Review': return <Clock className="w-4 h-4" />;
      case 'Client Approved': return <CheckCircle className="w-4 h-4" />;
      case 'Revision Requested': return <AlertCircle className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Milestone Payments</h2>
      </div>
      <div className="grid gap-6">
        {milestones.map((milestone) => (
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
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(milestone.paymentStatus)}`}>
                    Payment: {milestone.paymentStatus}
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
                  {milestone.submittedFileUrls.map((file, index) => (
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
            <div className="flex items-center justify-end">
              <button
                onClick={() => handleReleasePaymentAndHandover(milestone.id)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Release & Handover</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}