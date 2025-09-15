import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken, requireVendor, requireAdmin } from '../middleware/auth';
import { ItemCondition, ItemStatus } from '../types';

const router = Router();

// Get all items (public, but can be filtered by user)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      query, 
      category, 
      minPrice, 
      maxPrice, 
      condition, 
      vendorId, 
      page = 1, 
      limit = 20 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    // Build where clause
    const where: any = {
      status: 'ACTIVE'
    };

    if (query) {
      where.OR = [
        { name: { contains: query as string, mode: 'insensitive' } },
        { description: { contains: query as string, mode: 'insensitive' } }
      ];
    }

    if (category) where.category = category as string;
    if (condition) where.condition = condition as ItemCondition;
    if (vendorId) where.vendorId = vendorId as string;
    if (minPrice) where.price = { gte: Number(minPrice) };
    if (maxPrice) {
      where.price = { ...where.price, lte: Number(maxPrice) };
    }

    // Get items with pagination
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.item.count({ where })
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get item by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Item not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: item,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Create new item (vendor only)
router.post('/', authenticateToken, requireVendor, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, category, price, currency, images, condition } = req.body;
    const vendorId = req.user!.id;

    // Validation
    if (!name || !category || !price || !images) {
      res.status(400).json({
        success: false,
        error: 'Name, category, price, and images are required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (price <= 0) {
      res.status(400).json({
        success: false,
        error: 'Price must be greater than 0',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Create item
    const item = await prisma.item.create({
      data: {
        name,
        description,
        category,
        price: Number(price),
        currency: currency || 'NGN',
        images: Array.isArray(images) ? images.join(',') : images,
        condition: condition || 'NEW',
        status: 'ACTIVE',
        vendorId
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Update item (vendor who owns it or admin)
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, category, price, currency, images, condition, status } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Check if item exists and user has permission
    const existingItem = await prisma.item.findUnique({
      where: { id }
    });

    if (!existingItem) {
      res.status(404).json({
        success: false,
        error: 'Item not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check permissions
    if (existingItem.vendorId !== userId && userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'You can only update your own items',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update item
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(price && { price: Number(price) }),
        ...(currency && { currency }),
        ...(images && { images: Array.isArray(images) ? images.join(',') : images }),
        ...(condition && { condition }),
        ...(status && { status })
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Delete item (vendor who owns it or admin)
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Check if item exists and user has permission
    const existingItem = await prisma.item.findUnique({
      where: { id }
    });

    if (!existingItem) {
      res.status(404).json({
        success: false,
        error: 'Item not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check permissions
    if (existingItem.vendorId !== userId && userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'You can only delete your own items',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if item has active orders
    const activeOrders = await prisma.order.findFirst({
      where: {
        itemId: id,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_ESCROW', 'SHIPPED'] }
      }
    });

    if (activeOrders) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete item with active orders',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Delete item
    await prisma.item.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Item deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get vendor's items
router.get('/vendor/my-items', authenticateToken, requireVendor, async (req: Request, res: Response): Promise<void> => {
  try {
    const vendorId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.item.count({ where: { vendorId } })
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get vendor items error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
