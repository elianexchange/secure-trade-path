// Frontend Types for Tranzio Platform
// These types mirror the backend Prisma schema

// User Management
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  role: UserRole;
  status: string;
  nin?: string; // National Identification Number
  bvn?: string; // Bank Verification Number
  isVerified: boolean; // KYC verification status
  profilePicture?: string; // Profile picture URL
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'BUYER' | 'VENDOR' | 'ADMIN';

// Item Management
export interface Item {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  currency: string; // NGN (Naira), GHS (Ghana Cedis), KES (Kenya Shilling), ZAR (South Africa Rand)
  images: string;
  condition: 'NEW' | 'LIKE_NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'RESERVED';
  vendorId: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemCondition = 'NEW' | 'LIKE_NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
export type ItemStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'RESERVED';
export type Currency = 'NGN' | 'GHS' | 'KES' | 'ZAR' | 'USD' | 'EUR';

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
  currency: string; // NGN (Naira), GHS (Ghana Cedis), KES (Kenya Shilling), ZAR (South Africa Rand)
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

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type ShippingStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';

// Escrow Transaction Management
export interface EscrowTransaction {
  id: string;
  description: string;
  currency: string; // NGN, USD, EUR, GBP
  price: number;
  fee: number;
  total: number;
  useCourier: boolean;
  status: EscrowTransactionStatus;
  creatorId: string;
  creatorRole: 'BUYER' | 'SELLER';
  counterpartyId?: string;
  counterpartyRole?: 'BUYER' | 'SELLER';
  counterpartyName?: string;
  shippingDetails?: string; // JSON string for shipping information
  deliveryDetails?: string; // JSON string for delivery information
  paymentCompleted: boolean;
  paymentMethod?: 'WALLET' | 'BANK_TRANSFER' | 'CARD';
  paymentReference?: string;
  expectedDeliveryTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  
  // Enhanced item details from transaction creation
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
  itemPhotos?: string[]; // Array of photo URLs
}

export type EscrowTransactionStatus = 
  | 'PENDING' 
  | 'ACTIVE' 
  | 'WAITING_FOR_DELIVERY_DETAILS' 
  | 'DELIVERY_DETAILS_IMPORTED' 
  | 'WAITING_FOR_PAYMENT' 
  | 'PAYMENT_MADE' 
  | 'WAITING_FOR_SHIPMENT' 
  | 'SHIPMENT_CONFIRMED' 
  | 'WAITING_FOR_BUYER_CONFIRMATION' 
  | 'COMPLETED' 
  | 'CANCELLED';

// Wallet System
export interface Wallet {
  id: string;
  userId: string;
  accountNumber: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  transactionId?: string;
  type: WalletTransactionType;
  amount: number;
  balance: number;
  description: string;
  reference?: string;
  status: WalletTransactionStatus;
  createdAt: string;
  updatedAt: string;
}

export type WalletTransactionType = 
  | 'DEPOSIT' 
  | 'WITHDRAWAL' 
  | 'ESCROW_HOLD' 
  | 'ESCROW_RELEASE' 
  | 'PAYMENT' 
  | 'REFUND' 
  | 'FEE';

export type WalletTransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// Bank Account Management
export interface BankAccount {
  id: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Legacy Transaction Management (keeping for backward compatibility)
export interface Transaction {
  id: string;
  orderId: string;
  userId: string;
  type: 'PAYMENT' | 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'REFUND' | 'FEE' | 'WITHDRAWAL';
  amount: number;
  currency: string; // NGN (Naira), GHS (Ghana Cedis), KES (Kenya Shilling), ZAR (South Africa Rand)
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  reference?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'PAYMENT' | 'REFUND' | 'FEE';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  orderId?: string;
  type: string; // ORDER_UPDATE, PAYMENT, SHIPPING, SYSTEM
  title: string;
  message: string;
  priority: string; // LOW, MEDIUM, HIGH, URGENT
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'ORDER_UPDATE' | 'PAYMENT' | 'SHIPPING' | 'SYSTEM';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Message Types
export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  content: string;
  messageType: string; // TEXT, IMAGE, FILE
  createdAt: string;
  updatedAt: string;
  
  // Relations (populated by API)
  sender?: User;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE';

// Dispute Types
export interface Dispute {
  id: string;
  orderId: string;
  initiatorId: string;
  reason: string;
  description: string;
  status: string; // OPEN, UNDER_REVIEW, RESOLVED, CLOSED
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations (populated by API)
  order?: Order;
  initiator?: User;
}

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

// API Request/Response Types
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

export interface CreateItemRequest {
  name: string;
  description?: string;
  category: string;
  price: number;
  currency?: string;
  images: string | string[];
  condition?: ItemCondition;
}

export interface UpdateItemRequest {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
  images?: string | string[];
  condition?: ItemCondition;
  status?: ItemStatus;
}

export interface PaymentRequest {
  paymentMethod: string;
  paymentReference: string;
}

// Wallet API Types
export interface CreateWalletRequest {
  userId: string;
}

export interface WalletDepositRequest {
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'CARD';
  reference?: string;
}

export interface WalletWithdrawalRequest {
  amount: number;
  bankAccountId: string;
  description?: string;
}

export interface BankAccountRequest {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
}

// Transaction Flow API Types
export interface CreateTransactionRequest {
  description: string;
  currency: string;
  price: number;
  fee: number;
  total: number;
  useCourier: boolean;
  creatorRole: 'BUYER' | 'SELLER';
}

export interface JoinTransactionRequest {
  invitationCode: string;
}

export interface UpdateTransactionStatusRequest {
  status: EscrowTransactionStatus;
  notes?: string;
}

export interface DeliveryDetailsRequest {
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentConfirmationRequest {
  paymentMethod: 'WALLET' | 'BANK_TRANSFER' | 'CARD';
  paymentReference: string;
  amount: number;
}

export interface ShipmentConfirmationRequest {
  trackingNumber?: string;
  courierService?: string;
  expectedDeliveryTime: string;
  notes?: string;
}

export interface DeliveryConfirmationRequest {
  received: boolean;
  condition?: 'GOOD' | 'DAMAGED' | 'MISSING_ITEMS';
  notes?: string;
}

// KYC Verification Types
export interface KYCVerificationRequest {
  nin: string;
  bvn: string;
  documentType: 'NIN' | 'BVN';
  documentNumber: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter Types
export interface ItemFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ItemCondition;
  vendorId?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingStatus?: ShippingStatus;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface ProfileUpdateData {
  name?: string;
  avatar?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Error Types
export interface APIError {
  message: string;
  status?: number;
  code?: string;
}

// Success Response Types
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}

export type APIResponse<T = any> = SuccessResponse<T> | ErrorResponse;
