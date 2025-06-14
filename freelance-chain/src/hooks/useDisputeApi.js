import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useWeb3 } from '../context/Web3Context';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const getRequestConfig = (method = 'get', data = null, isFormData = false) => {
  const token = localStorage.getItem('authToken');
  const adminWallet = localStorage.getItem('adminWalletAddress');

  const config = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
    },
    ...(data && { data })
  };

  // Add admin wallet header if available
  if (adminWallet) {
    config.headers['x-admin-wallet'] = adminWallet.toLowerCase();
  }

  return config;
};

export const useDisputes = () => {
  return useQuery({
    queryKey: ['disputes'],
    queryFn: async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/admin/disputes`,
          getRequestConfig()
        );

        if (!response.data || !response.data.success) {
          throw new Error(response.data?.message || 'Failed to fetch disputes');
        }

        return response.data.disputes || [];
      } catch (error) {
        console.error('Error fetching disputes:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch disputes');
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
};

export const useDisputeDetails = (contractId) => {
  return useQuery({
    queryKey: ['dispute', contractId],
    queryFn: async () => {
      if (!contractId) return null;

      try {
        const response = await axios.get(
          `${API_BASE_URL}/admin/disputes/${contractId}`,
          getRequestConfig()
        );

        if (!response.data || !response.data.success) {
          throw new Error(response.data?.message || 'Failed to fetch dispute details');
        }

        return response.data.dispute;
      } catch (error) {
        console.error('Error fetching dispute details:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch dispute details');
      }
    },
    enabled: !!contractId,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
};

export const useResolveDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractId, clientShare, freelancerShare, adminNote }) => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/admin/disputes/${contractId}/resolve`,
          {
            clientShare,
            freelancerShare,
            adminNote
          },
          getRequestConfig('post')
        );

        if (!response.data || !response.data.success) {
          throw new Error(response.data?.message || 'Failed to resolve dispute');
        }

        return response.data;
      } catch (error) {
        console.error('Error resolving dispute:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to resolve dispute');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['disputes']);
      toast.success('Dispute resolved successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to resolve dispute');
    }
  });
}; 