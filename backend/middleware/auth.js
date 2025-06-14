const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Get token from header
<<<<<<< HEAD
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            console.log('No Authorization header found');
            return res.status(401).json({ 
                success: false,
                message: 'No token, authorization denied',
                error: 'MISSING_TOKEN'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            console.log('No token found in Authorization header');
            return res.status(401).json({ 
                success: false,
                message: 'No token, authorization denied',
                error: 'INVALID_TOKEN_FORMAT'
            });
        }

        console.log('Token received:', token);
        
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded);

            // Find user by id
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                console.log('User not found for ID:', decoded.userId);
                return res.status(401).json({ 
                    success: false,
                    message: 'User not found',
                    error: 'USER_NOT_FOUND'
                });
            }

            // Add user to request object
            req.user = user;
            console.log('Authenticated user:', {
                id: user._id,
                walletAddress: user.walletAddress,
                role: user.role
            });
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return res.status(401).json({ 
                success: false,
                message: 'Token is not valid',
                error: 'INVALID_TOKEN',
                details: jwtError.message
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during authentication',
            error: 'SERVER_ERROR',
            details: error.message
=======
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            console.log('No token provided in request');
            return res.status(401).json({ 
                success: false,
                message: 'No token, authorization denied' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded || !decoded.userId) {
            console.log('Invalid token structure:', decoded);
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token structure' 
            });
        }

        // Find user by id
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            console.log('User not found for ID:', decoded.userId);
            return res.status(401).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Token is not valid',
            error: error.message 
>>>>>>> aebd2924c00248cb59cfd2970a856720df94ff60
        });
    }
};

module.exports = auth;