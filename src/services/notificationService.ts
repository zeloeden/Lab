import { Test } from '@/lib/types';
import { toast } from 'sonner';

interface NotificationSchedule {
  testId: string;
  dueDate: Date;
  timeoutId?: NodeJS.Timeout;
}

class NotificationService {
  private schedules: Map<string, NotificationSchedule> = new Map();
  private checkInterval?: NodeJS.Timeout;
  private notificationSound: HTMLAudioElement;

  constructor() {
    // Initialize notification sound
    this.notificationSound = new Audio('/sounds/notification.wav');
    this.notificationSound.volume = 0.5;
    
    // Load existing schedules from localStorage
    this.loadSchedules();
    
    // Start checking for due tests every minute
    this.startDueCheckInterval();
  }

  private loadSchedules() {
    const stored = localStorage.getItem('nbslims_notification_schedules');
    if (stored) {
      try {
        const schedules = JSON.parse(stored);
        schedules.forEach((schedule: any) => {
          this.schedules.set(schedule.testId, {
            ...schedule,
            dueDate: new Date(schedule.dueDate)
          });
        });
      } catch (error) {
        console.error('Error loading notification schedules:', error);
      }
    }
  }

  private saveSchedules() {
    const schedules = Array.from(this.schedules.values()).map(s => ({
      testId: s.testId,
      dueDate: s.dueDate.toISOString()
    }));
    localStorage.setItem('nbslims_notification_schedules', JSON.stringify(schedules));
  }

  private startDueCheckInterval() {
    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkDueTests();
    }, 60000); // 1 minute
    
    // Also check immediately
    this.checkDueTests();
  }

  private checkDueTests() {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Get all tests from localStorage
    const storedTests = localStorage.getItem('nbslims_tests');
    if (!storedTests) return;
    
    try {
      const tests: Test[] = JSON.parse(storedTests);
      
      tests.forEach(test => {
        if (!test.dueDate || test.approved) return;
        
        const dueDate = new Date(test.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        
        // Check if test is due in the next hour
        if (timeDiff > 0 && timeDiff <= 60 * 60 * 1000) {
          // Check if we haven't already notified for this test
          const schedule = this.schedules.get(test.id);
          if (!schedule || schedule.dueDate.getTime() !== dueDate.getTime()) {
            this.sendNotification(test, 'due-soon');
            this.schedules.set(test.id, { testId: test.id, dueDate });
            this.saveSchedules();
          }
        }
        
        // Check if test is overdue
        if (timeDiff < 0) {
          const schedule = this.schedules.get(test.id);
          // Notify once per day for overdue tests
          const lastNotified = schedule?.dueDate;
          const daysSinceNotified = lastNotified ? 
            (now.getTime() - lastNotified.getTime()) / (24 * 60 * 60 * 1000) : 1;
          
          if (!lastNotified || daysSinceNotified >= 1) {
            this.sendNotification(test, 'overdue');
            this.schedules.set(test.id, { testId: test.id, dueDate: now });
            this.saveSchedules();
          }
        }
      });
    } catch (error) {
      console.error('Error checking due tests:', error);
    }
  }

  private async sendNotification(test: Test, type: 'due-soon' | 'overdue') {
    // Get sample details
    const storedSamples = localStorage.getItem('nbslims_enhanced_samples');
    let sampleName = 'Unknown Sample';
    
    if (storedSamples) {
      try {
        const samples = JSON.parse(storedSamples);
        const sample = samples.find((s: any) => s.id === test.sampleId);
        if (sample) {
          sampleName = sample.itemNameEN || sample.itemNameAR || 'Sample #' + sample.sampleNo;
        }
      } catch (error) {
        console.error('Error getting sample details:', error);
      }
    }
    
    // Play notification sound if enabled
    const soundEnabled = localStorage.getItem('nbslims_notification_sound') !== 'false';
    if (soundEnabled) {
      try {
        await this.notificationSound.play();
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    }
    
    // Show toast notification
    if (type === 'due-soon') {
      toast.warning(`Test Due Soon!`, {
        description: `Test for "${sampleName}" is due in less than 1 hour`,
        duration: 10000,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = '/test-management?highlight=' + test.id;
          }
        }
      });
    } else {
      toast.error(`Test Overdue!`, {
        description: `Test for "${sampleName}" is overdue`,
        duration: 10000,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = '/test-management?highlight=' + test.id;
          }
        }
      });
    }
    
    // Try browser notifications if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(
        type === 'due-soon' ? 'Test Due Soon!' : 'Test Overdue!',
        {
          body: `Test for "${sampleName}" ${type === 'due-soon' ? 'is due soon' : 'is overdue'}`,
          icon: '/favicon.svg',
          tag: test.id,
          requireInteraction: true
        }
      );
      
      notification.onclick = () => {
        window.focus();
        window.location.href = '/test-management?highlight=' + test.id;
        notification.close();
      };
    }
  }

  public scheduleTestNotification(test: Test) {
    if (!test.dueDate || test.approved) return;
    
    const dueDate = new Date(test.dueDate);
    const notifyTime = new Date(dueDate.getTime() - 60 * 60 * 1000); // 1 hour before
    const now = new Date();
    
    if (notifyTime > now) {
      const timeUntilNotify = notifyTime.getTime() - now.getTime();
      
      // Clear existing timeout if any
      const existing = this.schedules.get(test.id);
      if (existing?.timeoutId) {
        clearTimeout(existing.timeoutId);
      }
      
      // Schedule new notification
      const timeoutId = setTimeout(() => {
        this.sendNotification(test, 'due-soon');
      }, timeUntilNotify);
      
      this.schedules.set(test.id, { testId: test.id, dueDate, timeoutId });
      this.saveSchedules();
    }
  }

  public cancelTestNotification(testId: string) {
    const schedule = this.schedules.get(testId);
    if (schedule?.timeoutId) {
      clearTimeout(schedule.timeoutId);
    }
    this.schedules.delete(testId);
    this.saveSchedules();
  }

  public getOverdueTests(): Test[] {
    const storedTests = localStorage.getItem('nbslims_tests');
    if (!storedTests) return [];
    
    try {
      const tests: Test[] = JSON.parse(storedTests);
      const now = new Date();
      
      return tests.filter(test => {
        if (!test.dueDate || test.approved) return false;
        const dueDate = new Date(test.dueDate);
        return dueDate < now;
      });
    } catch (error) {
      console.error('Error getting overdue tests:', error);
      return [];
    }
  }

  public getNearDueTests(hoursAhead: number = 24): Test[] {
    const storedTests = localStorage.getItem('nbslims_tests');
    if (!storedTests) return [];
    
    try {
      const tests: Test[] = JSON.parse(storedTests);
      const now = new Date();
      const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
      
      return tests.filter(test => {
        if (!test.dueDate || test.approved) return false;
        const dueDate = new Date(test.dueDate);
        return dueDate > now && dueDate <= futureTime;
      });
    } catch (error) {
      console.error('Error getting near-due tests:', error);
      return [];
    }
  }

  public requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Clear all timeouts
    this.schedules.forEach(schedule => {
      if (schedule.timeoutId) {
        clearTimeout(schedule.timeoutId);
      }
    });
  }
}

// Create singleton instance
export const notificationService = new NotificationService();
