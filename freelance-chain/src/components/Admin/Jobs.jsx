// import React, { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import axios from 'axios';
// import { toast } from 'react-hot-toast';
// import { useWeb3 } from '../../context/Web3Context';

// const Jobs = () => {
//   const [page, setPage] = useState(1);
//   const [statusFilter, setStatusFilter] = useState('all');
//   const queryClient = useQueryClient();
//   const { account } = useWeb3();

//   const { data, isLoading, error } = useQuery({
//     queryKey: ['adminJobs', page, statusFilter],
//     queryFn: async () => {
//       try {
//         const token = localStorage.getItem('authToken');
//         if (!token || !account) {
//           throw new Error('Authentication required - no token or account');
//         }

//         const response = await axios.get(`http://localhost:5000/api/admin/jobs`, {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           },
//           params: {
//             page,
//             limit: 10,
//             status: statusFilter !== 'all' ? statusFilter : undefined,
//             walletAddress: account
//           }
//         });
//         return response.data.data;
//       } catch (err) {
//         console.error('API Error:', err.response?.data || err.message);
//         throw err;
//       }
//     }
//   });

//   const updateStatusMutation = useMutation({
//     mutationFn: async ({ jobId, status }) => {
//       try {
//         const token = localStorage.getItem('authToken');
//         if (!token || !account) {
//           throw new Error('Authentication required - no token or account');
//         }

//         const response = await axios.patch(
//           `http://localhost:5000/api/admin/jobs/${jobId}/status`,
//           { status },
//           {
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${token}`
//             },
//             params: {
//               walletAddress: account
//             }
//           }
//         );
//         return response.data;
//       } catch (err) {
//         console.error('Status Update Error:', err.response?.data || err.message);
//         throw err;
//       }
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries(['adminJobs']);
//       toast.success('Job status updated successfully');
//     },
//     onError: (error) => {
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to update job status';
//       toast.error(errorMessage);
//     }
//   });

//   const handleStatusChange = (jobId, newStatus) => {
//     updateStatusMutation.mutate({ jobId, status: newStatus });
//   };

//   if (!account) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <h2 className="text-xl font-semibold text-gray-700">Please connect your wallet</h2>
//           <p className="mt-2 text-gray-500">You need to connect your wallet to access the admin panel</p>
//         </div>
//       </div>
//     );
//   }

//   if (isLoading) {
//     return (
//       <div className="animate-pulse">
//         <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
//         <div className="space-y-4">
//           {[...Array(5)].map((_, i) => (
//             <div key={i} className="h-16 bg-gray-200 rounded"></div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//         <p className="text-red-600">Error loading jobs: {error.message}</p>
//         <p className="text-sm text-red-500 mt-2">
//           Please ensure you are logged in and have admin privileges
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
//         <div className="flex space-x-4">
//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//           >
//             <option value="all">All Status</option>
//             <option value="open">Open</option>
//             <option value="in_progress">In Progress</option>
//             <option value="completed">Completed</option>
//             <option value="cancelled">Cancelled</option>
//           </select>
//         </div>
//       </div>

//       <div className="bg-white shadow rounded-lg overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Job Details
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Client
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Budget
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Status
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {data?.jobs?.map((job) => (
//               <tr key={job._id}>
//                 <td className="px-6 py-4">
//                   <div className="text-sm font-medium text-gray-900">{job.title}</div>
//                   <div className="text-sm text-gray-500">{job.description?.substring(0, 100)}...</div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0 h-10 w-10">
//                       <img
//                         src={job.clientId?.profileImage || 'https://ui-avatars.com/api/?name=User&background=random'}
//                         alt={job.clientId?.name || 'Client'}
//                         className="w-10 h-10 rounded-full object-cover"
//                       />
//                     </div>
//                     <div className="ml-4">
//                       <div className="text-sm font-medium text-gray-900">{job.clientId?.name || 'Unknown'}</div>
//                       <div className="text-sm text-gray-500">{job.clientId?.walletAddress || 'No wallet address'}</div>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm text-gray-900">{job.budget} ETH</div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                     job.status === 'open' ? 'bg-green-100 text-green-800' :
//                     job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
//                     job.status === 'completed' ? 'bg-purple-100 text-purple-800' :
//                     'bg-red-100 text-red-800'
//                   }`}>
//                     {job.status?.replace('_', ' ')}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                   <select
//                     value={job.status}
//                     onChange={(e) => handleStatusChange(job._id, e.target.value)}
//                     className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   >
//                     <option value="open">Open</option>
//                     <option value="in_progress">In Progress</option>
//                     <option value="completed">Completed</option>
//                     <option value="cancelled">Cancelled</option>
//                   </select>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       <div className="flex justify-between items-center mt-4">
//         <div className="text-sm text-gray-700">
//           Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data?.total || 0)} of {data?.total || 0} results
//         </div>
//         <div className="flex space-x-2">
//           <button
//             onClick={() => setPage(p => Math.max(1, p - 1))}
//             disabled={page === 1}
//             className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50"
//           >
//             Previous
//           </button>
//           <button
//             onClick={() => setPage(p => p + 1)}
//             disabled={page * 10 >= (data?.total || 0)}
//             className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Jobs; 

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useWeb3 } from '../../context/Web3Context';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const Jobs = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const { account } = useWeb3();

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminJobs', page, statusFilter],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token || !account) {
          throw new Error('Authentication required - no token or account');
        }

        const response = await axios.get(`http://localhost:5000/api/admin/jobs`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          params: {
            page,
            limit: 10,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            walletAddress: account
          }
        });
        return response.data.data;
      } catch (err) {
        console.error('API Error:', err.response?.data || err.message);
        throw err;
      }
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }) => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token || !account) {
          throw new Error('Authentication required - no token or account');
        }

        const response = await axios.patch(
          `http://localhost:5000/api/admin/jobs/${jobId}/status`,
          { status },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            params: {
              walletAddress: account
            }
          }
        );
        return response.data;
      } catch (err) {
        console.error('Status Update Error:', err.response?.data || err.message);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminJobs']);
      toast.success('Job status updated successfully', {
        style: {
          background: '#6D9773',
          color: '#fff',
        }
      });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update job status';
      toast.error(errorMessage);
    }
  });

  const handleStatusChange = (jobId, newStatus) => {
    updateStatusMutation.mutate({ jobId, status: newStatus });
  };

  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold text-[#0C3B2E]">Please connect your wallet</h2>
          <p className="mt-2 text-gray-600">You need to connect your wallet to access the admin panel</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/5"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 font-medium">Error loading jobs: {error.message}</p>
        <p className="text-sm text-red-500 mt-2">
          Please ensure you are logged in and have admin privileges
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-[#0C3B2E]">Job Management</h1>
        <div className="relative w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#6D9773] focus:border-[#6D9773] sm:text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <ChevronDownIcon className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#0C3B2E]">
              <tr>
                {['Job Details', 'Client', 'Budget', 'Status', 'Actions'].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.jobs?.map((job) => (
                <tr key={job._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-[#0C3B2E]">{job.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-2">{job.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          src={job.clientId?.profileImage || `https://ui-avatars.com/api/?name=${job.clientId?.name || 'User'}&background=BB8A52&color=fff`}
                          alt={job.clientId?.name || 'Client'}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#6D9773]"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-[#0C3B2E]">{job.clientId?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[120px]">
                          {job.clientId?.walletAddress || 'No wallet address'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[#0C3B2E]">{job.budget} ETH</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                      job.status === 'open' ? 'bg-green-100 text-green-800' :
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      job.status === 'completed' ? 'bg-[#6D9773] bg-opacity-20 text-[#0C3B2E]' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {job.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative">
                      <select
                        value={job.status}
                        onChange={(e) => handleStatusChange(job._id, e.target.value)}
                        className="appearance-none block pl-3 pr-8 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#6D9773] focus:border-[#6D9773] text-sm bg-white"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <ChevronDownIcon className="h-4 w-4" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{((page - 1) * 10) + 1}</span> to{' '}
          <span className="font-medium">{Math.min(page * 10, data?.total || 0)}</span> of{' '}
          <span className="font-medium">{data?.total || 0}</span> jobs
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
              page === 1 
                ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'border-[#0C3B2E] text-[#0C3B2E] hover:bg-[#0C3B2E] hover:text-white transition-colors'
            }`}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Previous
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * 10 >= (data?.total || 0)}
            className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
              page * 10 >= (data?.total || 0)
                ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'border-[#0C3B2E] text-[#0C3B2E] hover:bg-[#0C3B2E] hover:text-white transition-colors'
            }`}
          >
            Next
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Jobs;