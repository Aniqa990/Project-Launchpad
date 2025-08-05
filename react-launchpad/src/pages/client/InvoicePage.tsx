import React, { useState, useEffect } from 'react';
import { getProjectFreelancers } from '../../apiendpoints';
import toast from 'react-hot-toast';

export const InvoicePage = ({ invoiceData, onPayNow, onClose }: { invoiceData: any, onPayNow: (data: any) => void, onClose?: () => void }) => {
  console.log('InvoicePage rendered with invoiceData:', invoiceData);
  
  //Allow editing of user details
  const [userDetails, setUserDetails] = useState({
    name: invoiceData.name || '',
    email: invoiceData.email || '',
    address: invoiceData.address || '',
  });

  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<number | null>(invoiceData.selectedFreelancerId || null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  //Fetch freelancers for the project
  useEffect(() => {
    const fetchFreelancers = async () => {
      if (invoiceData.milestoneFreelancers && Array.isArray(invoiceData.milestoneFreelancers) && invoiceData.milestoneFreelancers.length > 0) {
        // Normalize freelancer IDs to 'id' for consistency
        const normalized = invoiceData.milestoneFreelancers.map((f: any) => ({
          ...f,
          id: f.id || f.FreelancerId || f.Id
        }));
        setFreelancers(normalized);
        // Auto-select first freelancer if none selected
        if (!selectedFreelancerId && normalized.length === 1) {
          setSelectedFreelancerId(normalized[0].id);
        }
        return;
      }
      if (invoiceData.projectId) {
        try {
          setLoading(true);
          const data = await getProjectFreelancers(invoiceData.projectId);
          setFreelancers(data);
          // Auto-select first freelancer if none selected
          if (!selectedFreelancerId && data.length > 0) {
            setSelectedFreelancerId(data[0].id);
          }
        } catch (err) {
          toast.error('Failed to fetch freelancers');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchFreelancers();
  }, [invoiceData.projectId, invoiceData.milestoneFreelancers, selectedFreelancerId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="max-w-2xl w-full mx-auto bg-white p-8 rounded shadow relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl">&times;</button>
        )}
        <h2 className="text-2xl font-bold mb-4">
          {invoiceData.paymentType === 'Fixed' ? 'Fixed Project Payment' : 'Milestone Payment'} - Invoice
        </h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input name="name" value={userDetails.name} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input name="email" value={userDetails.email} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input name="address" value={userDetails.address} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        
        {/* Freelancer Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Freelancer</label>
          {loading ? (
            <div className="text-sm text-gray-500">Loading freelancers...</div>
          ) : freelancers.length > 0 ? (
            <select
              value={selectedFreelancerId || ''}
              onChange={(e) => setSelectedFreelancerId(Number(e.target.value))}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a freelancer</option>
              {freelancers.map((freelancer) => (
                <option key={freelancer.id} value={freelancer.id}>
                  {freelancer.FirstName || freelancer.firstName} {freelancer.LastName || freelancer.lastName} - ${freelancer.HourlyRate || freelancer.hourlyRate || 0}/hr
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-gray-500">No freelancers found for this project</div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2">
            {invoiceData.paymentType === 'Fixed' ? 'Project Details' : 'Milestone Details'}
          </h3>
          {invoiceData.paymentType === 'Fixed' ? (
            <>
              <div className="flex justify-between">
                <span>Project:</span>
                <span>{invoiceData.milestoneTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>${invoiceData.amount}</span>
              </div>
            </>
          ) : (
            <>
          <div className="flex justify-between">
            <span>Milestone:</span>
            <span>{invoiceData.milestoneTitle}</span>
          </div>
          <div className="flex justify-between">
            <span>Project:</span>
            <span>{invoiceData.projectTitle}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span>${invoiceData.amount}</span>
          </div>
            </>
          )}
        </div>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={() => {
            if (!selectedFreelancerId) {
              toast.error('Please select a freelancer');
              return;
            }
            onPayNow({ 
              ...invoiceData, 
              ...userDetails, 
              selectedFreelancerId 
            });
          }}
          disabled={!selectedFreelancerId}
        >
          Continue
        </button>
      </div>
    </div>
  );
} 