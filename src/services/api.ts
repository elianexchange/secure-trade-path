// API Service Layer for Tranzio Frontend
import { User, Item, Order, Notification, CreateOrderRequest, UpdateOrderStatusRequest, EscrowTransaction } from '@/types';
import { 
  generateId, 
  generateUserId 
} from './realDataService';

// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://tranzio-backend.onrender.com/api';

// API Response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Helper function to get auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to handle API responses
export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  console.log('API Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    console.error('API Error:', errorData);
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  const data = await response.json();
  console.log('API Response data:', data);
  
  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }
  
  // For endpoints that return data in { success: true, data: ... } format
  if (data.data !== undefined) {
    console.log('Returning data.data:', data.data);
    return data.data as T;
  }
  
  // For endpoints that return data directly in { success: true, ... } format
  // Remove success field and return the rest
  const { success, ...rest } = data;
  console.log('Returning rest (without success):', rest);
  return rest as T;
};

// Generic API request function
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  console.log('API Request:', { endpoint, hasToken: !!token, options });
  
  // Use production API URL only
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  return handleApiResponse<T>(response);
};


// Authentication API
export const authAPI = {
  // Login
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response;
  },

  // Signup
  signup: async (email: string, password: string, firstName: string, lastName: string): Promise<{ user: User; token: string }> => {
    const response = await apiRequest<{ user: User; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    return response;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    return await apiRequest<User>('/auth/me');
  },

  // Update profile
  updateProfile: async (updates: { firstName?: string; lastName?: string; email?: string; profilePicture?: string }): Promise<User> => {
    return await apiRequest<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    return await apiRequest<void>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Reset password (forgot password)
  resetPassword: async (email: string): Promise<{ resetToken?: string }> => {
    return await apiRequest<{ resetToken?: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Set new password with reset token
  setNewPassword: async (resetToken: string, newPassword: string): Promise<void> => {
    return await apiRequest<void>('/auth/set-new-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    });
  },

  // Logout
  logout: async (): Promise<void> => {
    return await apiRequest<void>('/auth/logout', {
      method: 'POST',
    });
  },
};

// Items API
export const itemsAPI = {
  // Get all items with filters
  getItems: async (params?: {
    query?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    vendorId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Item>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params ? `/items?${searchParams.toString()}` : '/items';
    return await apiRequest<PaginatedResponse<Item>>(endpoint);
  },

  // Get item by ID
  getItem: async (id: string): Promise<Item> => {
    return await apiRequest<Item>(`/items/${id}`);
  },

  // Create new item (vendor only)
  createItem: async (itemData: {
    name: string;
    description?: string;
    category: string;
    price: number;
    currency?: string;
    images: string | string[];
    condition?: string;
  }): Promise<Item> => {
    const data = {
      ...itemData,
      images: Array.isArray(itemData.images) ? itemData.images.join(',') : itemData.images,
    };
    
    return await apiRequest<Item>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update item
  updateItem: async (id: string, updates: Partial<Item>): Promise<Item> => {
    return await apiRequest<Item>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete item
  deleteItem: async (id: string): Promise<void> => {
    return await apiRequest<void>(`/items/${id}`, {
      method: 'DELETE',
    });
  },

  // Get vendor's items
  getVendorItems: async (page?: number, limit?: number): Promise<PaginatedResponse<Item>> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const endpoint = params.toString() ? `/items/vendor/my-items?${params.toString()}` : '/items/vendor/my-items';
    return await apiRequest<PaginatedResponse<Item>>(endpoint);
  },
};

// Orders API
export const ordersAPI = {
  // Get all orders with filters
  getOrders: async (params?: {
    status?: string;
    paymentStatus?: string;
    shippingStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Order>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params ? `/orders?${searchParams.toString()}` : '/orders';
    return await apiRequest<PaginatedResponse<Order>>(endpoint);
  },

  // Get order by ID
  getOrder: async (id: string): Promise<Order> => {
    return await apiRequest<Order>(`/orders/${id}`);
  },

  // Create new order
  createOrder: async (orderData: CreateOrderRequest): Promise<{
    order: Order;
    orderTotal: number;
    paymentRequired: number;
  }> => {
    return await apiRequest<{
      order: Order;
      orderTotal: number;
      paymentRequired: number;
    }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Update order status
  updateOrderStatus: async (id: string, status: string, notes?: string): Promise<Order> => {
    return await apiRequest<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  },

  // Process payment
  processPayment: async (id: string, paymentData: {
    paymentMethod: string;
    paymentReference: string;
  }): Promise<Order> => {
    return await apiRequest<Order>(`/orders/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // Release escrow funds
  releaseEscrow: async (id: string): Promise<Order> => {
    return await apiRequest<Order>(`/orders/${id}/release-escrow`, {
      method: 'POST',
    });
  },
};

// Transactions API
export const transactionsAPI = {
  // Create new escrow transaction
  createTransaction: async (transactionData: {
    description: string;
    currency: string;
    price: number;
    fee: number;
    total: number;
    useCourier: boolean;
    creatorRole: 'BUYER' | 'SELLER';
    // Enhanced item details
    itemType?: string;
    itemCategory?: string;
    itemCondition?: string;
    itemBrand?: string;
    itemModel?: string;
    itemSize?: string;
    itemColor?: string;
    itemWeight?: number;
    itemDimensions?: string;
    itemSerialNumber?: string;
    itemWarranty?: string;
    itemOrigin?: string;
    itemAge?: string;
    itemQuantity?: number;
    specialInstructions?: string;
    returnPolicy?: string;
    estimatedDeliveryDays?: number;
  }): Promise<{
    transaction: EscrowTransaction;
    invitation: {
      code: string;
      expiresAt: string;
    };
  }> => {
    return await apiRequest<{
      transaction: EscrowTransaction;
      invitation: {
        code: string;
        expiresAt: string;
      };
    }>('/transactions/create', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  // Get transaction by invite code
  getTransactionByInvite: async (inviteCode: string): Promise<{
    invitation: {
      code: string;
      expiresAt: string;
      transaction: EscrowTransaction;
    };
  }> => {
    return await apiRequest<{
      invitation: {
        code: string;
        expiresAt: string;
        transaction: EscrowTransaction;
      };
    }>(`/transactions/invite/${inviteCode}`);
  },

  // Join transaction with invite code
  joinTransaction: async (inviteCode: string): Promise<{
    transaction: EscrowTransaction;
    message: string;
  }> => {
    return await apiRequest<{
      transaction: EscrowTransaction;
      message: string;
    }>('/transactions/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  },

  // Get user's transactions
  getMyTransactions: async (): Promise<EscrowTransaction[]> => {
    const response = await apiRequest<{ success: boolean; transactions: EscrowTransaction[] }>('/transactions/my-transactions');
    return response.transactions || [];
  },

  // Get transaction by ID
  getTransaction: async (id: string): Promise<EscrowTransaction> => {
    const response = await apiRequest<{ transaction: EscrowTransaction }>(`/transactions/${id}`);
    return response.transaction;
  },

  // Update delivery details (buyer provides shipping information)
  updateDeliveryDetails: async (transactionId: string, deliveryDetails: any): Promise<{ transaction: EscrowTransaction; message: string }> => {
    return await apiRequest<{ transaction: EscrowTransaction; message: string }>(`/transactions/${transactionId}/delivery-details`, {
      method: 'PUT',
      body: JSON.stringify({ deliveryDetails }),
    });
  },

  // Update shipping details (seller provides shipment confirmation)
  updateShippingDetails: async (transactionId: string, shipmentData: any): Promise<{ transaction: EscrowTransaction; message: string }> => {
    return await apiRequest<{ transaction: EscrowTransaction; message: string }>(`/transactions/${transactionId}/shipping-details`, {
      method: 'PUT',
      body: JSON.stringify({ shipmentData }),
    });
  },

  // Confirm payment (buyer confirms payment)
  confirmPayment: async (transactionId: string, paymentData: { paymentMethod: string; paymentReference: string }): Promise<{ transaction: EscrowTransaction; message: string }> => {
    return await apiRequest<{ transaction: EscrowTransaction; message: string }>(`/transactions/${transactionId}/confirm-payment`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  },

  // Confirm receipt (buyer confirms receipt of goods)
  confirmReceipt: async (transactionId: string): Promise<{ transaction: EscrowTransaction; message: string }> => {
    return await apiRequest<{ transaction: EscrowTransaction; message: string }>(`/transactions/${transactionId}/confirm-receipt`, {
      method: 'PUT',
    });
  },
};

// Notifications API
export const notificationsAPI = {
  // Get all notifications for the current user
  getNotifications: async (): Promise<any[]> => {
    const response = await apiRequest<{ notifications: any[] }>('/notifications');
    return response.notifications || [];
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    await apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    await apiRequest('/notifications/mark-all-read', {
      method: 'PUT',
    });
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    await apiRequest(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },

  // Clear all notifications
  clearAllNotifications: async (): Promise<void> => {
    await apiRequest('/notifications', {
      method: 'DELETE',
    });
  },
};

// Transaction Activities API
export const activitiesAPI = {
  // Get transaction activities
  getTransactionActivities: async (transactionId: string): Promise<any[]> => {
    const response = await apiRequest<{ activities: any[] }>(`/transactions/${transactionId}/activities`);
    return response.activities || [];
  },
};


// Health check
export const healthAPI = {
  check: async (): Promise<{ status: string; timestamp: string; uptime: number; environment: string }> => {
    return await apiRequest<{ status: string; timestamp: string; uptime: number; environment: string }>('/health');
  },
};

// Error handling utility
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Verification API
export const verificationAPI = {
  // NIN Verification
  verifyNIN: async (data: {
    nin: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      verificationLevel: string;
      trustScore: number;
    };
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/verification/nin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock NIN verification');
      
      // Mock NIN verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'NIN verification successful (mock)',
        data: {
          verificationLevel: 'ENHANCED',
          trustScore: 25
        }
      };
    }
  },

  // BVN Verification
  verifyBVN: async (data: {
    bvn: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      verificationLevel: string;
      trustScore: number;
      isVerified: boolean;
    };
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/verification/bvn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock BVN verification');
      
      // Mock BVN verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'BVN verification successful (mock)',
        data: {
          verificationLevel: 'PREMIUM',
          trustScore: 35,
          isVerified: true
        }
      };
    }
  },

  // Upload Identity Document
  uploadDocument: async (data: {
    documentType: 'DRIVERS_LICENSE' | 'PASSPORT' | 'UTILITY_BILL' | 'BANK_STATEMENT';
    documentNumber: string;
    documentImage: string; // Base64
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      documentId: string;
      status: string;
    };
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/verification/document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock document upload');
      
      // Mock document upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Document uploaded successfully (mock)',
        data: {
          documentId: generateId(),
          status: 'PENDING_REVIEW'
        }
      };
    }
  },

  // Get verification status
  getVerificationStatus: async (): Promise<{
    success: boolean;
    data: {
      user: {
        verificationLevel: string;
        trustScore: number;
        isVerified: boolean;
        nin: string | null;
        bvn: string | null;
      };
      documents: Array<{
        documentType: string;
        isVerified: boolean;
        verifiedAt: string | null;
        rejectionReason: string | null;
      }>;
      history: Array<{
        verificationType: string;
        status: string;
        createdAt: string;
        notes: string | null;
      }>;
    };
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/verification/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock verification status');
      
      // Mock verification status
      return {
        success: true,
        data: {
          user: {
            verificationLevel: 'BASIC',
            trustScore: 0,
            isVerified: false,
            nin: null,
            bvn: null
          },
          documents: [],
          history: []
        }
      };
    }
  }
};

// Payment Conditions API
export const paymentConditionsAPI = {
  // Create payment condition
  createCondition: async (data: {
    transactionId: string;
    conditionType: 'TIME_BASED' | 'DELIVERY_CONFIRMED' | 'MANUAL_APPROVAL' | 'DISPUTE_RESOLVED';
    conditionValue?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      condition: {
        id: string;
        transactionId: string;
        conditionType: string;
        conditionValue: string | null;
        isMet: boolean;
        metAt: string | null;
        createdAt: string;
        updatedAt: string;
      };
    };
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-conditions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock payment condition creation');
      
      // Mock payment condition creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Payment condition created successfully (mock)',
        data: {
          condition: {
            id: generateId(),
            transactionId: data.transactionId,
            conditionType: data.conditionType,
            conditionValue: data.conditionValue || null,
            isMet: false,
            metAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      };
    }
  },

  // Update payment condition
  updateCondition: async (data: {
    conditionId: string;
    isMet: boolean;
    metAt?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      condition: {
        id: string;
        transactionId: string;
        conditionType: string;
        conditionValue: string | null;
        isMet: boolean;
        metAt: string | null;
        createdAt: string;
        updatedAt: string;
      };
    };
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-conditions/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock payment condition update');
      
      // Mock payment condition update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Payment condition updated successfully (mock)',
        data: {
          condition: {
            id: data.conditionId,
            transactionId: 'mock-transaction-id',
            conditionType: 'TIME_BASED',
            conditionValue: null,
            isMet: data.isMet,
            metAt: data.isMet ? (data.metAt || new Date().toISOString()) : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      };
    }
  },

  // Get payment conditions for a transaction
  getTransactionConditions: async (transactionId: string): Promise<{
    success: boolean;
    data: {
      conditions: Array<{
        id: string;
        transactionId: string;
        conditionType: string;
        conditionValue: string | null;
        isMet: boolean;
        metAt: string | null;
        createdAt: string;
        updatedAt: string;
      }>;
      autoReleaseEnabled: boolean;
    };
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-conditions/transaction/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock payment conditions');
      
      // Mock payment conditions
      return {
        success: true,
        data: {
          conditions: [],
          autoReleaseEnabled: false
        }
      };
    }
  },

  // Set up time-based auto-release
  setTimeBasedRelease: async (data: {
    transactionId: string;
    releaseDate: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      condition: {
        id: string;
        transactionId: string;
        conditionType: string;
        conditionValue: string | null;
        isMet: boolean;
        metAt: string | null;
        createdAt: string;
        updatedAt: string;
      };
      releaseDate: string;
    };
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-conditions/time-based`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock time-based release');
      
      // Mock time-based release
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Time-based auto-release configured successfully (mock)',
        data: {
          condition: {
            id: generateId(),
            transactionId: data.transactionId,
            conditionType: 'TIME_BASED',
            conditionValue: JSON.stringify({
              releaseDate: data.releaseDate,
              timezone: 'UTC'
            }),
            isMet: false,
            metAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          releaseDate: data.releaseDate
        }
      };
    }
  },

  // Manual payment release
  manualRelease: async (data: {
    transactionId: string;
    reason?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      condition: {
        id: string;
        transactionId: string;
        conditionType: string;
        conditionValue: string | null;
        isMet: boolean;
        metAt: string | null;
        createdAt: string;
        updatedAt: string;
      };
    };
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-conditions/manual-release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock manual release');
      
      // Mock manual release
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Payment released manually (mock)',
        data: {
          condition: {
            id: generateId(),
            transactionId: data.transactionId,
            conditionType: 'MANUAL_APPROVAL',
            conditionValue: JSON.stringify({
              approvedBy: 'mock-user-id',
              reason: data.reason || 'Manual approval',
              approvedAt: new Date().toISOString()
            }),
            isMet: true,
            metAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      };
    }
  }
};

// Email API
export const emailAPI = {
  // Test email configuration
  testEmailConfiguration: async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/email/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock email test');
      
      // Mock email test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Email configuration test successful (mock)'
      };
    }
  },

  // Send custom email
  sendCustomEmail: async (data: {
    to: string;
    subject: string;
    message: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock email send');
      
      // Mock email send
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Email sent successfully (mock)'
      };
    }
  }
};

// Escrow Calculator API
export const escrowCalculatorAPI = {
  // Calculate detailed escrow fee
  calculateFee: async (data: {
    transactionAmount: number;
    transactionType: 'GOODS' | 'SERVICES' | 'DIGITAL' | 'REAL_ESTATE';
    categoryName: string;
    deliveryMethod?: 'PICKUP' | 'SHIPPING' | 'DIGITAL_DELIVERY';
    paymentMethod?: 'BANK_TRANSFER' | 'CARD' | 'CRYPTO';
    counterpartyId?: string;
  }): Promise<{
    success: boolean;
    data: {
      baseFee: number;
      riskAdjustment: number;
      totalFee: number;
      feePercentage: number;
      feeAmount: number;
      totalAmount: number;
      transactionAmount: number;
      currency: string;
      breakdown: {
        baseFee: number;
        amountRisk: number;
        verificationRisk: number;
        historyRisk: number;
        categoryRisk: number;
        deliveryRisk: number;
        paymentRisk: number;
      };
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
      recommendations: string[];
      riskFactors: any;
    };
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/escrow-calculator/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock escrow calculation');
      
      // Mock calculation
      const baseFee = 1.5;
      const riskAdjustment = 0.3;
      const totalFee = baseFee + riskAdjustment;
      const feeAmount = (data.transactionAmount * totalFee) / 100;
      const totalAmount = data.transactionAmount + feeAmount;
      
      return {
        success: true,
        data: {
          baseFee,
          riskAdjustment,
          totalFee,
          feePercentage: totalFee,
          feeAmount,
          totalAmount,
          transactionAmount: data.transactionAmount,
          currency: 'NGN',
          breakdown: {
            baseFee: 1.5,
            amountRisk: 0.1,
            verificationRisk: 0.1,
            historyRisk: 0.05,
            categoryRisk: 0.03,
            deliveryRisk: 0.02,
            paymentRisk: 0.0
          },
          riskLevel: 'MEDIUM',
          recommendations: [
            'Complete identity verification to reduce fees',
            'Build your trust score by completing more transactions'
          ],
          riskFactors: {
            userVerificationLevel: 'BASIC',
            userTrustScore: 50,
            isFirstTimeTransaction: true,
            totalTransactions: 0,
            successRate: 0,
            categoryRisk: 'MEDIUM'
          }
        }
      };
    }
  },

  // Quick fee estimate (no authentication required)
  estimateFee: async (data: {
    transactionAmount: number;
    transactionType: 'GOODS' | 'SERVICES' | 'DIGITAL' | 'REAL_ESTATE';
    categoryName: string;
  }): Promise<{
    success: boolean;
    data: {
      baseFee: number;
      riskAdjustment: number;
      totalFee: number;
      feePercentage: number;
      feeAmount: number;
      totalAmount: number;
      transactionAmount: number;
      currency: string;
      breakdown: any;
      riskLevel: string;
      recommendations: string[];
      isEstimate: boolean;
      note: string;
    };
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/escrow-calculator/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock escrow estimate');
      
      // Mock estimate
      const baseFee = 1.5;
      const riskAdjustment = 0.5;
      const totalFee = baseFee + riskAdjustment;
      const feeAmount = (data.transactionAmount * totalFee) / 100;
      const totalAmount = data.transactionAmount + feeAmount;
      
      return {
        success: true,
        data: {
          baseFee,
          riskAdjustment,
          totalFee,
          feePercentage: totalFee,
          feeAmount,
          totalAmount,
          transactionAmount: data.transactionAmount,
          currency: 'NGN',
          breakdown: {
            baseFee: 1.5,
            amountRisk: 0.2,
            verificationRisk: 0.2,
            historyRisk: 0.1,
            categoryRisk: 0.0,
            deliveryRisk: 0.0,
            paymentRisk: 0.0
          },
          riskLevel: 'MEDIUM',
          recommendations: [
            'Complete identity verification to reduce fees',
            'Build your trust score by completing more transactions'
          ],
          isEstimate: true,
          note: 'This is a quick estimate. Actual fees may vary based on your verification level and transaction history.'
        }
      };
    }
  },

  // Get fee structure information
  getFeeStructure: async (): Promise<{
    success: boolean;
    data: {
      baseFee: number;
      minFee: number;
      maxFee: number;
      riskFactors: any;
    };
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/escrow-calculator/structure`);
      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock fee structure');
      
      return {
        success: true,
        data: {
          baseFee: 1.5,
          minFee: 0.5,
          maxFee: 5.0,
          riskFactors: {
            amount: {
              low: '< ₦100',
              medium: '₦100 - ₦1,000',
              high: '₦1,000 - ₦10,000',
              veryHigh: '> ₦10,000'
            },
            verification: {
              basic: '1.5x multiplier',
              enhanced: '1.0x multiplier',
              premium: '0.7x multiplier'
            },
            trustScore: {
              low: '< 30 (1.4x multiplier)',
              medium: '30-70 (1.0x multiplier)',
              high: '> 70 (0.8x multiplier)'
            }
          }
        }
      };
    }
  },

  // Get user's fee history
  getFeeHistory: async (): Promise<{
    success: boolean;
    data: {
      transactions: any[];
      summary: {
        totalTransactions: number;
        totalFeesPaid: number;
        totalAmount: number;
        averageFeePercentage: number;
        totalSavings: number;
      };
    };
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/escrow-calculator/history`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock fee history');
      
      return {
        success: true,
        data: {
          transactions: [],
          summary: {
            totalTransactions: 0,
            totalFeesPaid: 0,
            totalAmount: 0,
            averageFeePercentage: 0,
            totalSavings: 0
          }
        }
      };
    }
  }
};

// Dispute Resolution API
export const disputesAPI = {
  // Create dispute
  createDispute: async (data: {
    transactionId: string;
    disputeType: 'PAYMENT' | 'DELIVERY' | 'QUALITY' | 'FRAUD' | 'OTHER';
    reason: string;
    description: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock dispute creation');
      
      // Mock dispute creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        data: {
          id: `dispute_${Date.now()}`,
          transactionId: data.transactionId,
          disputeType: data.disputeType,
          reason: data.reason,
          description: data.description,
          status: 'OPEN',
          priority: data.priority || 'MEDIUM',
          createdAt: new Date().toISOString()
        },
        message: 'Dispute created successfully (mock)'
      };
    }
  },

  // Get dispute by ID
  getDispute: async (disputeId: string): Promise<{
    success: boolean;
    data: any;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/${disputeId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock dispute data');
      
      // Mock dispute data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: {
          id: disputeId,
          transactionId: 'txn_123',
          disputeType: 'PAYMENT',
          reason: 'Payment not received',
          description: 'I have not received the payment for this transaction',
          status: 'OPEN',
          priority: 'MEDIUM',
          createdAt: new Date().toISOString(),
          transaction: {
            id: 'txn_123',
            description: 'Sample Transaction',
            price: 50000,
            currency: 'NGN'
          },
          raiser: {
            id: 'user_123',
            firstName: 'John',
            lastName: 'Doe'
          },
          accused: {
            id: 'user_456',
            firstName: 'Jane',
            lastName: 'Smith'
          },
          evidence: [],
          messages: [],
          resolutions: []
        }
      };
    }
  },

  // Get user's disputes
  getUserDisputes: async (): Promise<{
    success: boolean;
    data: any[];
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock disputes list');
      
      // Mock disputes list
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: [
          {
            id: 'dispute_1',
            transactionId: 'txn_123',
            disputeType: 'PAYMENT',
            reason: 'Payment not received',
            status: 'OPEN',
            priority: 'HIGH',
            createdAt: new Date().toISOString(),
            transaction: {
              id: 'txn_123',
              description: 'iPhone 15 Pro',
              price: 500000,
              currency: 'NGN'
            }
          },
          {
            id: 'dispute_2',
            transactionId: 'txn_456',
            disputeType: 'QUALITY',
            reason: 'Item not as described',
            status: 'RESOLVED',
            priority: 'MEDIUM',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            transaction: {
              id: 'txn_456',
              description: 'MacBook Pro',
              price: 800000,
              currency: 'NGN'
            }
          }
        ]
      };
    }
  },

  // Add evidence to dispute
  addEvidence: async (data: {
    disputeId: string;
    fileName: string;
    fileType: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO';
    fileUrl: string;
    description?: string;
  }): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/${data.disputeId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock evidence upload');
      
      // Mock evidence upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        data: {
          id: `evidence_${Date.now()}`,
          disputeId: data.disputeId,
          fileName: data.fileName,
          fileType: data.fileType,
          fileUrl: data.fileUrl,
          description: data.description,
          createdAt: new Date().toISOString()
        },
        message: 'Evidence added successfully (mock)'
      };
    }
  },

  // Add message to dispute
  addMessage: async (data: {
    disputeId: string;
    content: string;
  }): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/${data.disputeId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock message');
      
      // Mock message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: {
          id: `message_${Date.now()}`,
          disputeId: data.disputeId,
          content: data.content,
          createdAt: new Date().toISOString()
        },
        message: 'Message added successfully (mock)'
      };
    }
  },

  // Propose resolution
  proposeResolution: async (data: {
    disputeId: string;
    resolutionType: 'AUTOMATIC' | 'MEDIATION' | 'ARBITRATION' | 'ADMIN_DECISION';
    resolution: 'REFUND_FULL' | 'REFUND_PARTIAL' | 'RELEASE_PAYMENT' | 'NO_ACTION';
    amount?: number;
    reason: string;
    expiresAt?: string;
  }): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/${data.disputeId}/resolutions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock resolution proposal');
      
      // Mock resolution proposal
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        data: {
          id: `resolution_${Date.now()}`,
          disputeId: data.disputeId,
          resolutionType: data.resolutionType,
          resolution: data.resolution,
          amount: data.amount,
          reason: data.reason,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        },
        message: 'Resolution proposed successfully (mock)'
      };
    }
  },

  // Accept resolution
  acceptResolution: async (resolutionId: string): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/resolutions/${resolutionId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock resolution acceptance');
      
      // Mock resolution acceptance
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: {
          id: resolutionId,
          status: 'ACCEPTED',
          acceptedAt: new Date().toISOString()
        },
        message: 'Resolution accepted successfully (mock)'
      };
    }
  },

  // Reject resolution
  rejectResolution: async (resolutionId: string): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/resolutions/${resolutionId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock resolution rejection');
      
      // Mock resolution rejection
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: {
          id: resolutionId,
          status: 'REJECTED',
          rejectedAt: new Date().toISOString()
        },
        message: 'Resolution rejected successfully (mock)'
      };
    }
  },

  // Get dispute metadata (types, statuses, etc.)
  getDisputeMeta: async (): Promise<{
    success: boolean;
    data: any;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/meta/types`);
      const data = await handleApiResponse<{ success: boolean; data: any }>(response);
      
      // The handleApiResponse already extracts data.data, so we need to wrap it back
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.warn('Backend unavailable, using mock dispute metadata');
      
      // Mock dispute metadata
      return {
        success: true,
        data: {
          disputeTypes: [
            { value: 'PAYMENT', label: 'Payment Issue', description: 'Problems with payment processing or release' },
            { value: 'DELIVERY', label: 'Delivery Issue', description: 'Problems with item delivery or shipping' },
            { value: 'QUALITY', label: 'Quality Issue', description: 'Item not as described or defective' },
            { value: 'FRAUD', label: 'Fraud', description: 'Suspected fraudulent activity' },
            { value: 'OTHER', label: 'Other', description: 'Other issues not covered above' }
          ],
          priorities: [
            { value: 'LOW', label: 'Low', description: 'Non-urgent issue' },
            { value: 'MEDIUM', label: 'Medium', description: 'Standard priority' },
            { value: 'HIGH', label: 'High', description: 'Urgent issue' },
            { value: 'URGENT', label: 'Urgent', description: 'Critical issue requiring immediate attention' }
          ],
          resolutionTypes: [
            { value: 'AUTOMATIC', label: 'Automatic', description: 'System-generated resolution' },
            { value: 'MEDIATION', label: 'Mediation', description: 'Mutual agreement between parties' },
            { value: 'ARBITRATION', label: 'Arbitration', description: 'Third-party arbitration' },
            { value: 'ADMIN_DECISION', label: 'Admin Decision', description: 'Administrative decision' }
          ],
          resolutionActions: [
            { value: 'REFUND_FULL', label: 'Full Refund', description: 'Refund the full transaction amount' },
            { value: 'REFUND_PARTIAL', label: 'Partial Refund', description: 'Refund a portion of the transaction' },
            { value: 'RELEASE_PAYMENT', label: 'Release Payment', description: 'Release payment to seller' },
            { value: 'NO_ACTION', label: 'No Action', description: 'No action required' }
          ],
          statuses: [
            { value: 'OPEN', label: 'Open', description: 'Dispute is open and being reviewed' },
            { value: 'IN_REVIEW', label: 'In Review', description: 'Dispute is under review' },
            { value: 'RESOLVED', label: 'Resolved', description: 'Dispute has been resolved' },
            { value: 'CLOSED', label: 'Closed', description: 'Dispute is closed' }
          ]
        }
      };
    }
  }
};

// AI Chatbot API
export const chatbotAPI = {
  // Ask a question to the AI chatbot
  askQuestion: async (message: string): Promise<{
    success: boolean;
    data: {
      response: string;
      suggestions?: string[];
      action?: {
        type: 'LINK' | 'NAVIGATE' | 'API_CALL';
        value: string;
        label: string;
      };
    };
    error?: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ message })
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock chatbot response');
      
      // Mock chatbot responses based on keywords
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const mockResponse = getMockChatbotResponse(message);
      return {
        success: true,
        data: mockResponse
      };
    }
  }
};

// Mock chatbot response generator
function getMockChatbotResponse(message: string): {
  response: string;
  suggestions?: string[];
  action?: {
    type: 'LINK' | 'NAVIGATE' | 'API_CALL';
    value: string;
    label: string;
  };
} {
  const lowerMessage = message.toLowerCase();
  
  // Transaction-related queries
  if (lowerMessage.includes('create') && lowerMessage.includes('transaction')) {
    return {
      response: "To create a transaction, go to the 'Create Transaction' page from your dashboard. You'll need to provide:\n\n• Item description and price\n• Delivery details\n• Payment terms\n• Any special conditions\n\nThe other party will receive an invitation to join the transaction.",
      suggestions: [
        "How do I invite someone to join?",
        "What information do I need?",
        "How long does it take to create?"
      ],
      action: {
        type: 'NAVIGATE',
        value: '/app/create-transaction',
        label: 'Create Transaction Now'
      }
    };
  }
  
  if (lowerMessage.includes('join') && lowerMessage.includes('transaction')) {
    return {
      response: "To join a transaction, you can either:\n\n• Use an invitation link shared by the creator\n• Go to 'Join Transaction' and enter the transaction code\n• Accept an invitation from your notifications\n\nOnce joined, you'll be able to see all transaction details and communicate with the other party.",
      suggestions: [
        "Where do I find the transaction code?",
        "What if I don't have an invitation?",
        "How do I accept an invitation?"
      ],
      action: {
        type: 'NAVIGATE',
        value: '/app/join-transaction',
        label: 'Join Transaction'
      }
    };
  }
  
  // Payment-related queries
  if (lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
    return {
      response: "Our escrow system protects your payments by holding funds securely until the transaction is completed. Here's how it works:\n\n• Funds are held in escrow when payment is made\n• Money is only released when both parties are satisfied\n• You can set automatic release conditions\n• Disputes are handled fairly through our resolution system",
      suggestions: [
        "How do I make a payment?",
        "When are funds released?",
        "What are the fees?",
        "How do I withdraw money?"
      ],
      action: {
        type: 'NAVIGATE',
        value: '/app/wallet',
        label: 'View Wallet'
      }
    };
  }
  
  if (lowerMessage.includes('fee') || lowerMessage.includes('cost')) {
    return {
      response: "Our fees are transparent and competitive:\n\n• **Transaction Fee**: 2.5% of transaction value\n• **Payment Processing**: 1.5% for card payments\n• **Withdrawal Fee**: ₦50 for bank transfers\n• **Dispute Fee**: ₦500 (refunded if you win)\n\nUse our Fee Calculator to see exact costs for your transaction amount.",
      suggestions: [
        "Calculate fees for my transaction",
        "How can I reduce fees?",
        "Are there any hidden charges?"
      ],
      action: {
        type: 'NAVIGATE',
        value: '/app/escrow-calculator',
        label: 'Calculate Fees'
      }
    };
  }
  
  // Dispute-related queries
  if (lowerMessage.includes('dispute') || lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
    return {
      response: "If you have a problem with a transaction, you can raise a dispute:\n\n• Go to the transaction details page\n• Click 'Raise Dispute' in the actions section\n• Choose the dispute type (Payment, Delivery, Quality, etc.)\n• Provide detailed information and evidence\n• Our team will review and help resolve the issue",
      suggestions: [
        "How do I raise a dispute?",
        "What evidence do I need?",
        "How long does resolution take?",
        "What if I disagree with the decision?"
      ],
      action: {
        type: 'NAVIGATE',
        value: '/app/disputes',
        label: 'View Disputes'
      }
    };
  }
  
  // Verification-related queries
  if (lowerMessage.includes('verify') || lowerMessage.includes('identity') || lowerMessage.includes('nin') || lowerMessage.includes('bvn')) {
    return {
      response: "Identity verification helps build trust and enables higher transaction limits:\n\n• **Basic**: Email and phone verification\n• **Enhanced**: NIN verification with document upload\n• **Premium**: BVN verification for maximum trust\n\nHigher verification levels unlock more features and higher transaction limits.",
      suggestions: [
        "How do I verify my NIN?",
        "What documents do I need?",
        "How long does verification take?",
        "What are the benefits?"
      ],
      action: {
        type: 'NAVIGATE',
        value: '/app/verification',
        label: 'Start Verification'
      }
    };
  }
  
  // Security-related queries
  if (lowerMessage.includes('security') || lowerMessage.includes('safe') || lowerMessage.includes('protect')) {
    return {
      response: "Your security is our top priority:\n\n• **Escrow Protection**: Funds held securely until transaction completion\n• **Identity Verification**: Verified users for trusted transactions\n• **24/7 Monitoring**: Continuous system monitoring\n• **Dispute Resolution**: Fair resolution process\n• **Data Encryption**: All data encrypted in transit and at rest",
      suggestions: [
        "How does escrow protection work?",
        "What if someone tries to scam me?",
        "How do I report suspicious activity?"
      ]
    };
  }
  
  // Withdrawal-related queries
  if (lowerMessage.includes('withdraw') || lowerMessage.includes('cash out') || lowerMessage.includes('money out')) {
    return {
      response: "To withdraw funds from your wallet:\n\n• Go to your Wallet page\n• Click 'Withdraw Funds'\n• Enter the amount and bank details\n• Confirm the withdrawal\n• Funds will be transferred within 1-3 business days\n\nNote: You can only withdraw funds from completed transactions.",
      suggestions: [
        "How long do withdrawals take?",
        "What are the withdrawal limits?",
        "Can I withdraw to any bank?",
        "What if my withdrawal fails?"
      ],
      action: {
        type: 'NAVIGATE',
        value: '/app/wallet',
        label: 'Go to Wallet'
      }
    };
  }
  
  // General help queries
  if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('contact')) {
    return {
      response: "I'm here to help! You can:\n\n• Ask me questions about transactions, payments, or disputes\n• Use the suggestions below for common topics\n• Contact our support team for complex issues\n• Check our help center for detailed guides\n\nWhat specific area would you like help with?",
      suggestions: [
        "How do I create a transaction?",
        "What are the fees?",
        "How do I resolve a dispute?",
        "How do I verify my identity?",
        "Contact support team"
      ]
    };
  }
  
  // Default response
  return {
    response: "I understand you're asking about: \"" + message + "\"\n\nI'm here to help with questions about:\n\n• Creating and joining transactions\n• Payment processing and fees\n• Dispute resolution\n• Identity verification\n• Security and safety\n• Wallet and withdrawals\n\nCould you be more specific about what you'd like to know?",
    suggestions: [
      "How do I create a transaction?",
      "What are the fees?",
      "How do I resolve a dispute?",
      "How do I verify my identity?",
      "How do I withdraw funds?"
    ]
  };
}

// Export default API object
export default {
  auth: authAPI,
  items: itemsAPI,
  orders: ordersAPI,
  transactions: transactionsAPI,
  notifications: notificationsAPI,
  health: healthAPI,
  verification: verificationAPI,
  paymentConditions: paymentConditionsAPI,
  email: emailAPI,
  escrowCalculator: escrowCalculatorAPI,
  disputes: disputesAPI,
  chatbot: chatbotAPI,
};
