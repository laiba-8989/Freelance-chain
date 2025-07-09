import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StatusPage = () => {
  const [status, setStatus] = useState({
    frontend: 'Checking...',
    backend: 'Checking...',
    database: 'Checking...',
    blockchain: 'Checking...'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://freelance-chain-production.up.railway.app';
      
      // Check frontend
      setStatus(prev => ({ ...prev, frontend: '✅ Frontend is running' }));

      // Check backend
      try {
        const response = await axios.get(`${apiUrl}/health`);
        setStatus(prev => ({ 
          ...prev, 
          backend: '✅ Backend is running',
          database: response.data.db === 'connected' ? '✅ Database connected' : '❌ Database disconnected',
          blockchain: response.data.blockchain === 'connected' ? '✅ Blockchain connected' : '❌ Blockchain disconnected'
        }));
      } catch (error) {
        setStatus(prev => ({ 
          ...prev, 
          backend: `❌ Backend error: ${error.message}`,
          database: '❌ Cannot check database',
          blockchain: '❌ Cannot check blockchain'
        }));
      }

      setLoading(false);
    };

    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          System Status
        </h1>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium">Frontend</span>
            <span className={status.frontend.includes('✅') ? 'text-green-600' : 'text-red-600'}>
              {status.frontend}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium">Backend</span>
            <span className={status.backend.includes('✅') ? 'text-green-600' : 'text-red-600'}>
              {status.backend}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium">Database</span>
            <span className={status.database.includes('✅') ? 'text-green-600' : 'text-red-600'}>
              {status.database}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium">Blockchain</span>
            <span className={status.blockchain.includes('✅') ? 'text-green-600' : 'text-red-600'}>
              {status.blockchain}
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-4">
            API URL: {import.meta.env.VITE_API_URL || 'https://freelance-chain-production.up.railway.app'}
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusPage; 
