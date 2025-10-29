import { disputeService, Dispute } from './disputeService';
import { disputeTrackingService } from './disputeTrackingService';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'DISPUTE' | 'TRANSACTION' | 'SYSTEM' | 'SECURITY' | 'PAYMENT';
  category: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'URGENT';
  title: string;
  message: string;
  variables: string[];
  channels: ('EMAIL' | 'SMS' | 'PUSH' | 'IN_APP')[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  conditions: NotificationCondition[];
  templateId: string;
  channels: ('EMAIL' | 'SMS' | 'PUSH' | 'IN_APP')[];
  enabled: boolean;
  priority: number;
  cooldownMinutes: number; // Prevent spam
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface NotificationData {
  id: string;
  userId: string;
  type: string;
  category: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: ('EMAIL' | 'SMS' | 'PUSH' | 'IN_APP')[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  categories: {
    DISPUTE: boolean;
    TRANSACTION: boolean;
    SYSTEM: boolean;
    SECURITY: boolean;
    PAYMENT: boolean;
  };
  frequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY';
  digestEnabled: boolean;
}

export interface NotificationDigest {
  id: string;
  userId: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  period: {
    start: string;
    end: string;
  };
  notifications: NotificationData[];
  summary: {
    total: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    urgent: number;
  };
  generatedAt: string;
  sentAt?: string;
}

class EnhancedNotificationService {
  private templates: NotificationTemplate[] = [];
  private rules: NotificationRule[] = [];
  private notifications: NotificationData[] = [];
  private preferences: Map<string, NotificationPreferences> = new Map();
  private listeners: ((notifications: NotificationData[]) => void)[] = [];
  private isRunning = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeTemplates();
    this.initializeRules();
    this.startProcessing();
    this.setupEventListeners();
  }

  private initializeTemplates() {
    this.templates = [
      {
        id: 'dispute_created',
        name: 'Dispute Created',
        type: 'DISPUTE',
        category: 'WARNING',
        title: 'New Dispute: {{disputeReason}}',
        message: 'A new dispute has been created for transaction {{transactionId}}. Reason: {{disputeReason}}. Priority: {{priority}}.',
        variables: ['disputeReason', 'transactionId', 'priority'],
        channels: ['EMAIL', 'PUSH', 'IN_APP'],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'dispute_escalated',
        name: 'Dispute Escalated',
        type: 'DISPUTE',
        category: 'URGENT',
        title: 'Dispute Escalated: {{disputeReason}}',
        message: 'Dispute {{disputeId}} has been escalated due to {{escalationReason}}. Immediate attention required.',
        variables: ['disputeReason', 'disputeId', 'escalationReason'],
        channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'dispute_resolved',
        name: 'Dispute Resolved',
        type: 'DISPUTE',
        category: 'SUCCESS',
        title: 'Dispute Resolved: {{disputeReason}}',
        message: 'Dispute {{disputeId}} has been resolved. Resolution: {{resolution}}. Resolution notes: {{resolutionNotes}}.',
        variables: ['disputeReason', 'disputeId', 'resolution', 'resolutionNotes'],
        channels: ['EMAIL', 'PUSH', 'IN_APP'],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sla_breach',
        name: 'SLA Breach',
        type: 'DISPUTE',
        category: 'ERROR',
        title: 'SLA Breach: {{disputeReason}}',
        message: 'Dispute {{disputeId}} has exceeded its SLA threshold. Time elapsed: {{timeElapsed}} hours.',
        variables: ['disputeReason', 'disputeId', 'timeElapsed'],
        channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'evidence_added',
        name: 'Evidence Added',
        type: 'DISPUTE',
        category: 'INFO',
        title: 'New Evidence: {{disputeReason}}',
        message: 'New evidence has been added to dispute {{disputeId}}. File: {{fileName}}. Type: {{fileType}}.',
        variables: ['disputeReason', 'disputeId', 'fileName', 'fileType'],
        channels: ['PUSH', 'IN_APP'],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'message_added',
        name: 'Message Added',
        type: 'DISPUTE',
        category: 'INFO',
        title: 'New Message: {{disputeReason}}',
        message: 'A new message has been added to dispute {{disputeId}} by {{senderName}}.',
        variables: ['disputeReason', 'disputeId', 'senderName'],
        channels: ['PUSH', 'IN_APP'],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'resolution_proposed',
        name: 'Resolution Proposed',
        type: 'DISPUTE',
        category: 'INFO',
        title: 'Resolution Proposed: {{disputeReason}}',
        message: 'A resolution has been proposed for dispute {{disputeId}}. Resolution: {{resolution}}. Please review and respond.',
        variables: ['disputeReason', 'disputeId', 'resolution'],
        channels: ['EMAIL', 'PUSH', 'IN_APP'],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'security_alert',
        name: 'Security Alert',
        type: 'SECURITY',
        category: 'ERROR',
        title: 'Security Alert: {{alertType}}',
        message: 'A security alert has been triggered: {{alertDescription}}. Please review immediately.',
        variables: ['alertType', 'alertDescription'],
        channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private initializeRules() {
    this.rules = [
      {
        id: 'dispute_created_rule',
        name: 'Notify on Dispute Creation',
        description: 'Send notification when a new dispute is created',
        conditions: [
          { field: 'type', operator: 'equals', value: 'DISPUTE_CREATED' }
        ],
        templateId: 'dispute_created',
        channels: ['EMAIL', 'PUSH', 'IN_APP'],
        enabled: true,
        priority: 1,
        cooldownMinutes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'dispute_escalated_rule',
        name: 'Notify on Dispute Escalation',
        description: 'Send urgent notification when a dispute is escalated',
        conditions: [
          { field: 'type', operator: 'equals', value: 'DISPUTE_ESCALATED' }
        ],
        templateId: 'dispute_escalated',
        channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
        enabled: true,
        priority: 1,
        cooldownMinutes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sla_breach_rule',
        name: 'Notify on SLA Breach',
        description: 'Send urgent notification when SLA is breached',
        conditions: [
          { field: 'type', operator: 'equals', value: 'SLA_BREACH' }
        ],
        templateId: 'sla_breach',
        channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
        enabled: true,
        priority: 1,
        cooldownMinutes: 60, // 1 hour cooldown
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private startProcessing() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Process notifications every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processNotifications();
    }, 30 * 1000);
    
    console.log('Enhanced notification service started');
  }

  private stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isRunning = false;
    console.log('Enhanced notification service stopped');
  }

  private setupEventListeners() {
    // Listen for dispute tracking events
    disputeTrackingService.addEventListener((events) => {
      events.forEach(event => {
        this.processTrackingEvent(event);
      });
    });

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
    this.processDisputeUpdate(dispute, previousDispute);
  }

  private handleDisputeCreated(event: CustomEvent) {
    const { dispute } = event.detail;
    this.processDisputeCreated(dispute);
  }

  private handleDisputeResolved(event: CustomEvent) {
    const { dispute } = event.detail;
    this.processDisputeResolved(dispute);
  }

  private handleDisputeEscalated(event: CustomEvent) {
    const { dispute, reason } = event.detail;
    this.processDisputeEscalated(dispute, reason);
  }

  private processTrackingEvent(event: any) {
    // Map tracking events to notification triggers
    const eventTypeMap: Record<string, string> = {
      'STATUS_CHANGE': 'DISPUTE_STATUS_CHANGED',
      'PRIORITY_CHANGE': 'DISPUTE_PRIORITY_CHANGED',
      'MESSAGE_ADDED': 'DISPUTE_MESSAGE_ADDED',
      'EVIDENCE_ADDED': 'DISPUTE_EVIDENCE_ADDED',
      'RESOLUTION_PROPOSED': 'DISPUTE_RESOLUTION_PROPOSED',
      'SLA_BREACH': 'SLA_BREACH',
      'ESCALATION': 'DISPUTE_ESCALATED'
    };

    const notificationType = eventTypeMap[event.type];
    if (notificationType) {
      this.triggerNotification(notificationType, {
        disputeId: event.disputeId,
        event: event,
        ...event.metadata
      });
    }
  }

  private processDisputeCreated(dispute: Dispute) {
    this.triggerNotification('DISPUTE_CREATED', {
      disputeId: dispute.id,
      disputeReason: dispute.reason,
      transactionId: dispute.transactionId,
      priority: dispute.priority,
      dispute: dispute
    });
  }

  private processDisputeUpdate(dispute: Dispute, previousDispute?: Dispute) {
    if (!previousDispute) return;

    if (dispute.status !== previousDispute.status) {
      this.triggerNotification('DISPUTE_STATUS_CHANGED', {
        disputeId: dispute.id,
        disputeReason: dispute.reason,
        previousStatus: previousDispute.status,
        newStatus: dispute.status,
        dispute: dispute
      });
    }

    if (dispute.priority !== previousDispute.priority) {
      this.triggerNotification('DISPUTE_PRIORITY_CHANGED', {
        disputeId: dispute.id,
        disputeReason: dispute.reason,
        previousPriority: previousDispute.priority,
        newPriority: dispute.priority,
        dispute: dispute
      });
    }
  }

  private processDisputeResolved(dispute: Dispute) {
    this.triggerNotification('DISPUTE_RESOLVED', {
      disputeId: dispute.id,
      disputeReason: dispute.reason,
      resolution: dispute.resolution,
      resolutionNotes: dispute.resolutionNotes,
      dispute: dispute
    });
  }

  private processDisputeEscalated(dispute: Dispute, reason: string) {
    this.triggerNotification('DISPUTE_ESCALATED', {
      disputeId: dispute.id,
      disputeReason: dispute.reason,
      escalationReason: reason,
      dispute: dispute
    });
  }

  private async processNotifications() {
    try {
      const pendingNotifications = this.notifications.filter(n => n.status === 'PENDING');
      
      for (const notification of pendingNotifications) {
        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error('Error processing notifications:', error);
    }
  }

  private triggerNotification(type: string, data: Record<string, any>) {
    // Find matching rules
    const matchingRules = this.rules.filter(rule => 
      rule.enabled && this.evaluateConditions(rule.conditions, { type, ...data })
    );

    // Sort by priority
    matchingRules.sort((a, b) => a.priority - b.priority);

    // Process each matching rule
    for (const rule of matchingRules) {
      this.createNotification(rule, data);
    }
  }

  private evaluateConditions(conditions: NotificationCondition[], data: any): boolean {
    if (conditions.length === 0) return true;
    
    let result = this.evaluateCondition(conditions[0], data);
    
    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, data);
      
      if (condition.logicalOperator === 'OR') {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }
    }
    
    return result;
  }

  private evaluateCondition(condition: NotificationCondition, data: any): boolean {
    const fieldValue = this.getFieldValue(data, condition.field);
    const conditionValue = condition.value;
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'greater_than':
        return fieldValue > conditionValue;
      case 'less_than':
        return fieldValue < conditionValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      case 'is_null':
        return fieldValue === null || fieldValue === undefined;
      case 'is_not_null':
        return fieldValue !== null && fieldValue !== undefined;
      default:
        return false;
    }
  }

  private getFieldValue(data: any, field: string): any {
    const fieldParts = field.split('.');
    let value = data;
    
    for (const part of fieldParts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private createNotification(rule: NotificationRule, data: Record<string, any>) {
    const template = this.templates.find(t => t.id === rule.templateId);
    if (!template || !template.enabled) return;

    // Check cooldown
    if (rule.cooldownMinutes > 0) {
      const recentNotification = this.notifications.find(n => 
        n.data?.ruleId === rule.id &&
        n.data?.disputeId === data.disputeId &&
        new Date(n.createdAt) > new Date(Date.now() - rule.cooldownMinutes * 60 * 1000)
      );
      
      if (recentNotification) return;
    }

    // Get user preferences
    const userId = data.dispute?.raisedBy || data.dispute?.raisedAgainst || 'system';
    const preferences = this.getUserPreferences(userId);

    // Filter channels based on user preferences
    const allowedChannels = rule.channels.filter(channel => {
      switch (channel) {
        case 'EMAIL':
          return preferences.email;
        case 'SMS':
          return preferences.sms;
        case 'PUSH':
          return preferences.push;
        case 'IN_APP':
          return preferences.inApp;
        default:
          return true;
      }
    });

    if (allowedChannels.length === 0) return;

    // Render template
    const title = this.renderTemplate(template.title, data);
    const message = this.renderTemplate(template.message, data);

    const notification: NotificationData = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: template.type,
      category: template.category,
      title,
      message,
      data: {
        ...data,
        ruleId: rule.id,
        templateId: template.id
      },
      channels: allowedChannels,
      priority: this.getPriorityFromCategory(template.category),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.notifications.unshift(notification);
    this.notifyListeners([notification]);

    console.log('Notification created:', notification);
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return data[variable] || match;
    });
  }

  private getPriorityFromCategory(category: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    switch (category) {
      case 'URGENT':
        return 'URGENT';
      case 'ERROR':
        return 'HIGH';
      case 'WARNING':
        return 'MEDIUM';
      case 'SUCCESS':
      case 'INFO':
        return 'LOW';
      default:
        return 'MEDIUM';
    }
  }

  private async sendNotification(notification: NotificationData) {
    try {
      // Check quiet hours
      const preferences = this.getUserPreferences(notification.userId);
      if (this.isQuietHours(preferences)) {
        // Schedule for later
        return;
      }

      // Send through each channel
      for (const channel of notification.channels) {
        await this.sendToChannel(notification, channel);
      }

      // Update notification status
      notification.status = 'SENT';
      notification.sentAt = new Date().toISOString();
      
      this.notifyListeners([notification]);
    } catch (error) {
      console.error('Error sending notification:', error);
      notification.status = 'FAILED';
      this.notifyListeners([notification]);
    }
  }

  private async sendToChannel(notification: NotificationData, channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP') {
    switch (channel) {
      case 'EMAIL':
        await this.sendEmail(notification);
        break;
      case 'SMS':
        await this.sendSMS(notification);
        break;
      case 'PUSH':
        await this.sendPush(notification);
        break;
      case 'IN_APP':
        await this.sendInApp(notification);
        break;
    }
  }

  private async sendEmail(notification: NotificationData) {
    // Mock email sending
    console.log('Sending email notification:', notification.title);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendSMS(notification: NotificationData) {
    // Mock SMS sending
    console.log('Sending SMS notification:', notification.title);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendPush(notification: NotificationData) {
    // Mock push notification
    console.log('Sending push notification:', notification.title);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendInApp(notification: NotificationData) {
    // Emit in-app notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notification', {
        detail: notification
      }));
    }
  }

  private isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: preferences.quietHours.timezone 
    });
    
    const startTime = preferences.quietHours.start;
    const endTime = preferences.quietHours.end;
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  private getUserPreferences(userId: string): NotificationPreferences {
    return this.preferences.get(userId) || {
      userId,
      email: true,
      sms: true,
      push: true,
      inApp: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      },
      categories: {
        DISPUTE: true,
        TRANSACTION: true,
        SYSTEM: true,
        SECURITY: true,
        PAYMENT: true
      },
      frequency: 'IMMEDIATE',
      digestEnabled: false
    };
  }

  private notifyListeners(notifications: NotificationData[]) {
    this.listeners.forEach(listener => listener(notifications));
  }

  // Public methods
  public addEventListener(listener: (notifications: NotificationData[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getNotifications(userId?: string, limit?: number): NotificationData[] {
    let filteredNotifications = [...this.notifications];
    
    if (userId) {
      filteredNotifications = filteredNotifications.filter(n => n.userId === userId);
    }
    
    if (limit) {
      filteredNotifications = filteredNotifications.slice(0, limit);
    }
    
    return filteredNotifications;
  }

  public markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.status = 'READ';
      notification.readAt = new Date().toISOString();
      this.notifyListeners([notification]);
    }
  }

  public markAsDelivered(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.status = 'DELIVERED';
      notification.deliveredAt = new Date().toISOString();
      this.notifyListeners([notification]);
    }
  }

  public updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    const currentPreferences = this.getUserPreferences(userId);
    const updatedPreferences = { ...currentPreferences, ...preferences };
    this.preferences.set(userId, updatedPreferences);
  }

  public getUserPreferences(userId: string): NotificationPreferences {
    return this.getUserPreferences(userId);
  }

  public createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): NotificationTemplate {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.templates.push(newTemplate);
    return newTemplate;
  }

  public createRule(rule: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>): NotificationRule {
    const newRule: NotificationRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.rules.push(newRule);
    return newRule;
  }

  public getTemplates(): NotificationTemplate[] {
    return this.templates;
  }

  public getRules(): NotificationRule[] {
    return this.rules;
  }

  public destroy() {
    this.stopProcessing();
    this.listeners = [];
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('disputeUpdated', this.handleDisputeUpdate.bind(this));
      window.removeEventListener('disputeCreated', this.handleDisputeCreated.bind(this));
      window.removeEventListener('disputeResolved', this.handleDisputeResolved.bind(this));
      window.removeEventListener('disputeEscalated', this.handleDisputeEscalated.bind(this));
    }
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();
