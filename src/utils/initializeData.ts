// Initialize sample data for development and testing
import { User, EscrowTransaction } from '@/types';
import { userService, transactionService } from '@/services/realDataService';

export const initializeSampleData = () => {
  // Check if data already exists
  const existingUsers = localStorage.getItem('tranzio_users');
  const existingTransactions = localStorage.getItem('tranzio_transactions');
  
  if (existingUsers && existingTransactions) {
    console.log('Sample data already exists, skipping initialization');
    return;
  }

  console.log('Initializing sample data...');

  // Create sample users
  const sampleUsers: User[] = [
    {
      id: 'user_1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+2348012345678',
      password: 'hashed_password_1',
      isVerified: true,
      verificationLevel: 'ENHANCED',
      trustScore: 85,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user_2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+2348098765432',
      password: 'hashed_password_2',
      isVerified: true,
      verificationLevel: 'PREMIUM',
      trustScore: 92,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user_3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@example.com',
      phone: '+2348055566677',
      password: 'hashed_password_3',
      isVerified: true,
      verificationLevel: 'BASIC',
      trustScore: 78,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Save sample users
  sampleUsers.forEach(user => {
    userService.saveUser(user);
  });

  // Create sample transactions
  const sampleTransactions: EscrowTransaction[] = [
    {
      id: 'txn_1',
      creatorId: 'user_1',
      counterpartyId: 'user_2',
      description: 'iPhone 15 Pro Max 256GB - Space Black',
      price: 650000,
      currency: 'NGN',
      status: 'ACTIVE',
      useCourier: true,
      courierService: 'DHL',
      deliveryAddress: '123 Victoria Island, Lagos, Nigeria',
      deliveryContact: '+2348012345678',
      paymentMethod: 'BANK_TRANSFER',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      paidAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      shippedAt: null,
      deliveredAt: null,
      completedAt: null
    },
    {
      id: 'txn_2',
      creatorId: 'user_2',
      counterpartyId: 'user_3',
      description: 'MacBook Pro M3 14-inch - Silver',
      price: 1200000,
      currency: 'NGN',
      status: 'COMPLETED',
      useCourier: true,
      courierService: 'FedEx',
      deliveryAddress: '456 Ikoyi, Lagos, Nigeria',
      deliveryContact: '+2348098765432',
      paymentMethod: 'CARD',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      paidAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      shippedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'txn_3',
      creatorId: 'user_1',
      counterpartyId: null,
      description: 'Samsung Galaxy S24 Ultra 512GB - Titanium Black',
      price: 450000,
      currency: 'NGN',
      status: 'PENDING',
      useCourier: false,
      courierService: null,
      deliveryAddress: null,
      deliveryContact: null,
      paymentMethod: 'BANK_TRANSFER',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      paidAt: null,
      shippedAt: null,
      deliveredAt: null,
      completedAt: null
    },
    {
      id: 'txn_4',
      creatorId: 'user_3',
      counterpartyId: 'user_1',
      description: 'AirPods Pro 2nd Generation',
      price: 180000,
      currency: 'NGN',
      status: 'PAYMENT',
      useCourier: true,
      courierService: 'UPS',
      deliveryAddress: '789 Lekki Phase 1, Lagos, Nigeria',
      deliveryContact: '+2348055566677',
      paymentMethod: 'CARD',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      paidAt: null,
      shippedAt: null,
      deliveredAt: null,
      completedAt: null
    },
    {
      id: 'txn_5',
      creatorId: 'user_2',
      counterpartyId: 'user_1',
      description: 'iPad Pro 12.9-inch M2 - Space Gray',
      price: 850000,
      currency: 'NGN',
      status: 'SHIPPING',
      useCourier: true,
      courierService: 'DHL',
      deliveryAddress: '321 Surulere, Lagos, Nigeria',
      deliveryContact: '+2348098765432',
      paymentMethod: 'BANK_TRANSFER',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      paidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      deliveredAt: null,
      completedAt: null
    }
  ];

  // Save sample transactions
  sampleTransactions.forEach(transaction => {
    transactionService.createTransaction(transaction);
  });

  console.log('Sample data initialized successfully');
  console.log('Users:', sampleUsers.length);
  console.log('Transactions:', sampleTransactions.length);
};

// Initialize data when the module is imported
initializeSampleData();
