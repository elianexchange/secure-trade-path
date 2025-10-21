import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken, requireBuyer, requireVendor } from '../middleware/auth';
import { OrderStatus, PaymentStatus, ShippingStatus } from '../types';
import { User } from '@prisma/client';

const router = Router();

// Calculate escrow fee (2% of order total)
const calculateEscrowFee = (totalAmount: number): number => {
  return Math.round(totalAmount * 0.02 * 100) / 100;
};

// Generate unique order number
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `TZ-${timestamp}-${random}`.toUpperCase();
};

// Get all orders (filtered by user role)
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      status, 
      paymentStatus, 
      shippingStatus, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause based on user role
    let where: any = {};
    
    if (userRole === 'BUYER') {
      where.buyerId = userId;
    } else if (userRole === 'VENDOR') {
      where.vendorId = userId;
    }
    // Admin can see all orders

    if (status) where.status = status as OrderStatus;
    if (paymentStatus) where.paymentStatus = paymentStatus as PaymentStatus;
    if (shippingStatus) where.shippingStatus = shippingStatus as ShippingStatus;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          item: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              vendor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          },
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.order.count({ where })
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            images: true,
            condition: true,
            vendor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user has access to this order
    if (userRole !== 'ADMIN' && order.buyerId !== userId && order.vendorId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Create new order (buyer only)
router.post('/', authenticateToken, requireBuyer, async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId, quantity, shippingAddress } = req.body;
    const buyerId = req.user!.id;

    // Validation
    if (!itemId || !quantity || !shippingAddress) {
      res.status(400).json({
        success: false,
        error: 'Item ID, quantity, and shipping address are required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (quantity <= 0) {
      res.status(400).json({
        success: false,
        error: 'Quantity must be greater than 0',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if item exists and is available
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Item not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (item.status !== 'ACTIVE') {
      res.status(400).json({
        success: false,
        error: 'Item is not available for purchase',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (item.vendorId === buyerId) {
      res.status(400).json({
        success: false,
        error: 'You cannot purchase your own item',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Calculate totals
    const unitPrice = item.price;
    const totalAmount = unitPrice * quantity;
    const escrowFee = calculateEscrowFee(totalAmount);
    const orderTotal = totalAmount + escrowFee;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        buyerId,
        vendorId: item.vendorId,
        itemId,
        quantity,
        unitPrice,
        totalAmount,
        escrowFee,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        shippingStatus: 'PENDING'
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true
          }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    // Create initial transaction record
    await prisma.transaction.create({
      data: {
        orderId: order.id,
        userId: buyerId,
        type: 'ESCROW_HOLD',
        amount: orderTotal,
        currency: 'NGN',
        status: 'PENDING',
        metadata: JSON.stringify({
          orderNumber: order.orderNumber,
          itemName: item.name,
          quantity,
          shippingAddress
        })
      }
    });

    // Create notification for vendor
    await prisma.notification.create({
      data: {
        userId: item.vendorId,
        orderId: order.id,
        type: 'ORDER_UPDATE',
        title: 'New Order Received',
        message: `You have received a new order for ${item.name} (${order.orderNumber})`,
        priority: 'HIGH'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        orderTotal,
        paymentRequired: orderTotal
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Update order status (vendor or admin)
router.put('/:id/status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check permissions
    if (userRole !== 'ADMIN' && order.vendorId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Only the vendor can update order status',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['SHIPPED', 'CANCELLED'],
      'IN_ESCROW': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED', 'RETURNED'],
      'DELIVERED': ['COMPLETED', 'DISPUTED'],
      'COMPLETED': [],
      'CANCELLED': [],
      'DISPUTED': ['RESOLVED']
    };

    if (!validTransitions[order.status].includes(status)) {
      res.status(400).json({
        success: false,
        error: `Invalid status transition from ${order.status} to ${status}`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: status as OrderStatus,
        ...(status === 'SHIPPED' && { shippedAt: new Date(), shippingStatus: 'SHIPPED' }),
        ...(status === 'DELIVERED' && { deliveredAt: new Date(), shippingStatus: 'DELIVERED' }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...(status === 'CANCELLED' && { cancelledAt: new Date() })
      }
    });

    // Create notification for buyer
    await prisma.notification.create({
      data: {
        userId: order.buyerId,
        orderId: order.id,
        type: 'ORDER_UPDATE',
        title: 'Order Status Updated',
        message: `Your order ${order.orderNumber} status has been updated to ${status}`,
        priority: 'MEDIUM'
      }
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Process payment (buyer)
router.post('/:id/pay', authenticateToken, requireBuyer, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentReference } = req.body;
    const buyerId = req.user!.id;

    // Check if order exists and belongs to buyer
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (order.buyerId !== buyerId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (order.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        error: 'Order is not in pending status',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (order.paymentStatus === 'PAID') {
      res.status(400).json({
        success: false,
        error: 'Order is already paid',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Calculate total amount
    const orderTotal = order.totalAmount + order.escrowFee;

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paidAt: new Date()
      }
    });

    // Update transaction status
    await prisma.transaction.updateMany({
      where: { orderId: id, type: 'ESCROW_HOLD' },
      data: {
        status: 'COMPLETED',
        reference: paymentReference
      }
    });

    // Create escrow hold transaction
    await prisma.transaction.create({
      data: {
        orderId: id,
        userId: buyerId,
        type: 'ESCROW_HOLD',
        amount: orderTotal,
        currency: 'NGN',
        status: 'COMPLETED',
        reference: paymentReference,
        metadata: JSON.stringify({
          paymentMethod,
          orderNumber: order.orderNumber
        })
      }
    });

    // Create notification for vendor
    await prisma.notification.create({
      data: {
        userId: order.vendorId,
        orderId: order.id,
        type: 'PAYMENT',
        title: 'Payment Received',
        message: `Payment received for order ${order.orderNumber}. You can now ship the item.`,
        priority: 'HIGH'
      }
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: updatedOrder,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Release escrow funds (buyer confirms delivery)
router.post('/:id/release-escrow', authenticateToken, requireBuyer, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const buyerId = req.user!.id;

    // Check if order exists and belongs to buyer
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (order.buyerId !== buyerId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (order.status !== 'DELIVERED') {
      res.status(400).json({
        success: false,
        error: 'Order must be delivered before releasing escrow',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Create escrow release transaction
    await prisma.transaction.create({
      data: {
        orderId: id,
        userId: order.vendorId,
        type: 'ESCROW_RELEASE',
        amount: order.totalAmount,
        currency: 'NGN',
        status: 'COMPLETED',
        metadata: JSON.stringify({
          orderNumber: order.orderNumber,
          releasedBy: buyerId
        })
      }
    });

    // Create fee transaction
    await prisma.transaction.create({
      data: {
        orderId: id,
        userId: order.vendorId,
        type: 'FEE',
        amount: order.escrowFee,
        currency: 'NGN',
        status: 'COMPLETED',
        metadata: JSON.stringify({
          orderNumber: order.orderNumber,
          feeType: 'ESCROW_FEE'
        })
      }
    });

    // Create notification for vendor
    await prisma.notification.create({
      data: {
        userId: order.vendorId,
        orderId: order.id,
        type: 'PAYMENT',
        title: 'Escrow Released',
        message: `Escrow funds have been released for order ${order.orderNumber}`,
        priority: 'HIGH'
      }
    });

    res.json({
      success: true,
      message: 'Escrow funds released successfully',
      data: updatedOrder,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Release escrow error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
