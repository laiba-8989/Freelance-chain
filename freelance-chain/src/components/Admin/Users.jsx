// import React, { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import axios from 'axios';
// import { toast } from 'react-hot-toast';
// import { useWeb3 } from '../../context/Web3Context';

// const Users = () => {
//   const [page, setPage] = useState(1);
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [roleFilter, setRoleFilter] = useState('all');
//   const queryClient = useQueryClient();
//   const { account } = useWeb3();

//   // Color scheme for consistent styling
//   const colors = {
//     primary: "#6D9773",
//     secondary: "#0C3B2E",
//     accent: "#BB8A52",
//     highlight: "#FFBA00",
//   };

//   const { data, isLoading, error } = useQuery({
//     queryKey: ['adminUsers', page, statusFilter, roleFilter],
//     queryFn: async () => {
//       const token = localStorage.getItem('authToken');
//       if (!token || !account) {
//         throw new Error('Authentication required');
//       }

//       const response = await axios.get(`http://localhost:5000/api/admin/users`, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         params: {
//           page,
//           limit: 10,
//           status: statusFilter !== 'all' ? statusFilter : undefined,
//           role: roleFilter !== 'all' ? roleFilter : undefined,
//           walletAddress: account
//         }
//       });
//       return response.data.data;
//     }
//   });

//   const updateStatusMutation = useMutation({
//     mutationFn: async ({ userId, status }) => {
//       const token = localStorage.getItem('authToken');
//       if (!token || !account) {
//         throw new Error('Authentication required');
//       }

//       const response = await axios.patch(
//         `http://localhost:5000/api/admin/users/${userId}/status`,
//         { status },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           },
//           params: {
//             walletAddress: account
//           }
//         }
//       );
//       return response.data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries(['adminUsers']);
//       toast.success('User status updated successfully');
//     },
//     onError: (error) => {
//       toast.error(error.response?.data?.message || 'Failed to update user status');
//     }
//   });

//   const handleStatusChange = (userId, newStatus) => {
//     updateStatusMutation.mutate({ userId, status: newStatus });
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
//         <p className="text-red-600">Error loading users</p>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
//         <div className="flex space-x-4">
//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//           >
//             <option value="all">All Status</option>
//             <option value="active">Active</option>
//             <option value="inactive">Inactive</option>
//             <option value="banned">Banned</option>
//           </select>
//           <select
//             value={roleFilter}
//             onChange={(e) => setRoleFilter(e.target.value)}
//             className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//           >
//             <option value="all">All Roles</option>
//             <option value="client">Client</option>
//             <option value="freelancer">Freelancer</option>
//           </select>
//         </div>
//       </div>

//       <div className="bg-white shadow rounded-lg overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 User
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Role
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Status
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Wallet Address
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {data?.users.map((user) => (
//               <tr key={user._id}>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0 h-12 w-12">
//                       {user.profileImage ? (
//                         <img
//                           src={`http://localhost:5000${user.profileImage}`}
//                           alt={user.name || 'User'}
//                           className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
//                         />
//                       ) : (
//                         <div 
//                           className="h-12 w-12 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
//                           style={{ backgroundColor: colors.accent + '30' }}
//                         >
//                           <span 
//                             className="text-lg font-bold"
//                             style={{ color: colors.accent }}
//                           >
//                             {(user.name || 'U').charAt(0).toUpperCase()}
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                     <div className="ml-4">
//                       <div className="text-sm font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
//                       {/* <div className="text-sm text-gray-500">{user.email || 'No email provided'}</div> */}
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                     user.role === 'client' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
//                   }`}>
//                     {user.role}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                     user.status === 'active' ? 'bg-green-100 text-green-800' :
//                     user.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
//                     'bg-red-100 text-red-800'
//                   }`}>
//                     {user.status}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                   {user.walletAddress}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                   <select
//                     value={user.status}
//                     onChange={(e) => handleStatusChange(user._id, e.target.value)}
//                     className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   >
//                     <option value="active">Active</option>
//                     <option value="inactive">Inactive</option>
//                     <option value="banned">Banned</option>
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
//           Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data?.total)} of {data?.total} results
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
//             disabled={page * 10 >= data?.total}
//             className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Users; 
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useWeb3 } from '../../context/Web3Context';
import { Link } from 'react-router-dom';

const Users = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const queryClient = useQueryClient();
  const { account } = useWeb3();

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminUsers', page, statusFilter, roleFilter],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      if (!token || !account) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`http://localhost:5000/api/admin/users`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        params: {
          page,
          limit: 10,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          walletAddress: account
        }
      });
      return response.data.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }) => {
      const token = localStorage.getItem('authToken');
      if (!token || !account) {
        throw new Error('Authentication required');
      }

      const response = await axios.patch(
        `http://localhost:5000/api/admin/users/${userId}/status`,
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success('User status updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  });

  const handleStatusChange = (userId, newStatus) => {
    updateStatusMutation.mutate({ userId, status: newStatus });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'status') setStatusFilter(value);
    if (name === 'role') setRoleFilter(value);
    setPage(1);
  };

  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#0C3B2E]">Wallet Connection Required</h2>
          <p className="mt-2 text-gray-600">
            Please connect your wallet to access the admin panel
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6D9773]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="mt-2 text-gray-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-bold text-[#0C3B2E]">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage all platform users and their permissions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            name="status"
            value={statusFilter}
            onChange={handleFilterChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6D9773] focus:ring-[#6D9773] sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>
          <select
            name="role"
            value={roleFilter}
            onChange={handleFilterChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6D9773] focus:ring-[#6D9773] sm:text-sm"
          >
            <option value="all">All Roles</option>
            <option value="client">Client</option>
            <option value="freelancer">Freelancer</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#0C3B2E]">
              <tr>
                {['User', 'Role', 'Status', 'Wallet Address', 'Actions'].map((header) => (
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
              {data?.users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.profileImage ? (
                          <img
                            src={`http://localhost:5000${user.profileImage}`}
                            alt={user.name || 'User'}
                            className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-[#6D9773] flex items-center justify-center border-2 border-white shadow-sm">
                            <span className="text-lg font-bold text-white">
                              {(user.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                        {/* <div className="text-sm text-gray-500">{user.email || 'No email provided'}</div> */}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-4 ${
                      user.role === 'client' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-4 ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {user.walletAddress}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user._id, e.target.value)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-[#6D9773] focus:ring-[#6D9773] text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="banned">Banned</option>
                    </select>
                    <Link
                      to={`/admin/users/${user._id}`}
                      className="ml-2 text-[#0C3B2E] hover:text-[#BB8A52] transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data?.total > 10 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{((page - 1) * 10) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * 10, data.total)}</span> of{' '}
              <span className="font-medium">{data.total}</span> results
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded-md border ${page === 1 ? 'border-gray-200 text-gray-400' : 'border-[#0C3B2E] text-[#0C3B2E] hover:bg-[#0C3B2E] hover:text-white'} transition-colors`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 10 >= data?.total}
              className={`px-3 py-1 rounded-md border ${page * 10 >= data?.total ? 'border-gray-200 text-gray-400' : 'border-[#0C3B2E] text-[#0C3B2E] hover:bg-[#0C3B2E] hover:text-white'} transition-colors`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;