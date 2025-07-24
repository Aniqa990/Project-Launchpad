import React, { useState } from 'react';

export function InvoicePage({ invoiceData, onPayNow, onClose }: { invoiceData: any, onPayNow: (data: any) => void, onClose?: () => void }) {
  // Allow editing of user details
  const [userDetails, setUserDetails] = useState({
    name: invoiceData.name || '',
    email: invoiceData.email || '',
    address: invoiceData.address || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="max-w-2xl w-full mx-auto bg-white p-8 rounded shadow relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl">&times;</button>
        )}
        <h2 className="text-2xl font-bold mb-4">Invoice</h2>
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
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2">Milestone Details</h3>
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
        </div>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded w-full"
          onClick={() => onPayNow({ ...invoiceData, ...userDetails })}
        >
          Continue
        </button>
      </div>
    </div>
  );
} 