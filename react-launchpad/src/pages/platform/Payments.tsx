import React, { useState } from 'react';
import { CheckCircle, Clock, DollarSign, Download, User, Calendar, Upload, FileText, AlertCircle, Send } from 'lucide-react';

interface Milestone {
  id: string;
  name: string;
  status: 'In Progress' | 'Submitted' | 'Client Review' | 'Client Approved' | 'Revision Requested' | 'Completed';
  freelancerId: string;
  clientId: string;
  paymentAmount: number;
  transferStatus: 'Pending' | 'Processing' | 'Completed';
  deliveryTimestamp: string;
  submissionTimestamp?: string;
  clientApprovalTimestamp?: string;
  deliverableFiles: string[];
  submittedFiles?: string[];
  handoverStatus: 'Pending' | 'Completed';
}

const mockMilestones: Milestone[] = [
  {
    id: 'M001',
    name: 'Website Design Mockups',
    status: 'Client Review',
    freelancerId: 'F123',
    clientId: 'C456',
    paymentAmount: 2500,
    transferStatus: 'Pending',
    deliveryTimestamp: '2024-01-15T10:30:00Z',
    submissionTimestamp: '2024-01-15T10:30:00Z',
    deliverableFiles: [],
    submittedFiles: ['mockup-v1.figma', 'assets.zip', 'style-guide.pdf'],
    handoverStatus: 'Pending'
  },
  {
    id: 'M002',
    name: 'Frontend Development',
    status: 'Client Approved',
    freelancerId: 'F789',
    clientId: 'C101',
    paymentAmount: 4500,
    transferStatus: 'Pending',
    deliveryTimestamp: '2024-01-14T14:45:00Z',
    submissionTimestamp: '2024-01-14T14:45:00Z',
    clientApprovalTimestamp: '2024-01-15T09:20:00Z',
    deliverableFiles: [],
    submittedFiles: ['source-code.zip', 'documentation.pdf', 'deployment-guide.md'],
    handoverStatus: 'Pending'
  },
  {
    id: 'M003',
    name: 'Mobile App UI Design',
    status: 'Revision Requested',
    freelancerId: 'F456',
    clientId: 'C789',
    paymentAmount: 3200,
    transferStatus: 'Pending',
    deliveryTimestamp: '2024-01-16T12:00:00Z',
    submissionTimestamp: '2024-01-16T12:00:00Z',
    deliverableFiles: [],
    submittedFiles: ['mobile-ui-designs.sketch', 'prototype-link.txt', 'design-specs.pdf'],
    handoverStatus: 'Pending'
  },
  {
    id: 'M004',
    name: 'E-commerce Backend API',
    status: 'Completed',
    freelancerId: 'F234',
    clientId: 'C567',
    paymentAmount: 5500,
    transferStatus: 'Completed',
    deliveryTimestamp: '2024-01-12T16:00:00Z',
    submissionTimestamp: '2024-01-12T16:00:00Z',
    clientApprovalTimestamp: '2024-01-13T10:15:00Z',
    deliverableFiles: ['api-source.zip', 'database-schema.sql', 'api-docs.pdf', 'deployment-guide.md'],
    submittedFiles: ['api-source.zip', 'database-schema.sql', 'api-docs.pdf', 'deployment-guide.md'],
    handoverStatus: 'Completed'
  }
];

export function MilestonePayments() {
  const [milestones, setMilestones] = useState<Milestone[]>(mockMilestones);

  const handleReleasePaymentAndHandover = (milestoneId: string) => {
    setMilestones(prev => prev.map(m => 
      m.id === milestoneId 
        ? { 
            ...m, 
            status: 'Completed' as const,
            transferStatus: 'Processing' as const,
            deliverableFiles: m.submittedFiles || [],
            handoverStatus: 'Completed' as const
          }
        : m
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Submitted': return 'bg-purple-100 text-purple-800';
      case 'Client Review': return 'bg-yellow-100 text-yellow-800';
      case 'Client Approved': return 'bg-green-100 text-green-800';
      case 'Revision Requested': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
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

  const getTransferStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Milestone Payments</h2>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>1 Client Review</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>1 Client Approved</span>
          </div>
          <div className="flex items-center space-x-1">
            <DollarSign className="w-4 h-4" />
            <span>Total Pending: $10,200</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{milestone.name}</h3>
                <p className="text-sm text-gray-500">ID: {milestone.id}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                  {getStatusIcon(milestone.status)}
                  <span>{milestone.status}</span>
                </span>
                {milestone.transferStatus !== 'Completed' && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTransferStatusColor(milestone.transferStatus)}`}>
                    Payment: {milestone.transferStatus}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Freelancer</p>
                  <p className="text-sm font-medium">{milestone.freelancerId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Client</p>
                  <p className="text-sm font-medium">{milestone.clientId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-sm font-medium">${milestone.paymentAmount}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">
                    {milestone.submissionTimestamp ? 'Submitted' : 'Due'}
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(milestone.submissionTimestamp || milestone.deliveryTimestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Freelancer Submitted Files */}
            {milestone.submittedFiles && milestone.submittedFiles.length > 0 && (
              <div className="mb-4 bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Freelancer Deliverables</span>
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {milestone.submittedFiles.map((file, index) => (
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

            {/* Handed Over Files */}
            {milestone.deliverableFiles && milestone.deliverableFiles.length > 0 && (
              <div className="mb-4 bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-3 flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Files Handed to Client</span>
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {milestone.deliverableFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">{file}</span>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Delivered</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {milestone.submissionTimestamp && (
                  <span>Submitted: {new Date(milestone.submissionTimestamp).toLocaleDateString()}</span>
                )}
                {milestone.clientApprovalTimestamp && (
                  <span>Client Approved: {new Date(milestone.clientApprovalTimestamp).toLocaleDateString()}</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {milestone.status === 'Client Approved' && milestone.transferStatus === 'Pending' && (
                  <button
                    onClick={() => handleReleasePaymentAndHandover(milestone.id)}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Release & Handover</span>
                  </button>
                )}
                
                {milestone.transferStatus === 'Processing' && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}

                {milestone.status === 'Completed' && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}