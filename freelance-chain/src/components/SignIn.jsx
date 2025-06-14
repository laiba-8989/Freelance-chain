import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

// Array of admin wallet addresses
const ADMIN_WALLET_ADDRESSES = [
  '0x3Ff804112919805fFB8968ad81dBb23b32e8F3f1',
  '0x1a16d8976a56F7EFcF2C8f861C055badA335fBdc'
];

const SignIn = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleMetaMaskLogin = async () => {
        if (!window.ethereum) {
            setError('Please install MetaMask to use this feature.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Clear any existing session data
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('userId');
            localStorage.removeItem('isAdmin');

            // Check if MetaMask is locked
            let accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) {
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                accounts = await window.ethereum.request({ method: 'eth_accounts' });
            }

            const walletAddress = accounts[0].toLowerCase();

            if (!walletAddress) {
                throw new Error('No wallet address found');
            }

            // Check if this is an admin wallet
            const isAdminWallet = ADMIN_WALLET_ADDRESSES.some(
                adminAddress => adminAddress.toLowerCase() === walletAddress
            );

            console.log('Wallet Address:', walletAddress);
            console.log('Is Admin Wallet:', isAdminWallet);

            // Step 1: Request nonce from the backend
            const nonceResponse = await api.post('/auth/metamask/request', {
                walletAddress: walletAddress
            });

            console.log('Nonce Response:', nonceResponse.data);

            if (nonceResponse.data.nonce) {
                // Sign the nonce
                const message = `Nonce: ${nonceResponse.data.nonce}`;
                console.log('Signing message:', message);

                const signature = await window.ethereum.request({
                    method: 'personal_sign',
                    params: [message, walletAddress],
                });

                console.log('Generated signature:', signature);

                // Verify the signature and get token
                const verifyResponse = await api.post('/auth/metamask/verify', {
                    walletAddress: walletAddress,
                    signature: signature,
                    isAdmin: isAdminWallet
                });

                console.log('Verify Response:', verifyResponse.data);

                const { token, user } = verifyResponse.data;

                // Save token and user data to localStorage
                localStorage.setItem('authToken', token);
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('userId', user._id);

                if (isAdminWallet) {
                    console.log('Admin wallet detected, proceeding with admin verification');
                    localStorage.setItem('isAdmin', 'true');
                    // Verify admin status with backend
                    try {
                        console.log('Making admin verification request with:', {
                            token: token ? 'Token exists' : 'No token',
                            walletAddress: walletAddress
                        });

                        const adminResponse = await api.get('/api/admin/verify', {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'x-admin-wallet': walletAddress.toLowerCase()
                            },
                            params: {
                                walletAddress: walletAddress.toLowerCase()
                            }
                        });

                        console.log('Admin verification response:', adminResponse.data);

                        if (adminResponse.data.success && adminResponse.data.isAdmin) {
                            console.log('Admin verification successful, navigating to dashboard');
                            // Store admin user data
                            localStorage.setItem('adminUser', JSON.stringify(adminResponse.data.user));
                            navigate('/admin/dashboard');
                        } else {
                            console.log('Admin verification failed:', adminResponse.data);
                            localStorage.removeItem('isAdmin');
                            throw new Error(adminResponse.data.message || 'Admin verification failed');
                        }
                    } catch (error) {
                        console.error('Admin verification error:', error);
                        console.error('Error details:', {
                            message: error.message,
                            response: error.response?.data,
                            status: error.response?.status,
                            headers: error.response?.headers
                        });
                        localStorage.removeItem('isAdmin');
                        throw new Error(error.response?.data?.message || 'Failed to verify admin status');
                    }
                } else {
                    localStorage.removeItem('isAdmin');
                    if (!user.role) {
                        navigate('/role-selection');
                    } else {
                        navigate('/');
                    }
                }
            } else {
                // New user, redirect to signup
                navigate('/signup', { state: { walletAddress } });
            }
        } catch (error) {
            console.error('MetaMask login error:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            setError(error.response?.data?.message || error.message || 'MetaMask login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-green-900">Welcome Back</h2>
                    <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div className="mt-6">
                    <button
                        onClick={handleMetaMaskLogin}
                        disabled={loading}
                        className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        {loading ? (
                            'Connecting...'
                        ) : (
                            <>
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                                    alt="MetaMask Logo"
                                    className="w-5 h-5 mr-2"
                                />
                                Login with MetaMask
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link
                            to="/signup"
                            className="font-medium text-green-900 hover:text-green-800"
                        >
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignIn;

// import React, { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import axios from 'axios';

// const SignIn = () => {
//     const [error, setError] = useState('');
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();

//     const handleMetaMaskLogin = async () => {
//         if (!window.ethereum) {
//             setError('Please install MetaMask to use this feature.');
//             return;
//         }

//         setLoading(true);
//         setError('');

//         try {
//             // Check if MetaMask is locked
//             let accounts = await window.ethereum.request({ method: 'eth_accounts' });
//             if (accounts.length === 0) {
//                 // Request account access
//                 await window.ethereum.request({ method: 'eth_requestAccounts' });
//                 accounts = await window.ethereum.request({ method: 'eth_accounts' });
//             }

//             const walletAddress = accounts[0];

//             if (!walletAddress) {
//                 throw new Error('No wallet address found');
//             }

//             console.log('Wallet Address:', walletAddress); // Debug log

//             // Step 1: Request nonce from the backend
//             console.log('Requesting nonce for wallet:', walletAddress);
//             const nonceResponse = await axios.post('http://localhost:5000/auth/metamask/request', {
//                 walletAddress: walletAddress.toLowerCase(),
//             });

//             console.log('Nonce Response:', nonceResponse.data);

//             // Check if user exists by looking for nonce in response
//             if (nonceResponse.data.nonce) {
//                 // User exists, proceed with login
//                 const { nonce } = nonceResponse.data;
//                 console.log('Received nonce:', nonce);

//                 // Step 2: Sign the nonce
//                 const message = `Nonce: ${nonce}`;
//                 console.log('Signing message:', message);

//                 const signature = await window.ethereum.request({
//                     method: 'personal_sign',
//                     params: [message, walletAddress],
//                 });

//                 console.log('Generated signature:', signature);

//                 // Step 3: Verify the signature
//                 console.log('Sending verification request with:', {
//                     walletAddress: walletAddress.toLowerCase(),
//                     signature
//                 });

//                 const verifyResponse = await axios.post('http://localhost:5000/auth/metamask/verify', {
//                     walletAddress: walletAddress.toLowerCase(),
//                     signature: signature,
//                 }, {
//                     headers: {
//                         'Content-Type': 'application/json'
//                     }
//                 });

//                 console.log('Verify Response:', verifyResponse.data);

//                 const { token, user } = verifyResponse.data;

//                 // Save token and user data to localStorage
//                 localStorage.setItem('authToken', token);
//                 localStorage.setItem('token', token);
//                 localStorage.setItem('user', JSON.stringify(user));
//                 localStorage.setItem('userId', user._id);

//                 // Redirect based on user role
//                 if (!user.role) {
//                     navigate('/role-selection');
//                 } else {
//                     navigate('/');
//                 }
//             } else {
//                 // New user, redirect to signup
//                 navigate('/signup', { state: { walletAddress } });
//             }
//         } catch (error) {
//             console.error('MetaMask login error:', error);
//             console.error('Error response:', error.response?.data); // Debug log
//             setError(error.response?.data?.message || 'MetaMask login failed. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6">
//             <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
//                 <div className="text-center">
//                     <h2 className="text-2xl font-bold text-green-900">Welcome Back</h2>
//                     <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
//                 </div>

//                 {error && (
//                     <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
//                         {error}
//                     </div>
//                 )}

//                 <div className="mt-6">
//                     <button
//                         onClick={handleMetaMaskLogin}
//                         disabled={loading}
//                         className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
//                     >
//                         {loading ? (
//                             'Connecting...'
//                         ) : (
//                             <>
//                                 <img
//                                     src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
//                                     alt="MetaMask Logo"
//                                     className="w-5 h-5 mr-2"
//                                 />
//                                 Login with MetaMask
//                             </>
//                         )}
//                     </button>
//                 </div>

//                 <div className="mt-6 text-center">
//                     <p className="text-sm text-gray-600">
//                         Don't have an account?{' '}
//                         <Link
//                             to="/signup"
//                             className="font-medium text-green-900 hover:text-green-800"
//                         >
//                             Sign Up
//                         </Link>
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default SignIn;