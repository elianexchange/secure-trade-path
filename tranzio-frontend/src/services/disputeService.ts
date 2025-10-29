import { API_BASE_URL, getAuthToken, handleApiResponse } from './api';

export interface DisputeMetrics {
  totalDisputes: number;
  openDisputes: number;
  inReviewDisputes: number;
  resolvedDisputes: number;
  closedDisputes: number;
  averageResolutionTime: number; // in hours
  escalationRate: number; // percentage
  priorityBreakdown: {
    URGENT: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
}

export interface DisputeDashboard {
  metrics: DisputeMetrics;
  recentDisputes: Dispute[];
  urgentDisputes: Dispute[];
  adminWorkload: AdminWorkload[];
}

export interface Dispute {
  id: string;
  transactionId: string;
  disputeType: 'PAYMENT' | 'DELIVERY' | 'QUALITY' | 'FRAUD' | 'OTHER';
  reason: string;
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  raisedBy: string;
  raisedAgainst: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
  resolutionNotes?: string;
  transaction: {
    id: string;
    description: string;
    price: number;
    currency: string;
    status: string;
  };
  raiser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  accused?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  evidence?: DisputeEvidence[];
  messages?: DisputeMessage[];
  slaStatus?: 'ON_TIME' | 'AT_RISK' | 'OVERDUE';
  timeToResolution?: number; // in hours
}

export interface DisputeEvidence {
  id: string;
  fileName: string;
  fileType: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO';
  fileUrl: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
  metadata?: Record<string, any>;
}

export interface DisputeMessage {
  id: string;
  content: string;
  senderId: string;
  isInternal: boolean;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AdminWorkload {
  adminId: string;
  adminName: string;
  assignedDisputes: number;
  resolvedThisWeek: number;
  averageResolutionTime: number;
  currentLoad: 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERLOADED';
}

export interface DisputeFilters {
  status?: string;
  type?: string;
  priority?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

class DisputeService {
  private listeners: ((disputes: Dispute[]) => void)[] = [];
  private metricsListeners: ((metrics: DisputeMetrics) => void)[] = [];
  private isConnected = false;

  constructor() {
    this.setupWebSocketConnection();
  }

  private setupWebSocketConnection() {
    // WebSocket connection will be handled by the WebSocketContext
    // This service will listen for dispute-related events
    if (typeof window !== 'undefined') {
      window.addEventListener('disputeUpdated', this.handleDisputeUpdate.bind(this));
      window.addEventListener('disputeCreated', this.handleDisputeCreated.bind(this));
      window.addEventListener('disputeResolved', this.handleDisputeResolved.bind(this));
    }
  }

  private handleDisputeUpdate(event: CustomEvent) {
    const { dispute } = event.detail;
    this.notifyListeners([dispute]);
  }

  private handleDisputeCreated(event: CustomEvent) {
    const { dispute } = event.detail;
    this.notifyListeners([dispute]);
  }

  private handleDisputeResolved(event: CustomEvent) {
    const { dispute } = event.detail;
    this.notifyListeners([dispute]);
  }

  private notifyListeners(disputes: Dispute[]) {
    this.listeners.forEach(listener => listener(disputes));
  }

  private notifyMetricsListeners(metrics: DisputeMetrics) {
    this.metricsListeners.forEach(listener => listener(metrics));
  }

  // Add listener for real-time updates
  addDisputeListener(listener: (disputes: Dispute[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  addMetricsListener(listener: (metrics: DisputeMetrics) => void) {
    this.metricsListeners.push(listener);
    return () => {
      this.metricsListeners = this.metricsListeners.filter(l => l !== listener);
    };
  }

  // Get dispute dashboard data
  async getDisputeDashboard(): Promise<{
    success: boolean;
    data: DisputeDashboard;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock dispute dashboard');
      
      // Mock dashboard data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: {
          metrics: {
            totalDisputes: 0,
            openDisputes: 0,
            inReviewDisputes: 0,
            resolvedDisputes: 0,
            closedDisputes: 0,
            averageResolutionTime: 0,
            escalationRate: 0,
            priorityBreakdown: {
              URGENT: 0,
              HIGH: 0,
              MEDIUM: 0,
              LOW: 0
            }
          },
          recentDisputes: [],
          urgentDisputes: [],
          adminWorkload: []
        }
      };
    }
  }

  // Get user disputes with filters
  async getUserDisputes(filters?: DisputeFilters): Promise<{
    success: boolean;
    data: Dispute[];
  }> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.priority) queryParams.append('priority', filters.priority);
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.dateRange) {
      queryParams.append('startDate', filters.dateRange.start);
      queryParams.append('endDate', filters.dateRange.end);
    }

    const url = `${API_BASE_URL}/disputes?${queryParams.toString()}`;
    const token = getAuthToken();
    
    console.log('🔍 DisputeService.getUserDisputes - Debug Info:');
    console.log('  - API URL:', url);
    console.log('  - Has Auth Token:', !!token);
    console.log('  - Token Preview:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('  - Filters:', filters);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('🔍 DisputeService.getUserDisputes - Response:');
    console.log('  - Status:', response.status, response.statusText);
    console.log('  - Headers:', Object.fromEntries(response.headers.entries()));

    const result = await handleApiResponse(response);
    console.log('🔍 DisputeService.getUserDisputes - Result:', result);
    
    // handleApiResponse returns the data directly, but we need to wrap it in success/data format
    return {
      success: true,
      data: result
    };
  }

  // Get dispute by ID
  async getDispute(disputeId: string): Promise<{
    success: boolean;
    data: Dispute;
  }> {
    const response = await fetch(`${API_BASE_URL}/disputes/${disputeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await handleApiResponse(response);
    
    // handleApiResponse returns the data directly, but we need to wrap it in success/data format
    return {
      success: true,
      data: result
    };
  }

  // Create dispute
  async createDispute(data: {
    transactionId: string;
    disputeType: 'PAYMENT' | 'DELIVERY' | 'QUALITY' | 'FRAUD' | 'OTHER';
    reason: string;
    description: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }): Promise<{
    success: boolean;
    data: Dispute;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await handleApiResponse(response);
      
      // Emit WebSocket event for real-time updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('disputeCreated', {
          detail: { dispute: result.data }
        }));
      }
      
      return result;
    } catch (error) {
      console.warn('Backend unavailable, using mock dispute creation');
      
      // Mock dispute creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockDispute: Dispute = {
        id: `dispute_${Date.now()}`,
        transactionId: data.transactionId,
        disputeType: data.disputeType,
        reason: data.reason,
        description: data.description,
        status: 'OPEN',
        priority: data.priority || 'MEDIUM',
        raisedBy: 'current-user',
        raisedAgainst: 'counterparty',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        transaction: {
          id: data.transactionId,
          description: 'Mock transaction',
          price: 1000,
          currency: 'USD',
          status: 'ACTIVE'
        }
      };
      
      // Emit WebSocket event for real-time updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('disputeCreated', {
          detail: { dispute: mockDispute }
        }));
      }
      
      return {
        success: true,
        data: mockDispute,
        message: 'Dispute created successfully (mock)'
      };
    }
  }

  // Add evidence to dispute
  async addEvidence(disputeId: string, evidence: {
    fileName: string;
    fileType: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO';
    fileUrl: string;
    description?: string;
  }): Promise<{
    success: boolean;
    data: DisputeEvidence;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/${disputeId}/evidence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(evidence)
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock evidence addition');
      
      // Mock evidence addition
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: {
          id: `evidence_${Date.now()}`,
          fileName: evidence.fileName,
          fileType: evidence.fileType,
          fileUrl: evidence.fileUrl,
          description: evidence.description,
          uploadedBy: 'current-user',
          uploadedAt: new Date().toISOString()
        },
        message: 'Evidence added successfully (mock)'
      };
    }
  }

  // Add message to dispute
  async addMessage(disputeId: string, content: string): Promise<{
    success: boolean;
    data: DisputeMessage;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/${disputeId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.warn('Backend unavailable, using mock message addition');
      
      // Mock message addition
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: {
          id: `message_${Date.now()}`,
          content,
          senderId: 'current-user',
          isInternal: false,
          createdAt: new Date().toISOString()
        },
        message: 'Message added successfully (mock)'
      };
    }
  }

  // Propose resolution
  async proposeResolution(disputeId: string, resolution: {
    resolutionType: 'AUTOMATIC' | 'MEDIATION' | 'ARBITRATION' | 'ADMIN_DECISION';
    resolution: 'REFUND_FULL' | 'REFUND_PARTIAL' | 'RELEASE_PAYMENT' | 'NO_ACTION';
    amount?: number;
    reason: string;
    expiresAt?: string;
  }): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/${disputeId}/resolutions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resolution)
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
          disputeId,
          resolutionType: resolution.resolutionType,
          resolution: resolution.resolution,
          amount: resolution.amount,
          reason: resolution.reason,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        },
        message: 'Resolution proposed successfully (mock)'
      };
    }
  }

  // Accept resolution
  async acceptResolution(resolutionId: string): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/resolutions/${resolutionId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
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
  }

  // Reject resolution
  async rejectResolution(resolutionId: string): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/resolutions/${resolutionId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
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
  }

  // Get dispute metrics
  async getDisputeMetrics(): Promise<{
    success: boolean;
    data: DisputeMetrics;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await handleApiResponse(response);
      
      // Notify metrics listeners
      this.notifyMetricsListeners(result.data);
      
      return result;
    } catch (error) {
      console.warn('Backend unavailable, using mock dispute metrics');
      
      // Mock dispute metrics
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockMetrics: DisputeMetrics = {
        totalDisputes: 0,
        openDisputes: 0,
        inReviewDisputes: 0,
        resolvedDisputes: 0,
        closedDisputes: 0,
        averageResolutionTime: 0,
        escalationRate: 0,
        priorityBreakdown: {
          URGENT: 0,
          HIGH: 0,
          MEDIUM: 0,
          LOW: 0
        }
      };
      
      // Notify metrics listeners
      this.notifyMetricsListeners(mockMetrics);
      
      return {
        success: true,
        data: mockMetrics
      };
    }
  }

  // Calculate SLA status
  calculateSLAStatus(dispute: Dispute): 'ON_TIME' | 'AT_RISK' | 'OVERDUE' {
    const createdAt = new Date(dispute.createdAt);
    const now = new Date();
    const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    // SLA thresholds based on priority
    const thresholds = {
      URGENT: 24,    // 24 hours
      HIGH: 72,      // 3 days
      MEDIUM: 168,   // 7 days
      LOW: 336       // 14 days
    };
    
    const threshold = thresholds[dispute.priority] || thresholds.MEDIUM;
    
    if (hoursElapsed > threshold) {
      return 'OVERDUE';
    } else if (hoursElapsed > threshold * 0.8) {
      return 'AT_RISK';
    } else {
      return 'ON_TIME';
    }
  }

  // Calculate time to resolution
  calculateTimeToResolution(dispute: Dispute): number {
    if (dispute.status === 'RESOLVED' && dispute.resolvedAt) {
      const createdAt = new Date(dispute.createdAt);
      const resolvedAt = new Date(dispute.resolvedAt);
      return (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    }
    
    const createdAt = new Date(dispute.createdAt);
    const now = new Date();
    return (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  }
}

export const disputeService = new DisputeService();
