const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

console.log('🔄 Starting enhanced production server with WebSocket...');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081'
    ],
    credentials: true
  }
});

const PORT = process.env.PORT || 4000;

// Initialize Prisma client
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

console.log('✅ Middleware configured');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    websocketConnections: io.engine.clientsCount
  });
});

console.log('✅ Health endpoint configured');

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error checking auth:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  try {
    console.log('Logout request for user:', req.user.userId);
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

console.log('✅ Authentication routes configured');

// Transaction routes
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Getting transactions for user:', userId);

    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        counterparty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Handle my-transactions route (MUST come before /:id route)
app.get('/api/transactions/my-transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Getting my transactions for user:', userId);

    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        counterparty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      transactions: transactions
    });
  } catch (error) {
    console.error('Error getting my transactions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update delivery details
app.put('/api/transactions/:id/delivery-details', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { deliveryDetails } = req.body;
    
    console.log(`Updating delivery details for transaction: ${id} by user: ${userId}`);
    
    // Verify user has access to this transaction
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id: id,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      }
    });
    
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    
    // Update the transaction with delivery details and change status
    const updatedTransaction = await prisma.escrowTransaction.update({
      where: { id: id },
      data: {
        deliveryDetails: JSON.stringify(deliveryDetails),
        status: 'WAITING_FOR_PAYMENT', // Move to payment after delivery details
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        counterparty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    // Notify both parties via WebSocket
    const transactionRoom = `transaction_${id}`;
    const statusMessage = 'Delivery details have been provided. You can now proceed with payment.';
    
    io.to(transactionRoom).emit('transaction_updated', {
      transactionId: id,
      status: 'WAITING_FOR_PAYMENT',
      message: statusMessage,
      transaction: updatedTransaction
    });
    
    res.json({ success: true, transaction: updatedTransaction });
  } catch (error) {
    console.error('Error updating delivery details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get specific transaction by ID (MUST come after specific routes)
app.get('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    console.log('Getting transaction:', id, 'for user:', userId);

    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id: id,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        counterparty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction: transaction
    });
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});


// Get transaction by invite code (for counterparty to view before joining)
app.get('/api/transactions/invite/:inviteCode', authenticateToken, async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user.userId;
    console.log('Get transaction by invite code:', { inviteCode, userId });

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        error: 'Invite code is required'
      });
    }

    // Look up invitation by invite code first
    const invitation = await prisma.transactionInvitation.findFirst({
      where: {
        inviteCode: inviteCode,
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date() // Not expired
        }
      },
      include: {
        transaction: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            counterparty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found, expired, or already used'
      });
    }

    const transaction = invitation.transaction;

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or invite code is invalid'
      });
    }

    // Check if user is already part of this transaction
    if (transaction.creatorId === userId || transaction.counterpartyId === userId) {
      return res.status(400).json({
        success: false,
        error: 'You are already part of this transaction'
      });
    }

    // Return transaction data for counterparty to view
    res.json({
      success: true,
      invitation: {
        code: inviteCode,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        transaction: {
          ...transaction,
          inviteCode: inviteCode
        }
      }
    });
  } catch (error) {
    console.error('Error getting transaction by invite code:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Join transaction with invite code
app.post('/api/transactions/join', authenticateToken, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.userId;
    console.log('Join transaction attempt:', { inviteCode, userId });

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        error: 'Invite code is required'
      });
    }

    // Look up invitation by invite code first
    const invitation = await prisma.transactionInvitation.findFirst({
      where: {
        inviteCode: inviteCode,
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date() // Not expired
        }
      },
      include: {
        transaction: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            counterparty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found, expired, or already used'
      });
    }

    const transaction = invitation.transaction;

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or invite code is invalid'
      });
    }

    // Check if user is already part of this transaction
    if (transaction.creatorId === userId || transaction.counterpartyId === userId) {
      return res.status(400).json({
        success: false,
        error: 'You are already part of this transaction'
      });
    }

    // Check if transaction already has a counterparty
    if (transaction.counterpartyId) {
      return res.status(400).json({
        success: false,
        error: 'This transaction already has a counterparty'
      });
    }

    // Determine the next status based on transaction configuration
    let nextStatus = 'ACTIVE';
    if (transaction.useCourier) {
      nextStatus = 'WAITING_FOR_DELIVERY_DETAILS'; // Buyer needs to fill shipping details
    } else {
      nextStatus = 'WAITING_FOR_PAYMENT'; // Skip shipping, go directly to payment
    }

    // Determine the counterparty role (opposite of creator role)
    const counterpartyRole = transaction.creatorRole === 'BUYER' ? 'SELLER' : 'BUYER';
    
    // Update transaction to add counterparty and mark invitation as used
    const updatedTransaction = await prisma.escrowTransaction.update({
      where: { id: transaction.id },
      data: {
        counterpartyId: userId,
        counterpartyRole: counterpartyRole, // Set the opposite role of the creator
        status: nextStatus, // Set appropriate status based on transaction configuration
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        counterparty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Mark invitation as used
    await prisma.transactionInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
        usedBy: userId
      }
    });

    // Notify both parties about the transaction update via WebSocket
    const transactionRoom = `transaction_${updatedTransaction.id}`;
    const statusMessage = updatedTransaction.useCourier 
      ? `Transaction is now active - ${counterpartyRole} has joined. ${updatedTransaction.creatorRole} needs to fill shipping details.`
      : `Transaction is now active - ${counterpartyRole} has joined. ${updatedTransaction.creatorRole} can proceed with payment.`;
    
    io.to(transactionRoom).emit('transaction_updated', {
      transactionId: updatedTransaction.id,
      status: updatedTransaction.status,
      counterpartyId: updatedTransaction.counterpartyId,
      message: statusMessage,
      transaction: updatedTransaction // Send the full updated transaction object
    });

    // Notify the creator specifically
    if (updatedTransaction.creatorId !== userId) {
      const creatorMessage = updatedTransaction.useCourier 
        ? `Your transaction is now active - ${counterpartyRole} has joined. Waiting for ${updatedTransaction.creatorRole.toLowerCase()} to fill shipping details.`
        : `Your transaction is now active - ${counterpartyRole} has joined. Waiting for ${updatedTransaction.creatorRole.toLowerCase()} to make payment.`;
        
      io.to(`user_${updatedTransaction.creatorId}`).emit('transaction_updated', {
        transactionId: updatedTransaction.id,
        status: updatedTransaction.status,
        message: creatorMessage,
        transaction: updatedTransaction
      });
    }

    res.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Successfully joined transaction'
    });
  } catch (error) {
    console.error('Error joining transaction:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new transaction
app.post('/api/transactions/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactionData = req.body;
    console.log('Create transaction attempt:', { userId, transactionData });

    // Create transaction in the database
    const newTransaction = await prisma.escrowTransaction.create({
      data: {
        description: transactionData.description || 'New transaction',
        currency: transactionData.currency || 'USD',
        price: transactionData.price || 100,
        fee: transactionData.fee || 5,
        total: (transactionData.price || 100) + (transactionData.fee || 5),
        useCourier: transactionData.useCourier || true,
        status: 'PENDING',
        creatorId: userId,
        creatorRole: transactionData.creatorRole || 'SELLER',
        counterpartyId: null,
        counterpartyRole: transactionData.counterpartyRole || 'BUYER',
        shippingDetails: transactionData.shippingDetails || null,
        deliveryDetails: transactionData.deliveryDetails || null,
        paymentCompleted: false,
        paymentMethod: null,
        paymentReference: null,
        expectedDeliveryTime: transactionData.expectedDeliveryTime || null,
        actualDeliveryTime: null,
        autoReleaseEnabled: transactionData.autoReleaseEnabled || false,
        autoReleaseConditions: transactionData.autoReleaseConditions || null,
        autoReleaseDate: transactionData.autoReleaseDate || null,
        paidAt: null,
        shippedAt: null,
        deliveredAt: null,
        completedAt: null
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        counterparty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Generate invite code and create invitation record
    const inviteCode = 'INV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Create invitation record in database
    const invitation = await prisma.transactionInvitation.create({
      data: {
        transactionId: newTransaction.id,
        inviteCode: inviteCode,
        expiresAt: expiresAt,
        status: 'ACTIVE'
      }
    });

    res.json({
      success: true,
      transaction: newTransaction,
      invitation: {
        code: inviteCode,
        expiresAt: expiresAt.toISOString()
      },
      message: 'Transaction created successfully'
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

console.log('✅ Transaction routes configured');

// Message routes
app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Getting conversations for user:', userId);

    // Get all transactions where user is involved
    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        counterparty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Convert to conversation format
    const conversations = transactions.map(transaction => {
      const isCreator = transaction.creatorId === userId;
      const counterparty = isCreator ? transaction.counterparty : transaction.creator;
      
      return {
        id: `conv_${transaction.id}`,
        transactionId: transaction.id,
        participants: [transaction.creatorId, transaction.counterpartyId],
        lastMessage: transaction.messages[0] || null,
        unreadCount: 0, // TODO: Calculate actual unread count
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        participantDetails: [
          {
            userId: transaction.creator.id,
            name: `${transaction.creator.firstName} ${transaction.creator.lastName}`,
            email: transaction.creator.email
          },
          {
            userId: transaction.counterparty?.id || '',
            name: transaction.counterparty ? `${transaction.counterparty.firstName} ${transaction.counterparty.lastName}` : 'Unknown',
            email: transaction.counterparty?.email || ''
          }
        ]
      };
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.get('/api/messages/transactions/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.userId;
    console.log('Getting messages for transaction:', transactionId, 'user:', userId);

    // Verify user has access to this transaction
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id: transactionId,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or access denied'
      });
    }

    // Get messages for this transaction
    const messages = await prisma.message.findMany({
      where: {
        transactionId: transactionId
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        attachments: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { transactionId, content } = req.body;
    const userId = req.user.userId;
    console.log('Sending message:', { transactionId, content, userId });

    if (!transactionId || !content) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID and content are required'
      });
    }

    // Verify user has access to this transaction
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id: transactionId,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or access denied'
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        transactionId,
        senderId: userId,
        content,
        messageType: 'TEXT',
        isRead: false
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        attachments: true
      }
    });

    // Update transaction updatedAt
    await prisma.escrowTransaction.update({
      where: { id: transactionId },
      data: { updatedAt: new Date() }
    });

    // Emit to WebSocket clients in this transaction room
    io.to(`transaction_${transactionId}`).emit('new_message', {
      transactionId,
      message
    });

    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.put('/api/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    console.log('Marking message as read:', messageId, 'user:', userId);

    // Update message as read
    await prisma.message.updateMany({
      where: {
        id: messageId,
        transactionId: {
          in: await prisma.escrowTransaction.findMany({
            where: {
              OR: [
                { creatorId: userId },
                { counterpartyId: userId }
              ]
            },
            select: { id: true }
          }).then(txs => txs.map(tx => tx.id))
        }
      },
      data: {
        isRead: true
      }
    });

    res.json({ success: true, messageId });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

console.log('✅ Message routes configured');

// Notifications route
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Getting notifications for user:', userId);
    res.json({ success: true, notifications: [] });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

console.log('✅ Notifications route configured');

// WebSocket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    socket.userRole = decoded.role;
    next();
  });
});

// WebSocket event handlers
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id, 'User:', socket.userId, 'Email:', socket.userEmail);
  
  // Handle joining transaction room
  socket.on('join_transaction_room', (data) => {
    const { transactionId } = data;
    socket.join(`transaction_${transactionId}`);
    console.log(`User ${socket.userId} joined transaction room: ${transactionId}`);
    
    // Notify others in the room that user joined
    socket.to(`transaction_${transactionId}`).emit('user_joined', {
      transactionId,
      userId: socket.userId,
      userEmail: socket.userEmail
    });
  });
  
  // Handle leaving transaction room
  socket.on('leave_transaction_room', (data) => {
    const { transactionId } = data;
    socket.leave(`transaction_${transactionId}`);
    console.log(`User ${socket.userId} left transaction room: ${transactionId}`);
    
    // Notify others in the room that user left
    socket.to(`transaction_${transactionId}`).emit('user_left', {
      transactionId,
      userId: socket.userId,
      userEmail: socket.userEmail
    });
  });
  
  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { transactionId } = data;
    socket.to(`transaction_${transactionId}`).emit('typing_start', {
      transactionId,
      userId: socket.userId,
      userEmail: socket.userEmail
    });
  });
  
  socket.on('typing_stop', (data) => {
    const { transactionId } = data;
    socket.to(`transaction_${transactionId}`).emit('typing_stop', {
      transactionId,
      userId: socket.userId,
      userEmail: socket.userEmail
    });
  });
  
  // Handle message read status
  socket.on('message_read', (data) => {
    const { messageId, transactionId } = data;
    socket.to(`transaction_${transactionId}`).emit('message_read', {
      messageId,
      transactionId,
      userId: socket.userId,
      userEmail: socket.userEmail
    });
  });
  
  // Handle online status
  socket.on('user_online', (data) => {
    const { transactionId } = data;
    socket.to(`transaction_${transactionId}`).emit('user_online', {
      transactionId,
      userId: socket.userId,
      userEmail: socket.userEmail
    });
  });
  
  // Handle offline status
  socket.on('user_offline', (data) => {
    const { transactionId } = data;
    socket.to(`transaction_${transactionId}`).emit('user_offline', {
      transactionId,
      userId: socket.userId,
      userEmail: socket.userEmail
    });
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id, 'User:', socket.userId);
  });
});

console.log('✅ WebSocket handlers configured');

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    console.log('🚀 Starting HTTP server on port', PORT);
    server.listen(PORT, () => {
      console.log('✅ ENHANCED PRODUCTION SERVER WITH WEBSOCKET STARTED SUCCESSFULLY');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
      console.log(`💼 Transaction endpoints: http://localhost:${PORT}/api/transactions/`);
      console.log(`💬 Message endpoints: http://localhost:${PORT}/api/messages/`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log('');
      console.log('🎯 Production ready! Features:');
      console.log('   - Real database with Prisma');
      console.log('   - JWT authentication');
      console.log('   - Real-time messaging with WebSocket');
      console.log('   - Transaction management');
      console.log('   - User management');
      console.log('   - Typing indicators');
      console.log('   - Message read status');
      console.log('   - Online/offline status');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

