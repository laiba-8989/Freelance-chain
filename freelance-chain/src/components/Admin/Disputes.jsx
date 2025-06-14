import React, { useState } from 'react';
import { useDisputes, useResolveDispute } from '../../hooks/useDisputeApi';
import { useWeb3 } from '../../context/Web3Context';
import { toast } from 'sonner';

const Disputes = () => {
  const { account } = useWeb3();
  const { data: disputes = [], isLoading, error } = useDisputes();
  const resolveDispute = useResolveDispute();
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionForm, setResolutionForm] = useState({
    clientShare: '',
    freelancerShare: '',
    adminNote: ''
  });

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    
    if (!selectedDispute) {
      toast.error('No dispute selected');
      return;
    }

    // Validate shares
    const clientShare = parseFloat(resolutionForm.clientShare);
    const freelancerShare = parseFloat(resolutionForm.freelancerShare);
    
    if (isNaN(clientShare) || isNaN(freelancerShare)) {
      toast.error('Invalid share values');
      return;
    }

    if (clientShare + freelancerShare !== 100) {
      toast.error('Shares must total 100%');
      return;
    }

    try {
      await resolveDispute.mutateAsync({
        contractId: selectedDispute._id,
        clientShare: resolutionForm.clientShare,
        freelancerShare: resolutionForm.freelancerShare,
        adminNote: resolutionForm.adminNote
      });

      // Reset form
      setResolutionForm({
        clientShare: '',
        freelancerShare: '',
        adminNote: ''
      });
      setSelectedDispute(null);
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      toast.error(error.message || 'Failed to resolve dispute');
    }
  };

  const handleSelectDispute = (dispute) => {
    setSelectedDispute(dispute);
    // Pre-fill form with default 50-50 split
    setResolutionForm({
      clientShare: '50',
      freelancerShare: '50',
      adminNote: ''
    });
  };

  const handleShareChange = (e, type) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      return;
    }

    setResolutionForm(prev => ({
      ...prev,
      [type]: value,
      [type === 'clientShare' ? 'freelancerShare' : 'clientShare']: 
        type === 'clientShare' ? (100 - numValue).toString() : (100 - numValue).toString()
    }));
  };

  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Please connect your wallet</h2>
          <p className="mt-2 text-gray-500">You need to connect your wallet to access the admin panel</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading disputes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading disputes</h2>
          <p className="mt-2 text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Disputes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Disputes List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Active Disputes</h2>
          <div className="space-y-4">
            {disputes.length > 0 ? (
              disputes.map(dispute => (
                <div
                  key={dispute._id}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    selectedDispute?._id === dispute._id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleSelectDispute(dispute)}
                >
                  <h3 className="font-medium">Contract #{dispute.contractId}</h3>
                  <p className="text-sm text-gray-600">
                    Client: {dispute.client?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Freelancer: {dispute.freelancer?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: {dispute.amount} ETH
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No active disputes found</p>
            )}
          </div>
        </div>

        {/* Resolution Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Resolve Dispute</h2>
          {selectedDispute ? (
            <form onSubmit={handleResolveDispute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Client Share (%)
                </label>
                <input
                  type="number"
                  value={resolutionForm.clientShare}
                  onChange={(e) => handleShareChange(e, 'clientShare')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  min="0"
                  max="100"
                  step="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Freelancer Share (%)
                </label>
                <input
                  type="number"
                  value={resolutionForm.freelancerShare}
                  onChange={(e) => handleShareChange(e, 'freelancerShare')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  min="0"
                  max="100"
                  step="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Admin Note
                </label>
                <textarea
                  value={resolutionForm.adminNote}
                  onChange={(e) => setResolutionForm(prev => ({ ...prev, adminNote: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  rows="3"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={resolveDispute.isLoading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {resolveDispute.isLoading ? 'Resolving...' : 'Resolve Dispute'}
              </button>
            </form>
          ) : (
            <p className="text-gray-500">Select a dispute to resolve</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Disputes; 