import React, { useState } from 'react';
import { useDisputes, useResolveDispute } from '../../hooks/useDisputeApi';
import { useWeb3 } from '../../context/Web3Context';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';

const Disputes = () => {
  const { account } = useWeb3();
  const { data: disputes = [], isLoading, error, refetch } = useDisputes();
  const resolveDispute = useResolveDispute();
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [clientShare, setClientShare] = useState(50);
  const [freelancerShare, setFreelancerShare] = useState(50);
  const [adminNote, setAdminNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const queryClient = useQueryClient();

  const calculateAmounts = () => {
    if (!selectedDispute?.bidAmount) return { clientAmount: '0', freelancerAmount: '0' };

    try {
      // Convert bid amount to smallest unit (VG has 18 decimals like ETH)
      const bidAmountWei = ethers.utils.parseUnits(selectedDispute.bidAmount.toString(), 18);
      
      // Calculate platform fee (5%)
      const platformFeeWei = bidAmountWei.mul(500).div(10000); // 5% = 500 basis points
      
      // Calculate remaining amount after platform fee
      const remainingAmountWei = bidAmountWei.sub(platformFeeWei);
      
      // Calculate client and freelancer shares
      const clientAmountWei = remainingAmountWei.mul(clientShare).div(10000);
      const freelancerAmountWei = remainingAmountWei.sub(clientAmountWei);
      
      // Convert back to VG for display
      return {
        clientAmount: ethers.utils.formatUnits(clientAmountWei, 18),
        freelancerAmount: ethers.utils.formatUnits(freelancerAmountWei, 18)
      };
    } catch (error) {
      console.error('Error calculating amounts:', error);
      return { clientAmount: '0', freelancerAmount: '0' };
    }
  };

  const handleResolveDispute = async (dispute) => {
    try {
      if (!dispute || !dispute.contractId) {
        toast.error('Invalid dispute data');
        return;
      }

      if (!account) {
        toast.error('Please connect your wallet first');
        return;
      }

      const adminWallet = localStorage.getItem('adminWalletAddress');
      const verifiedAdmin = localStorage.getItem('verifiedAdmin');

      if (!adminWallet || verifiedAdmin !== 'true') {
        toast.error('Admin verification required');
        return;
      }

      const normalizedAccount = account.toLowerCase();
      const normalizedStoredWallet = adminWallet.toLowerCase();

      if (normalizedStoredWallet !== normalizedAccount) {
        toast.error('Connected wallet does not match admin wallet');
        return;
      }

      // Validate shares
      if (clientShare < 0 || clientShare > 100 || freelancerShare < 0 || freelancerShare > 100) {
        toast.error('Shares must be between 0 and 100');
        return;
      }

      if (clientShare + freelancerShare !== 100) {
        toast.error('Shares must total 100%');
        return;
      }

      if (!adminNote || adminNote.trim() === '') {
        toast.error('Please provide a resolution note');
        return;
      }

      // Convert percentages to basis points
      const clientShareBasisPoints = Math.round(clientShare * 100);
      const freelancerShareBasisPoints = Math.round(freelancerShare * 100);

      console.log('Resolving dispute:', {
        contractId: dispute.contractId,
        clientShare: clientShareBasisPoints,
        freelancerShare: freelancerShareBasisPoints,
        adminNote,
        adminWallet: normalizedStoredWallet
      });

      await resolveDispute.mutateAsync({
        contractId: parseInt(dispute.contractId),
        clientShare: clientShareBasisPoints,
        freelancerShare: freelancerShareBasisPoints,
        adminNote
      });

      // Add a delay to allow backend to process state update
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second delay

      setSelectedDispute(null);
      setClientShare(50);
      setFreelancerShare(50);
      setAdminNote('');
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error(error.message || 'Failed to resolve dispute');
    }
  };

  const handleSelectDispute = (dispute) => {
    setSelectedDispute(dispute);
    // Reset shares to default 50-50
    setClientShare(50);
    setFreelancerShare(50);
    setAdminNote('');
  };

  const handleShareChange = (e, type) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) return;

    if (type === 'client') {
      setClientShare(value);
      setFreelancerShare(100 - value);
    } else {
      setFreelancerShare(value);
      setClientShare(100 - value);
    }
  };

  const amounts = calculateAmounts();

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
      <h1 className="text-2xl font-bold mb-6">Dispute Resolution</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Disputes List */}
        <div className="bg-white rounded-lg shadow p-6 col-span-1">
          <h2 className="text-xl font-semibold mb-4">Active Disputes</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {disputes.length > 0 ? (
              disputes.map(dispute => (
                <div
                  key={dispute._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedDispute?._id === dispute._id 
                      ? 'border-green-500 bg-green-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectDispute(dispute)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Contract #{dispute.contractId}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-semibold">Client:</span> {dispute.client?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Freelancer:</span> {dispute.freelancer?.name || 'Unknown'}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      Disputed
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Amount:</span> {dispute.amount} ETH
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Reason:</span> {dispute.rejectionReason || 'No reason provided'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No active disputes found</p>
              </div>
            )}
          </div>
        </div>

        {/* Contract Details */}
        <div className="bg-white rounded-lg shadow p-6 col-span-1">
          <h2 className="text-xl font-semibold mb-4">Contract Details</h2>
          {selectedDispute ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">{selectedDispute.job?.title || 'No title'}</h3>
                <p className="text-gray-600 text-sm mt-1">{selectedDispute.job?.description || 'No description'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Client</p>
                  <p>{selectedDispute.client?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedDispute.client?.walletAddress || 'No address'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Freelancer</p>
                  <p>{selectedDispute.freelancer?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedDispute.freelancer?.walletAddress || 'No address'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Amount</p>
                  <p>{selectedDispute.amount} ETH</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Deadline</p>
                  <p>{new Date(selectedDispute.deadline).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-600">Dispute Reason</p>
                <p className="bg-red-50 p-2 rounded text-red-800">{selectedDispute.rejectionReason || 'No reason provided'}</p>
              </div>
              
              {selectedDispute.workHash && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Submitted Work</p>
                  <a 
                    href={`https://ipfs.io/ipfs/${selectedDispute.workHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    View on IPFS
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a dispute to view details</p>
            </div>
          )}
        </div>

        {/* Resolution Form */}
        <div className="bg-white rounded-lg shadow p-6 col-span-1">
          <h2 className="text-xl font-semibold mb-4">Resolve Dispute</h2>
          {selectedDispute ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium mb-2">Contract Amount</h3>
                <p className="text-lg font-semibold text-green-600">
                  {amounts.totalAmount} VANRY
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Share (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={clientShare}
                  onChange={(e) => handleShareChange(e, 'client')}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="mt-1 text-sm text-gray-600">
                  Amount: {amounts.clientAmount} VANRY
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Freelancer Share (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={freelancerShare}
                  onChange={(e) => handleShareChange(e, 'freelancer')}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="mt-1 text-sm text-gray-600">
                  Amount: {amounts.freelancerAmount} VANRY
                </p>
              </div>

              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <p className="text-sm text-yellow-700">
                  <span className="font-semibold">Total Share:</span> {clientShare + freelancerShare}%
                </p>
                <p className="text-sm text-yellow-700">
                  <span className="font-semibold">Total Amount:</span> {amounts.totalAmount} VANRY
                </p>
                {clientShare + freelancerShare !== 100 && (
                  <p className="text-sm text-red-500 mt-1">Shares must total exactly 100%</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Note
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="4"
                  placeholder="Enter resolution details..."
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={() => handleResolveDispute(selectedDispute)}
                  disabled={isResolving || clientShare + freelancerShare !== 100}
                  className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                    isResolving || clientShare + freelancerShare !== 100
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isResolving ? 'Resolving...' : 'Resolve Dispute'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a dispute to resolve</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Disputes; 