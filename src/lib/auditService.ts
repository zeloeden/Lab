// Enhanced Audit Service for comprehensive user tracking
import { db } from './database';
import { AuditLog, UserActivity, UserAction, AuditAction } from './types';

export interface AuditContext {
  userId: string;
  userName: string;
  userRole: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  private static instance: AuditService;
  private currentContext: AuditContext | null = null;

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Set the current user context for audit logging
   */
  setContext(context: AuditContext): void {
    this.currentContext = context;
  }

  /**
   * Get current context
   */
  getContext(): AuditContext | null {
    return this.currentContext;
  }

  /**
   * Log a user activity
   */
  async logActivity(
    action: UserAction,
    entityType: string,
    entityId: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.currentContext) {
      console.warn('No audit context set, skipping activity log');
      return;
    }

    try {
      await db.logUserActivity({
        userId: this.currentContext.userId,
        userName: this.currentContext.userName,
        userRole: this.currentContext.userRole,
        action,
        entityType,
        entityId,
        entityName: await this.getEntityName(entityType, entityId),
        description,
        sessionId: this.currentContext.sessionId,
        ipAddress: this.currentContext.ipAddress,
        metadata
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  }

  /**
   * Log an audit trail entry
   */
  async logAudit(
    action: AuditAction,
    entityType: string,
    entityId: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
    description?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    if (!this.currentContext) {
      console.warn('No audit context set, skipping audit log');
      return;
    }

    try {
      const affectedFields = this.getAffectedFields(oldValues, newValues);
      
      await db.auditLogs.add({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entityType,
        entityId,
        action,
        oldValues,
        newValues,
        userId: this.currentContext.userId,
        userName: this.currentContext.userName,
        userRole: this.currentContext.userRole,
        timestamp: new Date(),
        ipAddress: this.currentContext.ipAddress,
        userAgent: this.currentContext.userAgent,
        sessionId: this.currentContext.sessionId,
        description: description || this.generateAuditDescription(action, entityType, affectedFields),
        affectedFields,
        severity
      });
    } catch (error) {
      console.error('Error logging audit trail:', error);
    }
  }

  /**
   * Log sample creation
   */
  async logSampleCreation(sampleId: string, sampleData: Record<string, unknown>): Promise<void> {
    await Promise.all([
      this.logActivity('CREATE', 'sample', sampleId, `Created new sample #${sampleData.sampleNo}`, {
        sampleNo: sampleData.sampleNo,
        itemName: sampleData.itemNameEN,
        supplier: sampleData.supplierId,
        patchNumber: sampleData.patchNumber
      }),
      this.logAudit('CREATE', 'sample', sampleId, undefined, sampleData, `Sample #${sampleData.sampleNo} created`)
    ]);
  }

  /**
   * Log sample update
   */
  async logSampleUpdate(
    sampleId: string, 
    oldData: Record<string, unknown>, 
    newData: Record<string, unknown>
  ): Promise<void> {
    const changes = this.getChanges(oldData, newData);
    
    await Promise.all([
      this.logActivity('UPDATE', 'sample', sampleId, `Updated sample #${newData.sampleNo}`, {
        sampleNo: newData.sampleNo,
        changes: Object.keys(changes)
      }),
      this.logAudit('UPDATE', 'sample', sampleId, oldData, newData, `Sample #${newData.sampleNo} updated`)
    ]);
  }

  /**
   * Log sample deletion
   */
  async logSampleDeletion(sampleId: string, sampleData: Record<string, unknown>): Promise<void> {
    await Promise.all([
      this.logActivity('DELETE', 'sample', sampleId, `Deleted sample #${sampleData.sampleNo}`, {
        sampleNo: sampleData.sampleNo,
        itemName: sampleData.itemNameEN
      }),
      this.logAudit('DELETE', 'sample', sampleId, sampleData, undefined, `Sample #${sampleData.sampleNo} deleted`, 'high')
    ]);
  }

  /**
   * Log test approval
   */
  async logTestApproval(testId: string, sampleId: string, sampleNo: number): Promise<void> {
    await Promise.all([
      this.logActivity('APPROVE', 'test', testId, `Approved test for sample #${sampleNo}`, {
        sampleId,
        sampleNo
      }),
      this.logAudit('APPROVE', 'test', testId, undefined, { approved: true }, `Test approved for sample #${sampleNo}`, 'medium')
    ]);
  }

  /**
   * Log user login
   */
  async logUserLogin(userId: string, userName: string, userRole: string): Promise<void> {
    await this.logActivity('LOGIN', 'user', userId, `User ${userName} logged in`, {
      userRole,
      loginTime: new Date().toISOString()
    });
  }

  /**
   * Log user logout
   */
  async logUserLogout(userId: string, userName: string): Promise<void> {
    await this.logActivity('LOGOUT', 'user', userId, `User ${userName} logged out`);
  }

  /**
   * Log search activity
   */
  async logSearch(query: string, resultsCount: number, entityType: string): Promise<void> {
    await this.logActivity('SEARCH', entityType, 'search', `Searched for "${query}"`, {
      query,
      resultsCount,
      entityType
    });
  }

  /**
   * Log export activity
   */
  async logExport(entityType: string, format: string, recordCount: number): Promise<void> {
    await this.logActivity('EXPORT', entityType, 'export', `Exported ${recordCount} ${entityType} records as ${format}`, {
      format,
      recordCount,
      entityType
    });
  }

  /**
   * Get audit logs for an entity
   */
  async getEntityAuditLogs(entityType: string, entityId: string): Promise<AuditLog[]> {
    try {
      return await db.auditLogs
        .where('[entityType+entityId]')
        .equals([entityType, entityId])
        .reverse()
        .sortBy('timestamp');
    } catch (error) {
      console.error('Error getting entity audit logs:', error);
      return [];
    }
  }

  /**
   * Get user activities
   */
  async getUserActivities(userId?: string, limit: number = 100): Promise<UserActivity[]> {
    return await db.getUserActivities(userId, limit);
  }

  /**
   * Get audit logs by user
   */
  async getUserAuditLogs(userId: string, limit: number = 100): Promise<AuditLog[]> {
    try {
      return await db.auditLogs
        .where('userId')
        .equals(userId)
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Error getting user audit logs:', error);
      return [];
    }
  }

  /**
   * Get recent activities across all users
   */
  async getRecentActivities(limit: number = 50): Promise<UserActivity[]> {
    return await db.getUserActivities(undefined, limit);
  }

  // Private helper methods

  private async getEntityName(entityType: string, entityId: string): Promise<string | undefined> {
    try {
      switch (entityType) {
        case 'sample':
          const sample = await db.samples.get(entityId);
          return sample ? `Sample #${sample.sampleNo}` : undefined;
        case 'test':
          const test = await db.tests.get(entityId);
          return test ? `Test ${test.id}` : undefined;
        case 'supplier':
          const supplier = await db.suppliers.get(entityId);
          return supplier ? supplier.name : undefined;
        case 'user':
          const user = await db.users.get(entityId);
          return user ? user.name : undefined;
        default:
          return undefined;
      }
    } catch (error) {
      console.error('Error getting entity name:', error);
      return undefined;
    }
  }

  private getAffectedFields(oldValues?: Record<string, unknown>, newValues?: Record<string, unknown>): string[] {
    if (!oldValues || !newValues) return [];
    
    const fields: string[] = [];
    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        fields.push(key);
      }
    }
    return fields;
  }

  private getChanges(oldData: Record<string, unknown>, newData: Record<string, unknown>): Record<string, { old: unknown; new: unknown }> {
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          old: oldData[key],
          new: newData[key]
        };
      }
    }
    
    return changes;
  }

  private generateAuditDescription(action: AuditAction, entityType: string, affectedFields: string[]): string {
    const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    
    switch (action) {
      case 'CREATE':
        return `${entityName} created`;
      case 'UPDATE':
        return `${entityName} updated (${affectedFields.join(', ')})`;
      case 'DELETE':
        return `${entityName} deleted`;
      case 'APPROVE':
        return `${entityName} approved`;
      case 'REJECT':
        return `${entityName} rejected`;
      default:
        return `${entityName} ${action.toLowerCase()}`;
    }
  }
}

// Export singleton instance
export const auditService = AuditService.getInstance();

// Convenience functions
export const logSampleCreation = (sampleId: string, sampleData: Record<string, unknown>) => 
  auditService.logSampleCreation(sampleId, sampleData);

export const logSampleUpdate = (sampleId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>) => 
  auditService.logSampleUpdate(sampleId, oldData, newData);

export const logSampleDeletion = (sampleId: string, sampleData: Record<string, unknown>) => 
  auditService.logSampleDeletion(sampleId, sampleData);

export const logTestApproval = (testId: string, sampleId: string, sampleNo: number) => 
  auditService.logTestApproval(testId, sampleId, sampleNo);

export const logUserLogin = (userId: string, userName: string, userRole: string) => 
  auditService.logUserLogin(userId, userName, userRole);

export const logUserLogout = (userId: string, userName: string) => 
  auditService.logUserLogout(userId, userName);

export const logSearch = (query: string, resultsCount: number, entityType: string) => 
  auditService.logSearch(query, resultsCount, entityType);

export const logExport = (entityType: string, format: string, recordCount: number) => 
  auditService.logExport(entityType, format, recordCount);
