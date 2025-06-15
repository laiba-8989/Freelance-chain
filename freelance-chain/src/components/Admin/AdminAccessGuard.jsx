import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const AdminAccessGuard = ({ children }) => {
  const navigate = useNavigate();
  const { account, connectWallet, isConnected } = useWeb3();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [account]);

  const checkExistingVerification = () => {
    const verifiedAdmin = localStorage.getItem('verifiedAdmin');
    const adminWalletAddress = localStorage.getItem('adminWalletAddress');
    const authToken = localStorage.getItem('authToken');
    
    console.log('Checking existing verification:', {
      hasAccount: !!account,
      verifiedAdmin,
      adminWalletAddress,
      hasAuthToken: !!authToken
    });

    if (!account || !verifiedAdmin || !adminWalletAddress || !authToken) {
      console.log('Missing verification data');
      return false;
    }

    const normalizedStoredWallet = adminWalletAddress.toLowerCase();
    const normalizedCurrentWallet = account.toLowerCase();

    if (verifiedAdmin === 'true' && normalizedStoredWallet === normalizedCurrentWallet) {
      console.log('Using existing admin verification');
      setIsAdmin(true);
      setIsVerifying(false);
      return true;
    }

    console.log('Clearing invalid verification data');
    localStorage.removeItem('verifiedAdmin');
    localStorage.removeItem('adminWalletAddress');
    return false;
  };

  const handleWalletConnection = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast.error('Failed to connect wallet');
      navigate('/');
    }
  };

  const verifyAdminStatus = async (walletAddress) => {
    try {
      const normalizedWalletAddress = walletAddress.toLowerCase();
      const token = localStorage.getItem('authToken');

      if (!token) {
        console.error('No auth token found');
        toast.error('Please log in first');
        navigate('/login');
        return false;
      }

      console.log('Verifying admin status:', {
        walletAddress: normalizedWalletAddress,
        hasToken: !!token
      });

      // First verify against backend
      const backendResponse = await axios.get(`${API_BASE_URL}/admin/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-admin-wallet': normalizedWalletAddress
        },
        params: {
          walletAddress: normalizedWalletAddress
        }
      });

      console.log('Backend verification response:', backendResponse.data);

      if (!backendResponse.data.isAdmin) {
        console.error('Backend verification failed:', backendResponse.data);
        toast.error('Admin verification failed');
        return false;
      }

      // Then verify against smart contract
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS, 
        CONTRACT_ABI, 
        provider
      );
      
      const contractAdmin = await contract.admin();
      console.log('Contract admin check:', {
        contractAdmin: contractAdmin.toLowerCase(),
        walletAddress: normalizedWalletAddress
      });

      if (contractAdmin.toLowerCase() !== normalizedWalletAddress) {
        console.error('Wallet is not contract admin');
        toast.error('Wallet is not a contract admin');
        return false;
      }

      console.log('Admin verification successful');
      // Store verification data
      localStorage.setItem('verifiedAdmin', 'true');
      localStorage.setItem('adminWalletAddress', normalizedWalletAddress);
      return true;
    } catch (error) {
      console.error('Admin verification error:', error);
      toast.error('Admin verification failed');
      return false;
    }
  };

  const checkAdminAccess = async () => {
    setIsVerifying(true);

    // First check if we have stored verification
    if (checkExistingVerification()) {
      setIsVerifying(false);
      return;
    }

    // If no wallet is connected, prompt connection
    if (!isConnected) {
      await handleWalletConnection();
      return;
    }

    // Verify admin status
    const isVerified = await verifyAdminStatus(account);
   
    if (!isVerified) {
      toast.error('Access denied: Admin privileges required');
      navigate('/');
      return;
    }

    setIsAdmin(true);
    setIsVerifying(false);
  };

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return children;
};

export default AdminAccessGuard;