import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  emitTransactionUpdate: (transactionId: string, status: string, transactionData?: any) => void;
  emitTransactionCreated: (transactionId: string) => void;
  joinTransactionRoom: (transactionId: string) => void;
  leaveTransactionRoom: (transactionId: string) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setConnectionStatus('disconnected');
      }
      return;
    }

    // Create WebSocket connection with proper URL resolution
    const getWebSocketUrl = () => {
      // Connect directly to backend in development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `http://localhost:4000`;
      }
      // In production, use the backend URL directly
      return process.env.REACT_APP_WS_URL || 'http://localhost:4000';
    };

    const wsUrl = getWebSocketUrl();
    console.log(`WebSocket: Attempting to connect to ${wsUrl}`);
    console.log(`WebSocket: User ID: ${user.id}, Token available: ${!!token}`);
    console.log(`WebSocket: Token value: ${token ? token.substring(0, 20) + '...' : 'null'}`);
    
    let newSocket: Socket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    const reconnectDelay = 2000; // Start with 2 seconds

    const connectWithRetry = () => {
      try {
        setConnectionStatus('connecting');
        newSocket = io(wsUrl, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 15000, // 15 second timeout
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: reconnectDelay,
          reconnectionDelayMax: 10000,
          maxReconnectionAttempts: maxReconnectAttempts
        });

        newSocket.on('connect', () => {
          console.log(`✅ WebSocket connected to ${wsUrl}`);
          console.log(`WebSocket: Socket ID: ${newSocket.id}`);
          console.log(`WebSocket: Connection established successfully`);
          setIsConnected(true);
          setConnectionStatus('connected');
          reconnectAttempts = 0; // Reset on successful connection
          
          // Join user's personal room for notifications
          newSocket.emit('join_user_room', { userId: user.id });
          console.log(`WebSocket: Joined user room for ${user.id}`);
        });

        newSocket.on('connect_error', (error) => {
          console.error(`❌ WebSocket connection error for ${wsUrl}:`, error);
          console.error(`WebSocket: Error details:`, {
            message: error.message,
            type: error.type,
            description: error.description,
            context: error.context
          });
          console.error(`WebSocket: Connection attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
          setIsConnected(false);
          setConnectionStatus('error');
          reconnectAttempts++;
          
          if (reconnectAttempts >= maxReconnectAttempts) {
            console.warn(`WebSocket: Max reconnection attempts (${maxReconnectAttempts}) reached. Continuing without real-time updates.`);
            setConnectionStatus('disconnected');
            newSocket?.disconnect();
            newSocket = null;
          }
        });

        newSocket.on('disconnect', (reason) => {
          console.warn(`⚠️ WebSocket disconnected: ${reason}`);
          console.warn(`WebSocket: Disconnect details:`, {
            reason,
            socketId: newSocket?.id,
            connected: newSocket?.connected
          });
          setIsConnected(false);
          setConnectionStatus('disconnected');
          
          // Only attempt reconnection for certain disconnect reasons
          if (reason === 'io server disconnect') {
            // Server disconnected, don't reconnect automatically
            console.warn('WebSocket: Server disconnected, not attempting reconnection');
          }
        });

        newSocket.on('reconnect', (attemptNumber) => {
          console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
          setIsConnected(true);
          setConnectionStatus('connected');
          reconnectAttempts = 0;
        });

        newSocket.on('reconnect_error', (error) => {
          console.warn(`WebSocket reconnection error:`, error);
        });

        newSocket.on('reconnect_failed', () => {
          console.warn('WebSocket: Reconnection failed after all attempts');
          setIsConnected(false);
        });
        
      } catch (error) {
        console.warn(`Failed to create WebSocket connection to ${wsUrl}:`, error);
        setIsConnected(false);
      }
    };

    connectWithRetry();

    if (!newSocket) {
      console.warn('No WebSocket connection available');
      setIsConnected(false);
      return;
    }

    // Additional connection events
    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // Transaction update events
    newSocket.on('transaction:updated', async (data) => {
      console.log('Transaction updated via WebSocket:', data);
      console.log('WebSocket transaction update - transactionId:', data.transactionId, 'status:', data.status);
      
      // Import shared store dynamically to avoid circular dependencies
      const { default: sharedTransactionStore } = await import('@/utils/sharedTransactionStore');
      const existingTransaction = sharedTransactionStore.getTransaction(data.transactionId);
      
      if (existingTransaction) {
        // Update existing transaction in shared store with complete data
        const updateData = data.transaction ? {
          ...data.transaction,
          updatedAt: new Date().toISOString()
        } : {
          status: data.status,
          updatedAt: new Date().toISOString(),
          ...(data.deliveryDetails && { deliveryDetails: data.deliveryDetails }),
          ...(data.shippingDetails && { shippingDetails: data.shippingDetails }),
          ...(data.paymentCompleted && { paymentCompleted: data.paymentCompleted }),
          ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
          ...(data.paymentReference && { paymentReference: data.paymentReference }),
          ...(data.paidAt && { paidAt: data.paidAt }),
          ...(data.shippedAt && { shippedAt: data.shippedAt }),
          ...(data.completedAt && { completedAt: data.completedAt }),
          ...(data.shipmentData && { shipmentData: data.shipmentData }),
          ...(data.counterpartyId && { counterpartyId: data.counterpartyId }),
          ...(data.counterpartyName && { counterpartyName: data.counterpartyName })
        };
        
        // Use the standard update method
        const updatedTransaction = sharedTransactionStore.updateTransaction(data.transactionId, updateData);
        
        if (updatedTransaction) {
          // Dispatch custom event to notify components with complete data
          const eventData = { 
            ...data, 
            transaction: updatedTransaction,
            transactionId: data.transactionId,
            status: data.status
          };
          console.log('Dispatching transactionUpdated event with complete data:', eventData);
          window.dispatchEvent(new CustomEvent('transactionUpdated', { detail: eventData }));
          
          // Show toast notification
          toast.success(`Transaction status updated to ${data.status.replace(/_/g, ' ').toLowerCase()}`);
        }
      } else {
        console.log('Transaction not found in shared store:', data.transactionId);
        console.log('WebSocket data received:', data);
        
        // If transaction doesn't exist, try to create it from the data
        if (data.transaction) {
          console.log('Creating new transaction from WebSocket data:', data.transaction);
          try {
            sharedTransactionStore.createTransaction(data.transaction);
          } catch (error) {
            console.error('Failed to create transaction from WebSocket data:', error);
          }
        } else {
          console.log('No transaction data in WebSocket message, fetching from API...');
          
          // Fallback: Fetch full transaction details from API
          try {
            const { transactionsAPI } = await import('@/services/api');
            const fullTransaction = await transactionsAPI.getTransaction(data.transactionId);
            if (fullTransaction) {
              console.log('WebSocket: Fetched full transaction from API:', fullTransaction.id);
              sharedTransactionStore.addTransaction(fullTransaction);
              
              // Dispatch update event with full transaction data
              window.dispatchEvent(new CustomEvent('transactionUpdated', { 
                detail: { 
                  ...data, 
                  transaction: fullTransaction,
                  transactionId: data.transactionId,
                  status: data.status
                }
              }));
            } else {
              console.log('WebSocket: Transaction not found in API either');
              // Try to ensure transaction exists with minimal data
              sharedTransactionStore.ensureTransactionExists(data.transactionId, {
                status: data.status,
                description: data.description || 'Unknown Transaction'
              });
            }
          } catch (apiError) {
            console.error('WebSocket: Failed to fetch transaction from API:', apiError);
            // Try to ensure transaction exists with minimal data
            sharedTransactionStore.ensureTransactionExists(data.transactionId, {
              status: data.status,
              description: data.description || 'Unknown Transaction'
            });
          }
        }
      }
    });

    // Transaction created events
    newSocket.on('transaction:created', (data) => {
      console.log('Transaction created via WebSocket:', data);
      
      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('transactionCreated', { detail: data }));
      
      // Show toast notification
      toast.success('New transaction created successfully!');
    });

    // Notification events
    newSocket.on('notification', (notification) => {
      console.log('Notification received via WebSocket:', notification);
      
      // Show toast notification
      toast(notification.message, {
        description: notification.title,
        duration: 5000
      });
      
      // Dispatch custom event for notification components
      window.dispatchEvent(new CustomEvent('notificationReceived', { detail: notification }));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  const emitTransactionUpdate = (transactionId: string, status: string, transactionData?: any) => {
    if (socket && isConnected) {
      socket.emit('transaction:status_update', { 
        transactionId, 
        status, 
        transaction: transactionData 
      });
    }
  };

  const emitTransactionCreated = (transactionId: string) => {
    if (socket && isConnected) {
      socket.emit('transaction:created', { transactionId });
    }
  };

  const joinTransactionRoom = (transactionId: string) => {
    if (socket && isConnected) {
      socket.emit('join_transaction_room', { transactionId });
      console.log(`WebSocket: Joined transaction room ${transactionId}`);
    }
  };

  const leaveTransactionRoom = (transactionId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_transaction_room', { transactionId });
      console.log(`WebSocket: Left transaction room ${transactionId}`);
    }
  };

  const reconnect = () => {
    console.log('WebSocket: Manual reconnect requested');
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
    // Force reconnection by triggering the useEffect
    if (user && token) {
      console.log('WebSocket: Forcing reconnection...');
      // The useEffect will handle reconnection automatically
    }
  };

  const value: WebSocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    emitTransactionUpdate,
    emitTransactionCreated,
    joinTransactionRoom,
    leaveTransactionRoom,
    reconnect
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
