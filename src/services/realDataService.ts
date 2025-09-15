// Real Data Service - Simulates a backend with localStorage
// This replaces mock data with real user data and proper transaction management

import { User, EscrowTransaction } from '@/types';
import sharedTransactionStore from '@/utils/sharedTransactionStore';

// Data storage keys
const STORAGE_KEYS = {
  USERS: 'tranzio_users',
  TRANSACTIONS: 'tranzio_transactions',
  INVITATIONS: 'tranzio_invitations',
  USER_SESSIONS: 'tranzio_user_sessions'
};

// User Management
export const userService = {
  // Get current user from session
  getCurrentUser(): User | null {
    const sessionData = localStorage.getItem(STORAGE_KEYS.USER_SESSIONS);
    if (!sessionData) return null;
    
    try {
      const sessions = JSON.parse(sessionData);
      const currentSession = sessions.find((s: any) => s.isActive);
      if (!currentSession) return null;
      
      return this.getUserById(currentSession.userId);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Get user by ID
  getUserById(userId: string): User | null {
    const usersData = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!usersData) return null;
    
    try {
      const users = JSON.parse(usersData);
      return users.find((u: User) => u.id === userId) || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  },

  // Create or update user
  saveUser(user: User): void {
    const usersData = localStorage.getItem(STORAGE_KEYS.USERS);
    let users: User[] = [];
    
    if (usersData) {
      try {
        users = JSON.parse(usersData);
      } catch (error) {
        console.error('Error parsing users data:', error);
        users = [];
      }
    }
    
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  // Create user session
  createSession(userId: string, token: string): void {
    const sessionData = localStorage.getItem(STORAGE_KEYS.USER_SESSIONS);
    let sessions: any[] = [];
    
    if (sessionData) {
      try {
        sessions = JSON.parse(sessionData);
        // Deactivate all existing sessions
        sessions.forEach(s => s.isActive = false);
      } catch (error) {
        console.error('Error parsing sessions data:', error);
        sessions = [];
      }
    }
    
    sessions.push({
      userId,
      token,
      isActive: true,
      createdAt: new Date().toISOString()
    });
    
    localStorage.setItem(STORAGE_KEYS.USER_SESSIONS, JSON.stringify(sessions));
  },

  // End current session
  endCurrentSession(): void {
    const sessionData = localStorage.getItem(STORAGE_KEYS.USER_SESSIONS);
    if (!sessionData) return;
    
    try {
      const sessions = JSON.parse(sessionData);
      sessions.forEach((s: any) => s.isActive = false);
      localStorage.setItem(STORAGE_KEYS.USER_SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }
};

// Transaction Management
export const transactionService = {
  // Get all transactions for a user (as creator or counterparty)
  getUserTransactions(userId: string): EscrowTransaction[] {
    const transactionsData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!transactionsData) return [];
    
    try {
      const transactions: EscrowTransaction[] = JSON.parse(transactionsData);
      return transactions.filter(tx => 
        tx.creatorId === userId || tx.counterpartyId === userId
      );
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return [];
    }
  },

  // Get transaction by ID
  getTransactionById(transactionId: string): EscrowTransaction | null {
    const transactionsData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!transactionsData) return null;
    
    try {
      const transactions: EscrowTransaction[] = JSON.parse(transactionsData);
      return transactions.find(tx => tx.id === transactionId) || null;
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      return null;
    }
  },

  // Create new transaction
  createTransaction(transaction: EscrowTransaction): EscrowTransaction {
    console.log('Real data service: Creating transaction:', transaction.id);
    const transactionsData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    let transactions: EscrowTransaction[] = [];
    
    if (transactionsData) {
      try {
        transactions = JSON.parse(transactionsData);
      } catch (error) {
        console.error('Error parsing transactions data:', error);
        transactions = [];
      }
    }
    
    // Add the new transaction
    transactions.push(transaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    console.log('Real data service: Transaction saved to localStorage, total:', transactions.length);
    
    // Sync with shared store for real-time updates
    console.log('Real data service: Syncing to shared store...');
    sharedTransactionStore.createTransaction(transaction);
    console.log('Real data service: Transaction synced to shared store');
    
    return transaction;
  },

  // Update existing transaction
  updateTransaction(transactionId: string, updates: Partial<EscrowTransaction>): EscrowTransaction | null {
    const transactionsData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!transactionsData) return null;
    
    try {
      const transactions: EscrowTransaction[] = JSON.parse(transactionsData);
      const index = transactions.findIndex(tx => tx.id === transactionId);
      
      if (index === -1) return null;
      
      // Update the transaction
      transactions[index] = {
        ...transactions[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      
      // Sync with shared store for real-time updates
      sharedTransactionStore.updateTransaction(transactionId, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      return transactions[index];
    } catch (error) {
      console.error('Error updating transaction:', error);
      return null;
    }
  },

  // Join transaction
  joinTransaction(transactionId: string, joinerId: string, joinerName: string, joinerRole: 'BUYER' | 'SELLER'): EscrowTransaction | null {
    const transaction = this.getTransactionById(transactionId);
    if (!transaction) return null;
    
    // Check if transaction is already joined
    if (transaction.counterpartyId) {
      throw new Error('Transaction is already joined by another user');
    }
    
    // Update transaction with joiner info
    const updatedTransaction = this.updateTransaction(transactionId, {
      counterpartyId: joinerId,
      counterpartyName: joinerName,
      counterpartyRole: joinerRole,
      status: 'ACTIVE'
    });
    
    // Sync with shared store for real-time updates
    if (updatedTransaction) {
      console.log('Syncing transaction to shared store:', updatedTransaction.id);
      // Check if transaction exists in shared store, if not create it
      const existingSharedTransaction = sharedTransactionStore.getTransaction(transactionId);
      if (existingSharedTransaction) {
        console.log('Updating existing transaction in shared store');
        // Update existing transaction in shared store
        sharedTransactionStore.updateTransaction(transactionId, {
          counterpartyId: joinerId,
          counterpartyName: joinerName,
          counterpartyRole: joinerRole,
          status: 'ACTIVE'
        });
      } else {
        console.log('Creating new transaction in shared store');
        // Create new transaction in shared store
        sharedTransactionStore.createTransaction(updatedTransaction);
      }
      console.log('Transaction synced to shared store successfully');
    }
    
    return updatedTransaction;
  }
};

// Invitation Management
export const invitationService = {
  // Create invitation for transaction
  createInvitation(transactionId: string, expiresInDays: number = 7): { code: string; expiresAt: string } {
    const invitationsData = localStorage.getItem(STORAGE_KEYS.INVITATIONS);
    let invitations: any[] = [];
    
    if (invitationsData) {
      try {
        invitations = JSON.parse(invitationsData);
      } catch (error) {
        console.error('Error parsing invitations data:', error);
        invitations = [];
      }
    }
    
    const code = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    
    invitations.push({
      code,
      transactionId,
      expiresAt,
      createdAt: new Date().toISOString()
    });
    
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(invitations));
    
    return { code, expiresAt };
  },

  // Get transaction by invitation code
  getTransactionByInviteCode(inviteCode: string): { transaction: EscrowTransaction; expiresAt: string } | null {
    const invitationsData = localStorage.getItem(STORAGE_KEYS.INVITATIONS);
    if (!invitationsData) return null;
    
    try {
      const invitations = JSON.parse(invitationsData);
      const invitation = invitations.find((inv: any) => inv.code === inviteCode);
      
      if (!invitation) return null;
      
      // Check if invitation is expired
      if (new Date(invitation.expiresAt) < new Date()) {
        throw new Error('Invitation has expired');
      }
      
      const transaction = transactionService.getTransactionById(invitation.transactionId);
      if (!transaction) return null;
      
      return {
        transaction,
        expiresAt: invitation.expiresAt
      };
    } catch (error) {
      console.error('Error getting transaction by invite code:', error);
      return null;
    }
  }
};

// Utility functions
export const generateId = (): string => {
  return `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateUserId = (): string => {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
