import { disputeService, Dispute } from './disputeService';
import { workflowService } from './workflowService';

export interface DisputeTrackingEvent {
  id: string;
  disputeId: string;
  type: 'STATUS_CHANGE' | 'PRIORITY_CHANGE' | 'ASSIGNMENT_CHANGE' | 'MESSAGE_ADDED' | 'EVIDENCE_ADDED' | 'RESOLUTION_PROPOSED' | 'RESOLUTION_ACCEPTED' | 'RESOLUTION_REJECTED' | 'SLA_BREACH' | 'ESCALATION' | 'AUTO_ACTION';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface DisputeTrackingMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  averageResponseTime: number; // in minutes
  escalationRate: number; // percentage
  resolutionRate: number; // percentage
  timeToResolution: number; // in hours
}

export interface DisputeTrackingDashboard {
  activeDisputes: number;
  eventsToday: number;
  escalationsToday: number;
  averageResolutionTime: number;
  recentEvents: DisputeTrackingEvent[];
  urgentAlerts: DisputeTrackingEvent[];
  performanceMetrics: DisputeTrackingMetrics;
}

export interface TrackingFilter {
  disputeId?: string;
  type?: string;
  severity?: string;
  userId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  offset?: number;
}

class DisputeTrackingService {
  private events: DisputeTrackingEvent[] = [];
  private listeners: ((events: DisputeTrackingEvent[]) => void)[] = [];
  private metricsListeners: ((metrics: DisputeTrackingMetrics) => void)[] = [];
  private isTracking = false;
  private trackingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startTracking();
    this.setupEventListeners();
  }

  private startTracking() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    
    // Track disputes every 30 seconds
    this.trackingInterval = setInterval(() => {
      this.trackDisputes();
    }, 30 * 1000);
    
    console.log('Dispute tracking service started');
  }

  private stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    this.isTracking = false;
    console.log('Dispute tracking service stopped');
  }

  private setupEventListeners() {
    // Listen for dispute updates
    if (typeof window !== 'undefined') {
      window.addEventListener('disputeUpdated', this.handleDisputeUpdate.bind(this));
      window.addEventListener('disputeCreated', this.handleDisputeCreated.bind(this));
      window.addEventListener('disputeResolved', this.handleDisputeResolved.bind(this));
      window.addEventListener('disputeEscalated', this.handleDisputeEscalated.bind(this));
    }
  }

  private handleDisputeUpdate(event: CustomEvent) {
    const { dispute, previousDispute } = event.detail;
    this.trackDisputeChange(dispute, previousDispute);
  }

  private handleDisputeCreated(event: CustomEvent) {
    const { dispute } = event.detail;
    this.createTrackingEvent({
      disputeId: dispute.id,
      type: 'STATUS_CHANGE',
      title: 'Dispute Created',
      description: `New dispute "${dispute.reason}" has been created`,
      severity: 'MEDIUM',
      metadata: {
        disputeType: dispute.disputeType,
        priority: dispute.priority,
        raisedBy: dispute.raisedBy
      }
    });
  }

  private handleDisputeResolved(event: CustomEvent) {
    const { dispute } = event.detail;
    this.createTrackingEvent({
      disputeId: dispute.id,
      type: 'STATUS_CHANGE',
      title: 'Dispute Resolved',
      description: `Dispute "${dispute.reason}" has been resolved`,
      severity: 'HIGH',
      metadata: {
        resolution: dispute.resolution,
        resolvedBy: dispute.resolvedBy,
        resolvedAt: dispute.resolvedAt
      }
    });
  }

  private handleDisputeEscalated(event: CustomEvent) {
    const { dispute, reason } = event.detail;
    this.createTrackingEvent({
      disputeId: dispute.id,
      type: 'ESCALATION',
      title: 'Dispute Escalated',
      description: `Dispute "${dispute.reason}" has been escalated: ${reason}`,
      severity: 'CRITICAL',
      metadata: {
        reason,
        previousStatus: dispute.status,
        escalatedAt: new Date().toISOString()
      }
    });
  }

  private async trackDisputes() {
    try {
      // Get all disputes
      const disputesResponse = await disputeService.getUserDisputes();
      if (!disputesResponse.success) return;

      const disputes = disputesResponse.data;
      
      // Check for SLA breaches
      for (const dispute of disputes) {
        await this.checkSLABreach(dispute);
        await this.checkAutoEscalation(dispute);
      }
    } catch (error) {
      console.error('Error tracking disputes:', error);
    }
  }

  private async checkSLABreach(dispute: Dispute) {
    const slaStatus = disputeService.calculateSLAStatus(dispute);
    
    if (slaStatus === 'OVERDUE' && dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED') {
      // Check if we already have an SLA breach event for this dispute
      const existingEvent = this.events.find(event => 
        event.disputeId === dispute.id && 
        event.type === 'SLA_BREACH' &&
        new Date(event.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
      );

      if (!existingEvent) {
        this.createTrackingEvent({
          disputeId: dispute.id,
          type: 'SLA_BREACH',
          title: 'SLA Breach Detected',
          description: `Dispute "${dispute.reason}" has exceeded its SLA threshold`,
          severity: 'CRITICAL',
          metadata: {
            priority: dispute.priority,
            timeElapsed: disputeService.calculateTimeToResolution(dispute),
            slaStatus
          }
        });
      }
    }
  }

  private async checkAutoEscalation(dispute: Dispute) {
    // Check if dispute should be auto-escalated based on workflow rules
    const rules = workflowService.getRules();
    
    for (const rule of rules) {
      if (!rule.enabled) continue;
      
      // This would typically check if the rule conditions are met
      // and if an escalation should occur
      if (rule.name.includes('Auto-escalate') && dispute.status === 'OPEN') {
        const timeElapsed = disputeService.calculateTimeToResolution(dispute);
        const shouldEscalate = this.shouldAutoEscalate(dispute, timeElapsed);
        
        if (shouldEscalate) {
          this.createTrackingEvent({
            disputeId: dispute.id,
            type: 'AUTO_ACTION',
            title: 'Auto-escalation Triggered',
            description: `Dispute "${dispute.reason}" has been auto-escalated based on workflow rules`,
            severity: 'HIGH',
            metadata: {
              ruleId: rule.id,
              ruleName: rule.name,
              timeElapsed,
              priority: dispute.priority
            }
          });
        }
      }
    }
  }

  private shouldAutoEscalate(dispute: Dispute, timeElapsed: number): boolean {
    const thresholds = {
      URGENT: 2,    // 2 hours
      HIGH: 24,     // 24 hours
      MEDIUM: 72,   // 72 hours
      LOW: 168      // 168 hours (7 days)
    };

    const threshold = thresholds[dispute.priority] || thresholds.MEDIUM;
    return timeElapsed >= threshold;
  }

  private trackDisputeChange(currentDispute: Dispute, previousDispute?: Dispute) {
    if (!previousDispute) return;

    // Track status changes
    if (currentDispute.status !== previousDispute.status) {
      this.createTrackingEvent({
        disputeId: currentDispute.id,
        type: 'STATUS_CHANGE',
        title: 'Status Changed',
        description: `Dispute status changed from ${previousDispute.status} to ${currentDispute.status}`,
        severity: this.getStatusChangeSeverity(previousDispute.status, currentDispute.status),
        metadata: {
          previousStatus: previousDispute.status,
          newStatus: currentDispute.status,
          changedAt: new Date().toISOString()
        }
      });
    }

    // Track priority changes
    if (currentDispute.priority !== previousDispute.priority) {
      this.createTrackingEvent({
        disputeId: currentDispute.id,
        type: 'PRIORITY_CHANGE',
        title: 'Priority Changed',
        description: `Dispute priority changed from ${previousDispute.priority} to ${currentDispute.priority}`,
        severity: this.getPriorityChangeSeverity(previousDispute.priority, currentDispute.priority),
        metadata: {
          previousPriority: previousDispute.priority,
          newPriority: currentDispute.priority,
          changedAt: new Date().toISOString()
        }
      });
    }
  }

  private getStatusChangeSeverity(oldStatus: string, newStatus: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalChanges = ['OPEN', 'IN_REVIEW'].includes(newStatus);
    const highChanges = ['RESOLVED', 'CLOSED'].includes(newStatus);
    
    if (criticalChanges) return 'CRITICAL';
    if (highChanges) return 'HIGH';
    return 'MEDIUM';
  }

  private getPriorityChangeSeverity(oldPriority: string, newPriority: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const priorityLevels = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 };
    const oldLevel = priorityLevels[oldPriority as keyof typeof priorityLevels] || 2;
    const newLevel = priorityLevels[newPriority as keyof typeof priorityLevels] || 2;
    
    if (newLevel > oldLevel) return 'HIGH';
    if (newLevel < oldLevel) return 'LOW';
    return 'MEDIUM';
  }

  private createTrackingEvent(eventData: Omit<DisputeTrackingEvent, 'id' | 'timestamp'>) {
    const event: DisputeTrackingEvent = {
      ...eventData,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.events.unshift(event); // Add to beginning of array
    
    // Keep only last 1000 events to prevent memory issues
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000);
    }

    // Notify listeners
    this.notifyListeners([event]);
    
    // Update metrics
    this.updateMetrics();

    console.log('Dispute tracking event created:', event);
  }

  private notifyListeners(newEvents: DisputeTrackingEvent[]) {
    this.listeners.forEach(listener => listener(newEvents));
  }

  private notifyMetricsListeners(metrics: DisputeTrackingMetrics) {
    this.metricsListeners.forEach(listener => listener(metrics));
  }

  private updateMetrics() {
    const metrics = this.calculateMetrics();
    this.notifyMetricsListeners(metrics);
  }

  private calculateMetrics(): DisputeTrackingMetrics {
    const totalEvents = this.events.length;
    
    // Events by type
    const eventsByType: Record<string, number> = {};
    this.events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    // Events by severity
    const eventsBySeverity: Record<string, number> = {};
    this.events.forEach(event => {
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    // Calculate average response time (simplified)
    const responseEvents = this.events.filter(event => 
      event.type === 'STATUS_CHANGE' || event.type === 'MESSAGE_ADDED'
    );
    const averageResponseTime = responseEvents.length > 0 ? 30 : 0; // Mock calculation

    // Calculate escalation rate
    const escalationEvents = this.events.filter(event => event.type === 'ESCALATION').length;
    const escalationRate = totalEvents > 0 ? (escalationEvents / totalEvents) * 100 : 0;

    // Calculate resolution rate
    const resolutionEvents = this.events.filter(event => 
      event.type === 'STATUS_CHANGE' && 
      event.metadata?.newStatus === 'RESOLVED'
    ).length;
    const resolutionRate = totalEvents > 0 ? (resolutionEvents / totalEvents) * 100 : 0;

    // Calculate average time to resolution (simplified)
    const timeToResolution = 24; // Mock calculation

    return {
      totalEvents,
      eventsByType,
      eventsBySeverity,
      averageResponseTime,
      escalationRate,
      resolutionRate,
      timeToResolution
    };
  }

  // Public methods
  public addEventListener(listener: (events: DisputeTrackingEvent[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public addMetricsListener(listener: (metrics: DisputeTrackingMetrics) => void) {
    this.metricsListeners.push(listener);
    return () => {
      this.metricsListeners = this.metricsListeners.filter(l => l !== listener);
    };
  }

  public getEvents(filter?: TrackingFilter): DisputeTrackingEvent[] {
    let filteredEvents = [...this.events];

    if (filter?.disputeId) {
      filteredEvents = filteredEvents.filter(event => event.disputeId === filter.disputeId);
    }

    if (filter?.type) {
      filteredEvents = filteredEvents.filter(event => event.type === filter.type);
    }

    if (filter?.severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === filter.severity);
    }

    if (filter?.userId) {
      filteredEvents = filteredEvents.filter(event => event.userId === filter.userId);
    }

    if (filter?.dateRange) {
      const startDate = new Date(filter.dateRange.start);
      const endDate = new Date(filter.dateRange.end);
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.timestamp);
        return eventDate >= startDate && eventDate <= endDate;
      });
    }

    // Apply pagination
    if (filter?.offset) {
      filteredEvents = filteredEvents.slice(filter.offset);
    }
    if (filter?.limit) {
      filteredEvents = filteredEvents.slice(0, filter.limit);
    }

    return filteredEvents;
  }

  public getMetrics(): DisputeTrackingMetrics {
    return this.calculateMetrics();
  }

  public getDashboard(): DisputeTrackingDashboard {
    const metrics = this.calculateMetrics();
    const recentEvents = this.events.slice(0, 10);
    const urgentAlerts = this.events.filter(event => 
      event.severity === 'CRITICAL' || event.severity === 'HIGH'
    ).slice(0, 5);

    return {
      activeDisputes: 0, // Would be calculated from actual dispute data
      eventsToday: this.events.filter(event => {
        const today = new Date();
        const eventDate = new Date(event.timestamp);
        return eventDate.toDateString() === today.toDateString();
      }).length,
      escalationsToday: this.events.filter(event => 
        event.type === 'ESCALATION' && 
        new Date(event.timestamp).toDateString() === new Date().toDateString()
      ).length,
      averageResolutionTime: metrics.timeToResolution,
      recentEvents,
      urgentAlerts,
      performanceMetrics: metrics
    };
  }

  public trackCustomEvent(disputeId: string, type: string, title: string, description: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM', metadata?: Record<string, any>) {
    this.createTrackingEvent({
      disputeId,
      type: type as any,
      title,
      description,
      severity,
      metadata
    });
  }

  public clearEvents() {
    this.events = [];
    this.updateMetrics();
  }

  public destroy() {
    this.stopTracking();
    this.listeners = [];
    this.metricsListeners = [];
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('disputeUpdated', this.handleDisputeUpdate.bind(this));
      window.removeEventListener('disputeCreated', this.handleDisputeCreated.bind(this));
      window.removeEventListener('disputeResolved', this.handleDisputeResolved.bind(this));
      window.removeEventListener('disputeEscalated', this.handleDisputeEscalated.bind(this));
    }
  }
}

export const disputeTrackingService = new DisputeTrackingService();
