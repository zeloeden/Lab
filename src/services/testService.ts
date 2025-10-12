import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/database';
import { Test, CreateTestRequest, AuditAction, TestResult } from '@/lib/types';
import { sampleService } from './sampleService';

export class TestService {
  async createTest(data: CreateTestRequest, userId: string): Promise<Test> {
    const test: Test = {
      id: uuidv4(),
      sampleId: data.sampleId,
      useType: data.useType,
      date: data.date,
      result: 'Pending' as TestResult, // Will be updated when test is completed
      approved: false,
      personalUseData: data.personalUseData,
      industrialData: data.industrialData,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.tests.add(test);
    
    // Log audit trail
    await this.logAudit('CREATE', test, userId);
    
    return test;
  }

  async updateTest(id: string, updates: Partial<Test>, userId: string): Promise<Test> {
    const existingTest = await db.tests.get(id);
    if (!existingTest) {
      throw new Error('Test not found');
    }

    const updatedTest = {
      ...existingTest,
      ...updates,
      updatedBy: userId,
      updatedAt: new Date()
    };

    await db.tests.update(id, updatedTest);
    
    // Log audit trail
    await this.logAudit('UPDATE', updatedTest, userId, existingTest);
    
    return updatedTest;
  }

  async getTest(id: string): Promise<Test | null> {
    return await db.tests.get(id) || null;
  }

  async getTestsBySample(sampleId: string): Promise<Test[]> {
    return await db.tests.where('sampleId').equals(sampleId).toArray();
  }

  async getApprovedTest(sampleId: string): Promise<Test | null> {
    return await db.tests
      .where('sampleId').equals(sampleId)
      .and(test => test.approved === true)
      .first() || null;
  }

  async getAllTests(): Promise<Test[]> {
    return await db.tests.orderBy('date').reverse().toArray();
  }

  // Critical: Approval workflow - only ONE approved test per sample
  async approveTest(testId: string, userId: string): Promise<Test> {
    const test = await db.tests.get(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    // First, remove approval from any existing approved test for this sample
    const existingApprovedTest = await this.getApprovedTest(test.sampleId);
    if (existingApprovedTest && existingApprovedTest.id !== testId) {
      await this.updateTest(existingApprovedTest.id, { approved: false }, userId);
    }

    // Approve the current test
    const approvedTest = await this.updateTest(testId, { approved: true }, userId);

    // Update the sample to reflect the approved test
    await sampleService.approveSample(test.sampleId, testId, userId);

    // Log approval audit
    await this.logAudit('APPROVE', approvedTest, userId);

    return approvedTest;
  }

  async removeApproval(testId: string, userId: string): Promise<Test> {
    const test = await this.updateTest(testId, { approved: false }, userId);
    
    // Update sample to remove approval
    await sampleService.updateSample(test.sampleId, { 
      approved: false, 
      approvedTestId: undefined 
    }, userId);

    return test;
  }

  async deleteTest(id: string, userId: string): Promise<void> {
    const test = await db.tests.get(id);
    if (!test) {
      throw new Error('Test not found');
    }

    // If this was an approved test, remove approval from sample
    if (test.approved) {
      await sampleService.updateSample(test.sampleId, { 
        approved: false, 
        approvedTestId: undefined 
      }, userId);
    }

    await db.tests.delete(id);
    
    // Log audit trail
    await this.logAudit('DELETE', test, userId);
  }

  async getTestsByUseType(useType: 'Personal Use' | 'Industrial'): Promise<Test[]> {
    return await db.tests.where('useType').equals(useType).toArray();
  }

  async getTestsByResult(result: string): Promise<Test[]> {
    return await db.tests.where('result').equals(result).toArray();
  }

  async searchTests(query: string): Promise<Test[]> {
    const tests = await db.tests.toArray();
    const samples = await db.samples.toArray();
    const sampleMap = new Map(samples.map(s => [s.id, s]));

    return tests.filter(test => {
      const sample = sampleMap.get(test.sampleId);
      const lowerQuery = query.toLowerCase();
      
      return (
        sample?.itemNameEN.toLowerCase().includes(lowerQuery) ||
        sample?.itemNameAR.toLowerCase().includes(lowerQuery) ||
        sample?.sampleNo.toString().includes(query) ||
        test.result.toLowerCase().includes(lowerQuery) ||
        test.useType.toLowerCase().includes(lowerQuery)
      );
    });
  }

  private async logAudit(action: AuditAction, test: Test, userId: string, oldValues?: Test): Promise<void> {
    await db.auditLogs.add({
      id: uuidv4(),
      entityType: 'Test',
      entityId: test.id,
      action,
      oldValues: oldValues ? { ...oldValues } : undefined,
      newValues: { ...test },
      userId,
      timestamp: new Date()
    });
  }
}

export const testService = new TestService();