const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Client = require('../models/Client');
const Freelancer = require('../models/Freelancer');
const auth = require('../middleware/auth');
const { ADMIN_WALLET_ADDRESSES } = require('../middleware/adminAuth');
const crypto = require('crypto');
const Web3 = require('web3');
const router = express.Router();

// Initialize Web3 with Vanguard network
const web3 = new Web3('https://rpc-vanguard.vanarchain.com');

// Generate a random nonce
const generateNonce = () => crypto.randomBytes(16).toString('hex');

// Helper function to check if a wallet is an admin
const isAdminWallet = (walletAddress) => {
    if (!walletAddress) return false;
    
    // Debug logging
    console.log('🔍 Checking admin wallet:', {
        walletAddress,
        ADMIN_WALLET_ADDRESSES: ADMIN_WALLET_ADDRESSES,
        isArray: Array.isArray(ADMIN_WALLET_ADDRESSES),
        length: ADMIN_WALLET_ADDRESSES?.length
    });
    
    // Ensure ADMIN_WALLET_ADDRESSES is an array
    if (!Array.isArray(ADMIN_WALLET_ADDRESSES)) {
        console.error('❌ ADMIN_WALLET_ADDRESSES is not an array:', ADMIN_WALLET_ADDRESSES);
        return false;
    }
    
    return ADMIN_WALLET_ADDRESSES.some(adminAddress => {
        // Ensure adminAddress is a string before calling toLowerCase
        if (typeof adminAddress !== 'string') {
            console.error('❌ Invalid admin address (not a string):', adminAddress);
            return false;
        }
        return adminAddress.toLowerCase() === walletAddress.toLowerCase();
    });
};

// MetaMask Login: Step 1 - Request Nonce
router.post('/metamask/request', async (req, res) => {
    console.log('🔐 MetaMask request received:', req.body);
    
    const { walletAddress } = req.body;

    if (!walletAddress) {
        console.log('❌ No wallet address provided');
        return res.status(400).json({ message: 'Wallet address required' });
    }

    try {
        const normalizedAddress = walletAddress.toLowerCase();
        console.log('🔍 Looking up user with address:', normalizedAddress);
        
        let user = await User.findOne({ walletAddress: normalizedAddress });

        // If the user does not exist, create a new entry
        if (!user) {
            console.log('👤 Creating new user for address:', normalizedAddress);
            user = new User({ 
                walletAddress: normalizedAddress,
                nonce: generateNonce(),
                // Set role to admin if it's an admin wallet
                role: isAdminWallet(normalizedAddress) ? 'admin' : undefined
            });
            await user.save();
            console.log('✅ New user created with role:', user.role);
        } else {
            console.log('👤 Updating existing user:', user._id);
            // Update the nonce for security
            user.nonce = generateNonce();
            await user.save();
            console.log('✅ Nonce updated for existing user');
        }

        console.log('🎯 Nonce generated for:', normalizedAddress, user.nonce);
        res.status(200).json({ nonce: user.nonce });
    } catch (error) {
        console.error('❌ Error in /metamask/request:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// MetaMask Login: Step 2 - Verify Signature
router.post('/metamask/verify', async (req, res) => {
    console.log('=== MetaMask Verification Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);

    const { walletAddress, signature, isAdmin } = req.body;

    // Validate request body
    if (!walletAddress || !signature) {
        console.log('Validation failed:', {
            hasWalletAddress: !!walletAddress,
            hasSignature: !!signature
        });
        return res.status(400).json({ 
            success: false,
            error: 'Missing required fields',
            details: {
                walletAddress: !walletAddress ? 'Wallet address is required' : undefined,
                signature: !signature ? 'Signature is required' : undefined
            }
        });
    }

    try {
        const normalizedAddress = walletAddress.toLowerCase();
        console.log('Looking up user with wallet:', normalizedAddress);
        let user = await User.findOne({ walletAddress: normalizedAddress });
        
        if (!user) {
            console.log('User not found in database');
            return res.status(400).json({ 
                success: false,
                error: 'Wallet not registered',
                details: 'No user found with this wallet address'
            });
        }

        console.log('Found user:', {
            id: user._id,
            walletAddress: user.walletAddress,
            hasNonce: !!user.nonce,
            role: user.role
        });

        if (!user.nonce) {
            console.log('User has no nonce');
            return res.status(400).json({ 
                success: false,
                error: 'Invalid nonce',
                details: 'User has no nonce associated with their account'
            });
        }

        const message = `Nonce: ${user.nonce}`;
        console.log('Verifying message:', message);

        try {
            const recoveredAddress = web3.eth.accounts.recover(message, signature);
            console.log('Recovery results:', {
                recoveredAddress,
                expectedAddress: normalizedAddress,
                match: recoveredAddress.toLowerCase() === normalizedAddress
            });

            if (recoveredAddress.toLowerCase() !== normalizedAddress) {
                console.log('Signature verification failed');
                return res.status(401).json({ 
                    success: false,
                    error: 'Invalid signature',
                    details: 'The signature does not match the expected wallet address'
                });
            }
        } catch (recoveryError) {
            console.error('Error recovering address:', recoveryError);
            return res.status(400).json({
                success: false,
                error: 'Signature recovery failed',
                details: recoveryError.message
            });
        }

        // Check if this is an admin login attempt
        if (isAdmin && isAdminWallet(normalizedAddress)) {
            // Update user role to admin if not already
            if (user.role !== 'admin') {
                user.role = 'admin';
                await user.save();
            }
        }

        // Generate JWT token with more detailed payload
        const tokenPayload = {
            userId: user._id,
            walletAddress: user.walletAddress,
            role: user.role,
            timestamp: Date.now()
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { 
            expiresIn: '7d',
            algorithm: 'HS256'
        });

        console.log('Verification successful, generating response');
        // Return token and user data
        res.status(200).json({
            success: true,
            message: 'MetaMask login successful',
            token,
            user: {
                _id: user._id,
                walletAddress: user.walletAddress,
                role: user.role,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Error in /metamask/verify:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error',
            details: error.message
        });
    }
});

// Add a route to verify token validity
router.get('/verify-token', auth, async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json({
            success: true,
            message: 'Token is valid',
            user: {
                _id: user._id,
                walletAddress: user.walletAddress,
                role: user.role,
                name: user.name,
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Token is not valid',
            error: error.message
        });
    }
});

// Check if a wallet address is already registered
router.post('/check-wallet', async (req, res) => {
    const { walletAddress } = req.body;
  
    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }
  
    try {
      const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
      res.status(200).json({ exists: !!user });
    } catch (error) {
      console.error('Check wallet error', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Register a new user
  router.post('/register', async (req, res) => {
    const { walletAddress, password } = req.body;
  
    if (!walletAddress || !password) {
      return res.status(400).json({ message: 'Wallet address and password are required' });
    }
  
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      // Check if the wallet address is already registered
      const existingUser = await User.findOne({ walletAddress: normalizedAddress });
      if (existingUser) {
        return res.status(400).json({ message: 'Wallet address is already registered' });
      }
  
      // Create a new user
      console.log('Attempting to create new user with walletAddress:', normalizedAddress);
      const user = new User({
        walletAddress: normalizedAddress,
        password, // In a real app, hash the password before saving
        nonce: generateNonce(), // Generate a nonce for MetaMask login
      });
  
      await user.save();
      console.log('User successfully saved with ID:', user._id);
  
      // Generate JWT token
      const token = jwt.sign({ userId: user._id, walletAddress }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
      // Return token and user data
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          _id: user._id,
          walletAddress: user.walletAddress,
          role: user.role,
          name: user.name,
        },
      });
    } catch (error) {
      console.error('Registration error', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Role Selection
router.post('/select-role', async (req, res) => {
    const { userId, role, name, extraData } = req.body;

    try {
        console.log('Attempting to select role for user ID:', userId, 'Role:', role);
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found for role selection:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        user.name = name;
        await user.save();
        console.log('User role and name updated for user ID:', user._id);

        if (role === 'client') {
            console.log('Creating Client profile for user ID:', user._id, 'Company:', extraData.company);
            const clientProfile = await Client.create({ userId: user._id, company: extraData.company });
            console.log('Client profile created with ID:', clientProfile._id);
        } else if (role === 'freelancer') {
            console.log('Creating Freelancer profile for user ID:', user._id, 'Skills:', extraData.skills, 'Experience:', extraData.experience);
            const freelancerProfile = await Freelancer.create({
              userId: user._id,
              skills: extraData.skills,
              experience: extraData.experience,
            });
            console.log('Freelancer profile created with ID:', freelancerProfile._id);
        }

        res.status(200).json({ message: 'Role assigned successfully', user });
    } catch (error) {
        console.error('Role selection error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get current users 
router.get('/current-user', auth, (req, res) => {
    res.json(req.user); // The `auth` middleware adds `req.user`
});

// Admin login endpoint
router.post('/admin/login', async (req, res) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        // Normalize wallet address
        const normalizedAddress = walletAddress.toLowerCase();

        // Find user with admin role
        const user = await User.findOne({
            walletAddress: normalizedAddress,
            role: 'admin'
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied: Invalid admin wallet address or insufficient permissions'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                walletAddress: user.walletAddress,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                walletAddress: user.walletAddress,
                role: user.role,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during admin login'
        });
    }
});

module.exports = router;
