import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:5000/api';

const getRequestConfig = (method = 'get', data = null) => {
  const config = {
    method,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  return config;
};

export const useDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDisputes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/disputes`, getRequestConfig());

      if (response.data.success) {
        setDisputes(response.data.data.disputes);
      } else {
        setError(response.data.message || 'Failed to fetch disputes');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching disputes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  return {
    data: disputes,
    isLoading,
    error,
    refetch: fetchDisputes
  };
};

export const useDisputeDetails = (contractId) => {
  return useQuery({
    queryKey: ['adminDisputeDetails', contractId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/admin/disputes/${contractId}`,
        getRequestConfig()
      );
      return response.data.data;
    },
    enabled: !!contractId
  });
};

export const useResolveDispute = () => {
  return useMutation({
    mutationFn: async ({ contractId, clientShare, freelancerShare, adminNote }) => {
      try {
        // Get the contract details to get the blockchain contractId
        const contractResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/contracts/${contractId}`,
          getRequestConfig()
        );

        if (!contractResponse.data.success) {
          throw new Error(contractResponse.data.message || 'Failed to fetch contract details');
        }

        const blockchainContractId = contractResponse.data.contract.contractId;
        if (!blockchainContractId) {
          throw new Error('Blockchain contract ID not found');
        }

        // Calculate actual amounts based on escrow balance
        const escrowBalance = contractResponse.data.contract.escrowBalance;
        const clientAmount = (escrowBalance * clientShare) / 100;
        const freelancerAmount = (escrowBalance * freelancerShare) / 100;

        // Resolve the dispute using the blockchain contractId
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/admin/disputes/${contractId}/resolve`,
          { 
            blockchainContractId,
            clientShare: clientAmount, 
            freelancerShare: freelancerAmount, 
            adminNote 
          },
          getRequestConfig('post')
        );

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to resolve dispute');
        }

        return response.data;
      } catch (error) {
        console.error('Resolve dispute error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to resolve dispute');
      }
    },
    onSuccess: () => {
      toast.success('Dispute resolved successfully');
    },
    onError: (error) => {
      console.error('Resolve dispute error:', error);
      toast.error(error.message || 'Failed to resolve dispute');
    }
  });
}; 