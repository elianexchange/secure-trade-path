import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { MessageProvider } from './contexts/MessageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatbotProvider } from './contexts/ChatbotContext';
import sharedTransactionStore from './utils/sharedTransactionStore';

// Initialize shared transaction store
sharedTransactionStore.initialize();
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { PWAInstallPrompt, PWAStatus } from './components/PWAInstallPrompt';
import Landing from './pages/Landing';
import TermsAndConditions from './pages/TermsAndConditions';
import Dashboard from './pages/Dashboard';
import CreateTransaction from './pages/CreateTransaction';
import JoinTransaction from './pages/JoinTransaction';
import JoinTransactionPage from './pages/JoinTransactionPage';
import Transactions from './pages/Transactions';
import TransactionDetails from './pages/TransactionDetails';
import TransactionDetailsNew from './pages/TransactionDetailsNew';
import TransactionStatus from './pages/TransactionStatus';
import TransactionStatusNew from './pages/TransactionStatusNew';
import ShippingDetails from './pages/ShippingDetails';
import VendorDetails from './pages/VendorDetails';
import Payment from './pages/Payment';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import UserProfile from './pages/UserProfile';
import Wallet from './pages/Wallet';
import Verification from './pages/Verification';
import EscrowCalculatorPage from './pages/EscrowCalculatorPage';
import Disputes from './pages/Disputes';
import CreateDispute from './pages/CreateDispute';
import DisputeDetails from './pages/DisputeDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Initialize shared transaction store
  React.useEffect(() => {
    sharedTransactionStore.initialize();
  }, []);

  // Register service worker for PWA functionality
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Routes */}
              <Route path="/app" element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <NotificationProvider>
                      <MessageProvider>
                        <ChatbotProvider>
                          <Layout />
                        </ChatbotProvider>
                      </MessageProvider>
                    </NotificationProvider>
                  </WebSocketProvider>
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="create-transaction" element={<CreateTransaction />} />
                <Route path="join-transaction" element={<JoinTransactionPage />} />
                <Route path="join-transaction/:transactionId" element={<JoinTransaction />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="transactions/:id" element={<TransactionDetails />} />
                <Route path="transaction-details/:id" element={<TransactionDetailsNew />} />
                <Route path="transaction-status" element={<TransactionStatusNew />} />
                <Route path="shipping-details/:transactionId" element={<ShippingDetails />} />
                <Route path="payment/:transactionId" element={<Payment />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="messages" element={<Messages />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="wallet" element={<Wallet />} />
            <Route path="verification" element={<Verification />} />
            <Route path="escrow-calculator" element={<EscrowCalculatorPage />} />
            <Route path="disputes" element={<Disputes />} />
            <Route path="disputes/create" element={<CreateDispute />} />
            <Route path="disputes/:disputeId" element={<DisputeDetails />} />
                <Route path="vendor" element={<VendorDetails />} />
                <Route path="vendor/profile" element={<VendorDetails />} />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        <Toaster 
          position="top-right"
          richColors
          closeButton
          duration={4000}
          theme="light"
        />
        <PWAInstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
