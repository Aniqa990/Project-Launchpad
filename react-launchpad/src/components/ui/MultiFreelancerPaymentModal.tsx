import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Badge } from './badge';
import { getMilestoneFreelancers, createStripeCheckoutSession, getPaymentByMilestone, createMultiFreelancerCheckoutSession } from '@/apiendpoints';
import { validatePaymentData } from '@/utils/paymentHelpers';
import { DollarSign, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { showErrorToast } from '@/utils/errorHandler';

interface MilestoneFreelancer {
  FreelancerId: number;
  FirstName: string;
  LastName: string;
}

interface PaymentDistribution {
  freelancerId: number;
  freelancerName: string;
  amount: number;
  percentage: number;
}

interface MultiFreelancerPaymentModalProps {
  milestone: any;
  projectId: number;
  clientId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const MultiFreelancerPaymentModal: React.FC<MultiFreelancerPaymentModalProps> = ({
  milestone,
  projectId,
  clientId,
  onClose,
  onSuccess
}) => {
  const [freelancers, setFreelancers] = useState<MilestoneFreelancer[]>([]);
  const [selectedFreelancers, setSelectedFreelancers] = useState<PaymentDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [distributionType, setDistributionType] = useState<'equal' | 'custom'>('equal');


  const milestoneAmount = milestone.Amount || milestone.amount || 0;

  // Fetch freelancers assigned to this milestone
  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setLoading(true);
        const data = await getMilestoneFreelancers(milestone.Id || milestone.id);
        setFreelancers(data);
        
        // Get existing payments to filter out already paid freelancers
        const existingPayments = await getPaymentByMilestone(milestone.Id || milestone.id);
        const paidFreelancerIds = (existingPayments || [])
          .filter((payment: any) => 
            payment.PaymentStatus === 'Paid' || payment.PaymentStatus === 'paid' ||
            payment.PaymentStatus === 'Released' || payment.PaymentStatus === 'released'
          )
          .map((payment: any) => payment.FreelancerId);
        
        // Filter out already paid freelancers
        const unpaidFreelancers = data.filter((f: MilestoneFreelancer) => 
          !paidFreelancerIds.includes(f.FreelancerId)
        );
        
        // Initialize with equal distribution for unpaid freelancers only
        if (unpaidFreelancers.length > 0) {
          const equalAmount = milestoneAmount / unpaidFreelancers.length;
          const distributions = unpaidFreelancers.map((f: MilestoneFreelancer) => ({
            freelancerId: f.FreelancerId,
            freelancerName: `${f.FirstName} ${f.LastName}`,
            amount: equalAmount,
            percentage: (equalAmount / milestoneAmount) * 100
          }));
          setSelectedFreelancers(distributions);
        } else {
          setSelectedFreelancers([]);
        }
      } catch (error) {
        console.error('Failed to fetch milestone freelancers:', error);
        showErrorToast('Failed to fetch freelancers for this milestone');
      } finally {
        setLoading(false);
      }
    };

    fetchFreelancers();
  }, [milestone.Id, milestone.id, milestoneAmount]);

  // Update distribution when type changes
  useEffect(() => {
    if (selectedFreelancers.length > 0) {
      if (distributionType === 'equal') {
        const equalAmount = milestoneAmount / selectedFreelancers.length;
        const distributions = selectedFreelancers.map((f) => ({
          freelancerId: f.freelancerId,
          freelancerName: f.freelancerName,
          amount: equalAmount,
          percentage: (equalAmount / milestoneAmount) * 100
        }));
        setSelectedFreelancers(distributions);
      }
    }
  }, [distributionType, selectedFreelancers.length, milestoneAmount]);

  // Handle amount change for custom distribution
  const handleAmountChange = (freelancerId: number, newAmount: number) => {
    const updated = selectedFreelancers.map(f => {
      if (f.freelancerId === freelancerId) {
        return {
          ...f,
          amount: newAmount,
          percentage: (newAmount / milestoneAmount) * 100
        };
      }
      return f;
    });
    setSelectedFreelancers(updated);
  };

  // Calculate total and remaining amount
  const totalDistributed = selectedFreelancers.reduce((sum, f) => sum + f.amount, 0);
  const remainingAmount = milestoneAmount - totalDistributed;
  const isValidDistribution = Math.abs(remainingAmount) < 0.01; // Allow small rounding differences

  // Handle payment submission
  const handlePayment = async () => {
    if (!isValidDistribution) {
      showErrorToast(`Total amount must equal $${milestoneAmount.toFixed(2)}. Current total: $${totalDistributed.toFixed(2)}`);
      return;
    }

    if (selectedFreelancers.length === 0) {
      showErrorToast('Please select at least one freelancer');
      return;
    }

    try {
      setPaymentLoading(true);
      
              // Create single payment session for all freelancers
        const paymentData = {
          clientId: clientId,
          projectId: projectId,
          paymentType: 'Milestone',
          milestoneId: milestone.Id || milestone.id,
          timesheetId: null,
          totalAmount: milestoneAmount,
          freelancerPayments: selectedFreelancers.map(distribution => ({
            freelancerId: distribution.freelancerId,
            freelancerName: distribution.freelancerName,
            amount: distribution.amount
          }))
        };

        // Debug logging
        console.log('Sending multi-freelancer payment data:', paymentData);
        console.log('Selected freelancers:', selectedFreelancers);

      // Call new API for multi-freelancer payment
      const { url } = await createMultiFreelancerCheckoutSession(paymentData);
      
      if (url) {
        window.location.href = url;
      } else {
        showErrorToast('Failed to create payment session');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Payment error:', error);
      showErrorToast(error.message || 'Failed to process payment');
    } finally {
      setPaymentLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white p-6 rounded-lg">
          <div className="text-center">Loading freelancers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="max-w-2xl w-full mx-auto bg-white p-8 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Multi-Freelancer Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        </div>

        {/* Milestone Info */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{milestone.Title || milestone.title}</h3>
              <p className="text-gray-600 text-sm">{milestone.Description || milestone.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                ${milestoneAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
          </div>
        </Card>

        {/* Distribution Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Payment Distribution</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="equal"
                checked={distributionType === 'equal'}
                onChange={(e) => setDistributionType(e.target.value as 'equal' | 'custom')}
                className="mr-2"
              />
              <span className="text-sm">Equal Split</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="custom"
                checked={distributionType === 'custom'}
                onChange={(e) => setDistributionType(e.target.value as 'equal' | 'custom')}
                className="mr-2"
              />
              <span className="text-sm">Custom Amounts</span>
            </label>
          </div>
        </div>

        {/* Freelancer List */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-700">Assigned Freelancers</span>
          </div>
          
          {freelancers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No freelancers assigned to this milestone
            </div>
          ) : (
            <div className="space-y-3">
              {selectedFreelancers.map((distribution) => (
                <div key={distribution.freelancerId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{distribution.freelancerName}</div>
                    <div className="text-sm text-gray-500">
                      {distribution.percentage.toFixed(1)}% of total
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">$</span>
                    {distributionType === 'custom' ? (
                      <input
                        type="number"
                        value={distribution.amount.toFixed(2)}
                        onChange={(e) => handleAmountChange(distribution.freelancerId, parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        step="0.01"
                        min="0"
                        max={milestoneAmount}
                      />
                    ) : (
                      <span className="font-medium">${distribution.amount.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total Summary */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isValidDistribution ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">Total Distributed</span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${isValidDistribution ? 'text-green-600' : 'text-red-600'}`}>
                ${totalDistributed.toFixed(2)}
              </div>
              {!isValidDistribution && (
                <div className="text-sm text-red-600">
                  Remaining: ${remainingAmount.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={paymentLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={!isValidDistribution || selectedFreelancers.length === 0 || paymentLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {paymentLoading ? 'Processing...' : `Pay $${milestoneAmount.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}; 