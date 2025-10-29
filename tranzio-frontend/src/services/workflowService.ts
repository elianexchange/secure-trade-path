import { disputeService, Dispute } from './disputeService';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'AUTO_ESCALATE' | 'SEND_NOTIFICATION' | 'ASSIGN_ADMIN' | 'UPDATE_STATUS' | 'SET_PRIORITY' | 'SEND_EMAIL' | 'CREATE_TASK';
  parameters: Record<string, any>;
  delay?: number; // in minutes
}

export interface SLAConfig {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  maxHours: number;
  escalationHours: number;
  autoResolveHours?: number;
}

export interface EscalationMatrix {
  fromStatus: string;
  toStatus: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
}

export interface AdminWorkload {
  adminId: string;
  adminName: string;
  currentLoad: number;
  maxLoad: number;
  specialties: string[];
  availability: 'ONLINE' | 'AWAY' | 'OFFLINE';
  lastActive: string;
}

class WorkflowService {
  private rules: WorkflowRule[] = [];
  private slaConfigs: SLAConfig[] = [];
  private escalationMatrix: EscalationMatrix[] = [];
  private adminWorkload: AdminWorkload[] = [];
  private isRunning = false;

  constructor() {
    this.initializeDefaultRules();
    this.initializeSLAConfigs();
    this.initializeEscalationMatrix();
    this.startWorkflowEngine();
  }

  private initializeDefaultRules() {
    this.rules = [
      {
        id: 'auto_escalate_urgent',
        name: 'Auto-escalate Urgent Disputes',
        description: 'Automatically escalate urgent disputes after 2 hours',
        conditions: [
          { field: 'priority', operator: 'equals', value: 'URGENT' },
          { field: 'status', operator: 'equals', value: 'OPEN' }
        ],
        actions: [
          { 
            type: 'AUTO_ESCALATE', 
            parameters: { 
              toStatus: 'IN_REVIEW',
              reason: 'Auto-escalated due to urgent priority and time threshold'
            },
            delay: 120 // 2 hours
          },
          {
            type: 'SEND_NOTIFICATION',
            parameters: {
              type: 'URGENT_ESCALATION',
              recipients: ['admin', 'manager'],
              message: 'Urgent dispute has been auto-escalated and requires immediate attention'
            }
          }
        ],
        enabled: true,
        priority: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'auto_escalate_overdue',
        name: 'Auto-escalate Overdue Disputes',
        description: 'Automatically escalate disputes that exceed SLA',
        conditions: [
          { field: 'slaStatus', operator: 'equals', value: 'OVERDUE' },
          { field: 'status', operator: 'in', value: ['OPEN', 'IN_REVIEW'] }
        ],
        actions: [
          {
            type: 'AUTO_ESCALATE',
            parameters: {
              toStatus: 'IN_REVIEW',
              reason: 'Auto-escalated due to SLA breach'
            }
          },
          {
            type: 'SEND_NOTIFICATION',
            parameters: {
              type: 'SLA_BREACH',
              recipients: ['admin', 'manager', 'escalation'],
              message: 'Dispute has exceeded SLA and been escalated'
            }
          },
          {
            type: 'SET_PRIORITY',
            parameters: {
              priority: 'URGENT',
              reason: 'Escalated due to SLA breach'
            }
          }
        ],
        enabled: true,
        priority: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'assign_specialist',
        name: 'Assign Specialist Based on Dispute Type',
        description: 'Automatically assign disputes to specialists based on type',
        conditions: [
          { field: 'status', operator: 'equals', value: 'OPEN' },
          { field: 'assignedAdmin', operator: 'equals', value: null }
        ],
        actions: [
          {
            type: 'ASSIGN_ADMIN',
            parameters: {
              assignmentStrategy: 'SPECIALIST_BASED',
              disputeType: '{{disputeType}}'
            }
          }
        ],
        enabled: true,
        priority: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'auto_resolve_abandoned',
        name: 'Auto-resolve Abandoned Disputes',
        description: 'Automatically resolve disputes that have been inactive for 30 days',
        conditions: [
          { field: 'status', operator: 'equals', value: 'OPEN' },
          { field: 'lastActivity', operator: 'less_than', value: 30 * 24 * 60 * 60 * 1000 } // 30 days in milliseconds
        ],
        actions: [
          {
            type: 'UPDATE_STATUS',
            parameters: {
              status: 'CLOSED',
              reason: 'Auto-resolved due to inactivity'
            },
            delay: 30 * 24 * 60 // 30 days in minutes
          },
          {
            type: 'SEND_EMAIL',
            parameters: {
              template: 'DISPUTE_AUTO_RESOLVED',
              recipients: ['raiser', 'accused']
            }
          }
        ],
        enabled: true,
        priority: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private initializeSLAConfigs() {
    this.slaConfigs = [
      {
        priority: 'URGENT',
        maxHours: 24,
        escalationHours: 12,
        autoResolveHours: 48
      },
      {
        priority: 'HIGH',
        maxHours: 72,
        escalationHours: 48,
        autoResolveHours: 168 // 7 days
      },
      {
        priority: 'MEDIUM',
        maxHours: 168, // 7 days
        escalationHours: 120, // 5 days
        autoResolveHours: 720 // 30 days
      },
      {
        priority: 'LOW',
        maxHours: 336, // 14 days
        escalationHours: 240, // 10 days
        autoResolveHours: 1440 // 60 days
      }
    ];
  }

  private initializeEscalationMatrix() {
    this.escalationMatrix = [
      {
        fromStatus: 'OPEN',
        toStatus: 'IN_REVIEW',
        conditions: [
          { field: 'priority', operator: 'in', value: ['HIGH', 'URGENT'] },
          { field: 'timeElapsed', operator: 'greater_than', value: 2 * 60 * 60 * 1000 } // 2 hours
        ],
        actions: [
          {
            type: 'UPDATE_STATUS',
            parameters: { status: 'IN_REVIEW' }
          },
          {
            type: 'SEND_NOTIFICATION',
            parameters: {
              type: 'STATUS_CHANGE',
              message: 'Dispute has been escalated to review status'
            }
          }
        ]
      },
      {
        fromStatus: 'IN_REVIEW',
        toStatus: 'RESOLVED',
        conditions: [
          { field: 'resolution', operator: 'not_equals', value: null },
          { field: 'resolutionAccepted', operator: 'equals', value: true }
        ],
        actions: [
          {
            type: 'UPDATE_STATUS',
            parameters: { status: 'RESOLVED' }
          },
          {
            type: 'SEND_NOTIFICATION',
            parameters: {
              type: 'DISPUTE_RESOLVED',
              message: 'Dispute has been resolved'
            }
          }
        ]
      }
    ];
  }

  private startWorkflowEngine() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Run workflow engine every 5 minutes
    setInterval(() => {
      this.processWorkflows();
    }, 5 * 60 * 1000);
    
    console.log('Workflow engine started');
  }

  private async processWorkflows() {
    try {
      console.log('Processing workflows...');
      
      // Get all active disputes
      const disputesResponse = await disputeService.getUserDisputes();
      if (!disputesResponse.success) return;
      
      const disputes = disputesResponse.data;
      
      // Process each dispute against workflow rules
      for (const dispute of disputes) {
        await this.processDisputeWorkflows(dispute);
      }
      
      console.log('Workflow processing completed');
    } catch (error) {
      console.error('Error processing workflows:', error);
    }
  }

  private async processDisputeWorkflows(dispute: Dispute) {
    // Calculate SLA status
    const slaStatus = disputeService.calculateSLAStatus(dispute);
    const timeToResolution = disputeService.calculateTimeToResolution(dispute);
    
    // Enhanced dispute object with calculated fields
    const enhancedDispute = {
      ...dispute,
      slaStatus,
      timeToResolution,
      timeElapsed: timeToResolution * 60 * 60 * 1000, // Convert to milliseconds
      lastActivity: new Date(dispute.updatedAt).getTime()
    };
    
    // Process each rule
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      
      if (this.evaluateConditions(rule.conditions, enhancedDispute)) {
        await this.executeActions(rule.actions, enhancedDispute);
      }
    }
  }

  private evaluateConditions(conditions: WorkflowCondition[], dispute: any): boolean {
    if (conditions.length === 0) return true;
    
    let result = this.evaluateCondition(conditions[0], dispute);
    
    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, dispute);
      
      if (condition.logicalOperator === 'OR') {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }
    }
    
    return result;
  }

  private evaluateCondition(condition: WorkflowCondition, dispute: any): boolean {
    const fieldValue = this.getFieldValue(dispute, condition.field);
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
      default:
        return false;
    }
  }

  private getFieldValue(dispute: any, field: string): any {
    const fieldParts = field.split('.');
    let value = dispute;
    
    for (const part of fieldParts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private async executeActions(actions: WorkflowAction[], dispute: Dispute) {
    for (const action of actions) {
      try {
        if (action.delay) {
          // Schedule action for later execution
          setTimeout(() => {
            this.executeAction(action, dispute);
          }, action.delay * 60 * 1000); // Convert minutes to milliseconds
        } else {
          await this.executeAction(action, dispute);
        }
      } catch (error) {
        console.error('Error executing action:', action, error);
      }
    }
  }

  private async executeAction(action: WorkflowAction, dispute: Dispute) {
    console.log('Executing action:', action.type, 'for dispute:', dispute.id);
    
    switch (action.type) {
      case 'AUTO_ESCALATE':
        await this.autoEscalate(dispute, action.parameters);
        break;
      case 'SEND_NOTIFICATION':
        await this.sendNotification(dispute, action.parameters);
        break;
      case 'ASSIGN_ADMIN':
        await this.assignAdmin(dispute, action.parameters);
        break;
      case 'UPDATE_STATUS':
        await this.updateStatus(dispute, action.parameters);
        break;
      case 'SET_PRIORITY':
        await this.setPriority(dispute, action.parameters);
        break;
      case 'SEND_EMAIL':
        await this.sendEmail(dispute, action.parameters);
        break;
      case 'CREATE_TASK':
        await this.createTask(dispute, action.parameters);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  private async autoEscalate(dispute: Dispute, parameters: any) {
    // This would typically call the backend API to update the dispute
    console.log('Auto-escalating dispute:', dispute.id, parameters);
    
    // Emit WebSocket event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('disputeUpdated', {
        detail: { 
          dispute: {
            ...dispute,
            status: parameters.toStatus,
            updatedAt: new Date().toISOString()
          }
        }
      }));
    }
  }

  private async sendNotification(dispute: Dispute, parameters: any) {
    console.log('Sending notification for dispute:', dispute.id, parameters);
    
    // This would typically call the notification service
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notification', {
        detail: {
          type: parameters.type,
          title: 'Dispute Update',
          message: parameters.message,
          disputeId: dispute.id,
          priority: 'HIGH'
        }
      }));
    }
  }

  private async assignAdmin(dispute: Dispute, parameters: any) {
    console.log('Assigning admin for dispute:', dispute.id, parameters);
    
    // This would typically call the backend API to assign an admin
    const assignedAdmin = this.findBestAdmin(dispute, parameters);
    
    if (assignedAdmin) {
      console.log('Assigned admin:', assignedAdmin.adminName, 'to dispute:', dispute.id);
    }
  }

  private async updateStatus(dispute: Dispute, parameters: any) {
    console.log('Updating status for dispute:', dispute.id, parameters);
    
    // This would typically call the backend API to update the dispute status
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('disputeUpdated', {
        detail: { 
          dispute: {
            ...dispute,
            status: parameters.status,
            updatedAt: new Date().toISOString()
          }
        }
      }));
    }
  }

  private async setPriority(dispute: Dispute, parameters: any) {
    console.log('Setting priority for dispute:', dispute.id, parameters);
    
    // This would typically call the backend API to update the dispute priority
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('disputeUpdated', {
        detail: { 
          dispute: {
            ...dispute,
            priority: parameters.priority,
            updatedAt: new Date().toISOString()
          }
        }
      }));
    }
  }

  private async sendEmail(dispute: Dispute, parameters: any) {
    console.log('Sending email for dispute:', dispute.id, parameters);
    
    // This would typically call the email service
  }

  private async createTask(dispute: Dispute, parameters: any) {
    console.log('Creating task for dispute:', dispute.id, parameters);
    
    // This would typically call the task management service
  }

  private findBestAdmin(dispute: Dispute, parameters: any): AdminWorkload | null {
    // Simple admin assignment logic
    // In a real implementation, this would consider:
    // - Admin availability
    // - Workload
    // - Specialties
    // - Geographic location
    // - Language preferences
    
    const availableAdmins = this.adminWorkload.filter(admin => 
      admin.availability === 'ONLINE' && admin.currentLoad < admin.maxLoad
    );
    
    if (availableAdmins.length === 0) {
      return null;
    }
    
    // For now, just return the first available admin
    // In practice, you'd implement more sophisticated matching
    return availableAdmins[0];
  }

  // Public methods for managing workflows
  public getRules(): WorkflowRule[] {
    return this.rules;
  }

  public addRule(rule: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt'>): WorkflowRule {
    const newRule: WorkflowRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.rules.push(newRule);
    this.rules.sort((a, b) => a.priority - b.priority);
    
    return newRule;
  }

  public updateRule(ruleId: string, updates: Partial<WorkflowRule>): WorkflowRule | null {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return null;
    
    this.rules[ruleIndex] = {
      ...this.rules[ruleIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.rules[ruleIndex];
  }

  public deleteRule(ruleId: string): boolean {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return false;
    
    this.rules.splice(ruleIndex, 1);
    return true;
  }

  public getSLAConfigs(): SLAConfig[] {
    return this.slaConfigs;
  }

  public updateSLAConfig(priority: string, config: Partial<SLAConfig>): SLAConfig | null {
    const configIndex = this.slaConfigs.findIndex(c => c.priority === priority);
    if (configIndex === -1) return null;
    
    this.slaConfigs[configIndex] = {
      ...this.slaConfigs[configIndex],
      ...config
    };
    
    return this.slaConfigs[configIndex];
  }

  public getEscalationMatrix(): EscalationMatrix[] {
    return this.escalationMatrix;
  }

  public addEscalationRule(rule: EscalationMatrix): void {
    this.escalationMatrix.push(rule);
  }

  public getAdminWorkload(): AdminWorkload[] {
    return this.adminWorkload;
  }

  public updateAdminWorkload(adminId: string, workload: Partial<AdminWorkload>): AdminWorkload | null {
    const adminIndex = this.adminWorkload.findIndex(admin => admin.adminId === adminId);
    if (adminIndex === -1) return null;
    
    this.adminWorkload[adminIndex] = {
      ...this.adminWorkload[adminIndex],
      ...workload
    };
    
    return this.adminWorkload[adminIndex];
  }

  public stopWorkflowEngine(): void {
    this.isRunning = false;
    console.log('Workflow engine stopped');
  }
}

export const workflowService = new WorkflowService();
