// Shared transaction store to simulate a shared database
// In a real application, this would be handled by a backend API

interface Transaction {
  id: string;
  creatorId: string;
  creatorName?: string;
  creatorRole: 'BUYER' | 'SELLER';
  counterpartyId?: string;
  counterpartyName?: string;
  counterpartyRole?: 'BUYER' | 'SELLER';
  description: string;
  price: number;
  fee: number;
  total: number;
  currency: string;
  status: 'PENDING' | 'ACTIVE' | 'WAITING_FOR_DELIVERY_DETAILS' | 'DELIVERY_DETAILS_IMPORTED' | 'WAITING_FOR_PAYMENT' | 'PAYMENT_MADE' | 'WAITING_FOR_SHIPMENT' | 'SHIPMENT_CONFIRMED' | 'WAITING_FOR_BUYER_CONFIRMATION' | 'COMPLETED' | 'CANCELLED';
  useCourier: boolean;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  completedAt?: string;
  deliveryDetails?: any;
  shippingDetails?: any;
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'RELEASED' | 'PAYMENT_MADE';
  paymentDate?: string;
  paymentMethod?: 'WALLET' | 'BANK_TRANSFER' | 'CARD';
  paymentReference?: string;
  shipmentData?: {
    trackingNumber: string;
    courierService: string;
    estimatedDelivery: string;
    itemCondition: string;
    packagingDetails?: string;
    additionalNotes?: string;
    photos?: string[];
  };
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
  itemPhotos?: string[];
}

class SharedTransactionStore {
  private transactions: Transaction[] = [];
  private listeners: (() => void)[] = [];

  // Load transactions from localStorage (for persistence across page refreshes)
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('shared_transactions');
      if (stored) {
        this.transactions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load transactions from storage:', error);
      this.transactions = [];
    }
  }

  // Save transactions to localStorage
  saveToStorage() {
    try {
      localStorage.setItem('shared_transactions', JSON.stringify(this.transactions));
    } catch (error) {
      console.error('Failed to save transactions to storage:', error);
    }
  }

  // Get all transactions for a user
  getTransactionsForUser(userId: string): Transaction[] {
    console.log('Shared store: getTransactionsForUser called for user:', userId);
    console.log('Shared store: Total transactions in store:', this.transactions.length);
    console.log('Shared store: All transactions:', this.transactions.map(tx => ({ id: tx.id, creatorId: tx.creatorId, counterpartyId: tx.counterpartyId })));
    
    const userTransactions = this.transactions.filter(tx => 
      tx.creatorId === userId || tx.counterpartyId === userId
    );
    
    console.log('Shared store: Filtered transactions for user:', userTransactions.length);
    console.log('Shared store: User transactions:', userTransactions.map(tx => ({ id: tx.id, status: tx.status, creatorId: tx.creatorId, counterpartyId: tx.counterpartyId })));
    
    return userTransactions;
  }

  // Get a specific transaction by ID
  getTransaction(transactionId: string): Transaction | null {
    console.log('Shared store: Looking for transaction:', transactionId, 'Total transactions:', this.transactions.length);
    const found = this.transactions.find(tx => tx.id === transactionId) || null;
    console.log('Shared store: Transaction found:', !!found);
    return found;
  }

  // Create a new transaction
  createTransaction(transaction: Transaction | { transaction: Transaction } | { success: boolean; transaction: Transaction }): Transaction {
    console.log('Shared store: createTransaction called with:', transaction);
    
    if (!transaction) {
      console.error('Shared store: Cannot create transaction - transaction is null/undefined');
      throw new Error('Transaction is null or undefined');
    }
    
    // Handle different response formats
    let actualTransaction: Transaction;
    if ('transaction' in transaction && typeof transaction.transaction === 'object') {
      actualTransaction = transaction.transaction;
      console.log('Shared store: Extracted nested transaction:', actualTransaction);
    } else if ('success' in transaction && 'transaction' in transaction && typeof transaction.transaction === 'object') {
      actualTransaction = transaction.transaction;
      console.log('Shared store: Extracted transaction from success response:', actualTransaction);
    } else {
      actualTransaction = transaction as Transaction;
    }
    
    if (!actualTransaction.id) {
      console.error('Shared store: Cannot create transaction - missing transaction ID:', actualTransaction);
      throw new Error('Transaction ID is required');
    }
    
    // Validate required fields
    if (!actualTransaction.description || !actualTransaction.currency || actualTransaction.price === undefined) {
      console.error('Shared store: Cannot create transaction - missing required fields:', {
        id: actualTransaction.id,
        description: actualTransaction.description,
        currency: actualTransaction.currency,
        price: actualTransaction.price
      });
      throw new Error('Transaction missing required fields (description, currency, price)');
    }
    
    // Check if transaction already exists
    const existingIndex = this.transactions.findIndex(tx => tx.id === actualTransaction.id);
    if (existingIndex !== -1) {
      console.log('Shared store: Updating existing transaction:', actualTransaction.id);
      this.transactions[existingIndex] = { ...this.transactions[existingIndex], ...actualTransaction };
    } else {
      console.log('Shared store: Creating new transaction:', actualTransaction.id);
      this.transactions.push(actualTransaction);
    }
    
    this.saveToStorage();
    this.notifyListeners();
    console.log('Shared store: Transaction created/updated successfully, total transactions:', this.transactions.length);
    return actualTransaction;
  }

  // Add transaction with better error handling (alias for createTransaction)
  addTransaction(transaction: Transaction | { transaction: Transaction } | { success: boolean; transaction: Transaction }): Transaction {
    return this.createTransaction(transaction);
  }

  // Update an existing transaction
  updateTransaction(transactionId: string, updates: Partial<Transaction>): Transaction | null {
    const index = this.transactions.findIndex(tx => tx.id === transactionId);
    if (index !== -1) {
      this.transactions[index] = {
        ...this.transactions[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveToStorage();
      this.notifyListeners();
      return this.transactions[index];
    }
    return null;
  }

  // Add or update delivery details
  updateDeliveryDetails(transactionId: string, deliveryDetails: any): Transaction | null {
    return this.updateTransaction(transactionId, { deliveryDetails });
  }

  // Add or update payment information
  updatePaymentInfo(transactionId: string, paymentInfo: {
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'RELEASED' | 'PAYMENT_MADE';
    paymentDate?: string;
    paymentMethod?: 'WALLET' | 'BANK_TRANSFER' | 'CARD';
    paymentReference?: string;
  }): Transaction | null {
    return this.updateTransaction(transactionId, paymentInfo);
  }

  // Add or update shipment data
  updateShipmentData(transactionId: string, shipmentData: any): Transaction | null {
    return this.updateTransaction(transactionId, { 
      shipmentData,
      shippedAt: new Date().toISOString()
    });
  }

  // Update transaction status
  updateStatus(transactionId: string, status: Transaction['status']): Transaction | null {
    return this.updateTransaction(transactionId, { status });
  }

  // Update transaction with complete data (for real-time sync)
  updateTransactionComplete(transactionId: string, completeData: Partial<Transaction>): Transaction | null {
    const index = this.transactions.findIndex(tx => tx.id === transactionId);
    if (index !== -1) {
      this.transactions[index] = {
        ...this.transactions[index],
        ...completeData,
        updatedAt: new Date().toISOString()
      };
      this.saveToStorage();
      this.notifyListeners();
      return this.transactions[index];
    }
    return null;
  }

  // Ensure transaction exists in store (create if not found)
  ensureTransactionExists(transactionId: string, fallbackData?: Partial<Transaction>): Transaction | null {
    let transaction = this.getTransaction(transactionId);
    
    if (!transaction && fallbackData) {
      // Create a minimal transaction if we have fallback data
      const minimalTransaction: Transaction = {
        id: transactionId,
        creatorId: fallbackData.creatorId || 'unknown',
        creatorRole: fallbackData.creatorRole || 'BUYER',
        description: fallbackData.description || 'Unknown Transaction',
        price: fallbackData.price || 0,
        fee: fallbackData.fee || 0,
        total: fallbackData.total || 0,
        currency: fallbackData.currency || 'NGN',
        status: fallbackData.status || 'PENDING',
        useCourier: fallbackData.useCourier || false,
        createdAt: fallbackData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...fallbackData
      };
      
      try {
        transaction = this.createTransaction(minimalTransaction);
        console.log('Shared store: Created minimal transaction from fallback data:', transactionId);
      } catch (error) {
        console.error('Shared store: Failed to create minimal transaction:', error);
        return null;
      }
    }
    
    return transaction;
  }

  // Get all transactions (for debugging)
  getAllTransactions(): Transaction[] {
    return [...this.transactions];
  }

  // Add listener for store changes
  addListener(listener: () => void) {
    this.listeners.push(listener);
  }

  // Remove listener
  removeListener(listener: () => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Notify all listeners of changes
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Initialize with existing localStorage data if available
  initialize() {
    console.log('Shared store: Initializing...');
    this.loadFromStorage();
    console.log('Shared store: Loaded from storage, transactions:', this.transactions.length);
    
    // Also migrate any existing user-specific transactions to shared store
    try {
      const userTransactions = localStorage.getItem('tranzio_transactions');
      if (userTransactions) {
        const parsed = JSON.parse(userTransactions);
        console.log('Shared store: Found user transactions:', parsed.length);
        parsed.forEach((tx: Transaction) => {
          const existing = this.transactions.find(t => t.id === tx.id);
          if (!existing) {
            console.log('Shared store: Adding new transaction:', tx.id);
            this.transactions.push(tx);
          } else {
            console.log('Shared store: Updating existing transaction:', tx.id);
            // Merge updates from user-specific storage
            this.transactions = this.transactions.map(t => 
              t.id === tx.id ? { ...t, ...tx } : t
            );
          }
        });
        this.saveToStorage();
        console.log('Shared store: Migration complete, total transactions:', this.transactions.length);
      } else {
        console.log('Shared store: No user transactions found in localStorage');
      }
    } catch (error) {
      console.error('Failed to migrate user transactions:', error);
    }
  }
}

// Create a singleton instance
const sharedTransactionStore = new SharedTransactionStore();

// Initialize the store
sharedTransactionStore.initialize();

export default sharedTransactionStore;
