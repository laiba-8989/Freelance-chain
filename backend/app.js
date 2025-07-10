// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
// require('dotenv').config();
// const path = require('path');
// const http = require('http');
// const Web3 = require('web3');
// const { initializeSocket } = require('./socket');
// const bidRoutes = require('./routes/bidRoutes');
// const contractRoutes = require('./routes/contractRoutes');
// const workRoutes = require('./routes/workRoutes');
// const ipfsRoutes = require('./routes/ipfsRoutes');
// const notificationRoutes = require('./routes/notificationRoutes');
// const fs = require('fs');

// // Set NODE_ENV to production if not set (for Railway deployment)
// if (!process.env.NODE_ENV) {
//   process.env.NODE_ENV = 'production';
// }

// const app = express();
// const server = http.createServer(app);

// // Log environment variables for debugging (without sensitive data)
// console.log('Environment Configuration:');
// console.log('- NODE_ENV:', process.env.NODE_ENV);
// console.log('- PORT:', process.env.PORT);
// console.log('- MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
// console.log('- VANGUARD_RPC_URL:', process.env.VANGUARD_RPC_URL || 'Using default');
// console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Using default');

// // Create uploads directory if it doesn't exist
// const uploadsDir = path.join(__dirname, 'uploads');
// const bidsDir = path.join(uploadsDir, 'bids');

// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }
// if (!fs.existsSync(bidsDir)) {
//   fs.mkdirSync(bidsDir, { recursive: true });
// }

// // Initialize Web3 with Vanguard Network
// const vanguardRpcUrl = process.env.VANGUARD_RPC_URL || 'https://rpc-vanguard.vanarchain.com';
// const web3 = new Web3(new Web3.providers.HttpProvider(vanguardRpcUrl));

// // Test Web3 connection
// web3.eth.net.isListening()
//   .then(() => {
//     console.log('✅ Web3 connected successfully to Vanguard network');
//     return web3.eth.net.getId();
//   })
//   .then((networkId) => {
//     console.log(`🌐 Connected to network ID: ${networkId}`);
//     if (networkId !== 78600) {
//       console.warn(`⚠️  Warning: Expected network ID 78600 (Vanguard), but got ${networkId}`);
//     }
//   })
//   .catch((error) => {
//     console.error('❌ Web3 connection failed:', error.message);
//     console.log('⚠️  Continuing without blockchain functionality...');
//   });

// // Middleware
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // Add CORS debugging middleware
// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   console.log(`🌐 CORS Request from: ${origin}`);
//   console.log(`📋 Request method: ${req.method}`);
//   console.log(`🔗 Request path: ${req.path}`);
//   next();
// });

// app.use(cors({
//     origin: function (origin, callback) {
//         // Allow requests with no origin (like mobile apps or curl requests)
//         if (!origin) return callback(null, true);
        
//         const allowedOrigins = [
//             process.env.FRONTEND_URL || 'http://localhost:5173',
//             'https://freelance-chain-m6q032ov0-laibas-projects-e61b3139.vercel.app',
//             'https://freelance-chain-git-kashaf-laibas-projects-e61b3139.vercel.app',
//             'https://freelance-chain.vercel.app'
//         ];
        
//         // Check if origin is in allowed list or matches Vercel pattern
//         const isAllowed = allowedOrigins.includes(origin) || 
//                          /^https:\/\/freelance-chain.*\.vercel\.app$/.test(origin);
        
//         console.log(`🔍 CORS check for ${origin}: ${isAllowed ? '✅ Allowed' : '❌ Blocked'}`);
        
//         if (isAllowed) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-admin-wallet'],
//     exposedHeaders: ['Content-Range', 'X-Content-Range']
// }));

// // Make Web3 available to routes
// app.use((req, res, next) => {
//     req.web3 = web3;
//     next();
// });

// // Static files
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// // Add request logging middleware
// // Request logging middleware for debugging
// app.use((req, res, next) => {
//     console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//     next();
// });

// // Static files - Serve uploads directory with proper headers
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
//   setHeaders: (res, filePath) => {
//     // Set proper content type based on file extension
//     const ext = path.extname(filePath).toLowerCase();
//     const contentTypes = {
//       '.pdf': 'application/pdf',
//       '.doc': 'application/msword',
//       '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       '.jpg': 'image/jpeg',
//       '.jpeg': 'image/jpeg',
//       '.png': 'image/png',
//       '.gif': 'image/gif',
//       '.mp4': 'video/mp4'
//     };
    
//     if (contentTypes[ext]) {
//       res.set('Content-Type', contentTypes[ext]);
//     }
    
//     // Allow cross-origin requests for files
//     res.set('Access-Control-Allow-Origin', '*');
//     res.set('Cross-Origin-Resource-Policy', 'cross-origin');
//   }
// }));

// // Database connection
// mongoose.connect(process.env.MONGO_URI, {
//     retryWrites: true,
//     w: 'majority'
// })
// .then(() => console.log('MongoDB connected successfully'))
// .catch(err => console.error('MongoDB connection error:', err));

// // Health check endpoint
// app.get('/health', (req, res) => {
//     res.status(200).json({
//         status: 'healthy',
//         blockchain: web3.isConnected() ? 'connected' : 'disconnected',
//         db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
//     });
// });

// // Routes
// app.use('/auth', require('./routes/auth'));
// app.use('/jobs', require('./routes/jobs'));
// app.use('/projects', require('./routes/projects'));
// app.use('/messages', require('./routes/message'));
// app.use('/users', require('./routes/users'));
// app.use('/conversations', require('./routes/conversation'));
// app.use('/profile', require('./routes/profile'));
// app.use('/bids', bidRoutes);
// app.use('/contracts', contractRoutes);
// app.use('/work', workRoutes);
// app.use('/saved-jobs', require('./routes/savedJobs'));
// app.use('/api/ipfs', ipfsRoutes);
// app.use('/notifications', notificationRoutes);

// // Admin routes - Mount at /api/admin
// app.use('/api/admin', require('./routes/adminRoutes'));

// // API route not found handler
// app.use('/api/*', (req, res) => {
//     res.status(404).json({
//         success: false,
//         error: 'API endpoint not found'
//     });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error('Error:', err);
//     console.error('Stack:', err.stack);
    
//     // Handle specific errors
//     if (err.name === 'ValidationError') {
//         return res.status(400).json({
//             success: false,
//             error: err.message
//         });
//     }
    
//     if (err.name === 'UnauthorizedError') {
//         return res.status(401).json({
//             success: false,
//             error: 'Unauthorized access'
//         });
//     }
    
//     // Default error
//     res.status(500).json({
//         success: false,
//         error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
//     });
// });

// // Initialize Socket.IO
// const io = initializeSocket(server);

// // Make io accessible to routes
// app.set('io', io);

// // Server startup
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//     console.log('🚀 Server started successfully!');
//     console.log(`📍 Server running on port ${PORT}`);
//     console.log(`🔗 Blockchain RPC: ${vanguardRpcUrl}`);
//     console.log(`🌍 Allowed origins: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
//     console.log(`📊 Health check: http://localhost:${PORT}/health`);
// });

// // Handle shutdown gracefully
// process.on('SIGINT', () => {
//     console.log('Shutting down gracefully...');
//     server.close(() => {
//         mongoose.connection.close(false, () => {
//             console.log('Server and MongoDB connection closed');
//             process.exit(0);
//         });
//     });
// });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');
const http = require('http');
const Web3 = require('web3');
const { initializeSocket } = require('./socket');
const bidRoutes = require('./routes/bidRoutes');
const contractRoutes = require('./routes/contractRoutes');
const workRoutes = require('./routes/workRoutes');
const ipfsRoutes = require('./routes/ipfsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const fs = require('fs');

// Set NODE_ENV to production if not set (for Railway deployment)
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const app = express();
const server = http.createServer(app);

// Log environment variables for debugging (without sensitive data)
console.log('Environment Configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
console.log('- VANGUARD_RPC_URL:', process.env.VANGUARD_RPC_URL || 'Using default');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Using default');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const bidsDir = path.join(uploadsDir, 'bids');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(bidsDir)) {
  fs.mkdirSync(bidsDir, { recursive: true });
}

// Initialize Web3 with Vanguard Network
const vanguardRpcUrl = process.env.VANGUARD_RPC_URL || 'https://rpc-vanguard.vanarchain.com';
const web3 = new Web3(new Web3.providers.HttpProvider(vanguardRpcUrl));

// Test Web3 connection
web3.eth.net.isListening()
  .then(() => {
    console.log('✅ Web3 connected successfully to Vanguard network');
    return web3.eth.net.getId();
  })
  .then((networkId) => {
    console.log(`🌐 Connected to network ID: ${networkId}`);
    if (networkId !== 78600) {
      console.warn(`⚠️  Warning: Expected network ID 78600 (Vanguard), but got ${networkId}`);
    }
  })
  .catch((error) => {
    console.error('❌ Web3 connection failed:', error.message);
    console.log('⚠️  Continuing without blockchain functionality...');
  });

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add CORS debugging middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`🌐 CORS Request from: ${origin}`);
  console.log(`📋 Request method: ${req.method}`);
  console.log(`🔗 Request path: ${req.path}`);
  next();
});

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:5173',
            'https://freelance-chain-m6q032ov0-laibas-projects-e61b3139.vercel.app',
            'https://freelance-chain-git-kashaf-laibas-projects-e61b3139.vercel.app',
            'https://freelance-chain.vercel.app'
        ];
        
        // Check if origin is in allowed list or matches Vercel pattern
        const isAllowed = allowedOrigins.includes(origin) || 
                         /^https:\/\/freelance-chain.*\.vercel\.app$/.test(origin);
        
        console.log(`🔍 CORS check for ${origin}: ${isAllowed ? '✅ Allowed' : '❌ Blocked'}`);
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-admin-wallet'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Make Web3 available to routes
app.use((req, res, next) => {
    req.web3 = web3;
    next();
});

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Static files - Serve uploads directory with proper headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set proper content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4'
    };
    
    if (contentTypes[ext]) {
      res.set('Content-Type', contentTypes[ext]);
    }
    
    // Allow cross-origin requests for files
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  }
}));

// Add a specific route for handling image requests with better error handling
app.get('/uploads/*', (req, res, next) => {
  const filePath = path.join(__dirname, req.path);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Set CORS headers for image requests
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  
  next();
});

// Database connection
mongoose.connect(process.env.MONGO_URI, {
    retryWrites: true,
    w: 'majority'
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        blockchain: web3.isConnected() ? 'connected' : 'disconnected',
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/jobs', require('./routes/jobs'));
app.use('/projects', require('./routes/projects'));
app.use('/messages', require('./routes/message'));
app.use('/users', require('./routes/users'));
app.use('/conversations', require('./routes/conversation'));
app.use('/profile', require('./routes/profile'));
app.use('/bids', bidRoutes);
app.use('/contracts', contractRoutes);
app.use('/work', workRoutes);
app.use('/saved-jobs', require('./routes/savedJobs'));
app.use('/api/ipfs', ipfsRoutes);
app.use('/notifications', notificationRoutes);

// Admin routes - Mount at /api/admin
app.use('/api/admin', require('./routes/adminRoutes'));

// API route not found handler
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    
    // Handle specific errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized access'
        });
    }
    
    // Default error
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io accessible to routes
app.set('io', io);

// Server startup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log('🚀 Server started successfully!');
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🔗 Blockchain RPC: ${vanguardRpcUrl}`);
    console.log(`🌍 Allowed origins: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('Server and MongoDB connection closed');
            process.exit(0);
        });
    });
});
