// Shared TypeScript interfaces for Tranzio Platform

// User Management - Use Prisma-generated types
export { User } from '@prisma/client';

export type UserRole = 'BUYER' | 'VENDOR' | 'ADMIN';

// Item Management
export interface Item {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  currency: string;
  images: string;
  condition: 'NEW' | 'LIKE_NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'RESERVED';
  vendorId: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemCondition = 'NEW' | 'LIKE_NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
export type ItemStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'RESERVED';

// Order Management
export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  vendorId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  escrowFee: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_ESCROW' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  shippingStatus: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_ESCROW' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
export type ShippingStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';

// Transaction Management
export interface Transaction {
  id: string;
  orderId: string;
  userId: string;
  type: 'PAYMENT' | 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'REFUND' | 'FEE' | 'WITHDRAWAL';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  reference?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'PAYMENT' | 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'REFUND' | 'FEE' | 'WITHDRAWAL';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// Notification System
export interface Notification {
  id: string;
  userId: string;
  orderId?: string;
  type: 'ORDER_UPDATE' | 'PAYMENT' | 'SHIPPING' | 'DELIVERY' | 'DISPUTE' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
}

export type NotificationType = 'ORDER_UPDATE' | 'PAYMENT' | 'SHIPPING' | 'DELIVERY' | 'DISPUTE' | 'SYSTEM';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Messaging System
export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// Dispute Management
export interface Dispute {
  id: string;
  orderId: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Order Creation Types
export interface CreateOrderRequest {
  itemId: string;
  quantity: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
}

// Search and Filter Types
export interface ItemSearchParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ItemCondition;
  vendorId?: string;
  page?: number;
  limit?: number;
}

export interface OrderFilterParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingStatus?: ShippingStatus;
  buyerId?: string;
  vendorId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
