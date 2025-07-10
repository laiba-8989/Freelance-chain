const { token, user } = verifyResponse.data;

// Save token and user data to localStorage
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(user));
localStorage.setItem('userId', user._id);

if (isAdminWallet) {
    localStorage.setItem('isAdmin', 'true');
    // Verify admin status with backend
    try {
         const API_URL = 'https://freelance-chain-production.up.railway.app';
        const adminResponse = await axios.get(`${API_URL}/api/admin/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            params: {
                walletAddress: walletAddress
            }
        });
    } catch (error) {
        console.error('Error verifying admin status:', error);
    }
} 
