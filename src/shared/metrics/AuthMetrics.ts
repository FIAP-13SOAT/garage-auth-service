import { MetricsService } from './MetricsService.js';

export const AuthMetrics = {
  loginSuccess(audience: 'customer' | 'admin'): void {
    MetricsService.increment('auth.login.success', { audience });
  },

  loginFailure(audience: 'customer' | 'admin', reason: string): void {
    MetricsService.increment('auth.login.failure', { audience, reason });
  },

  customerEventProcessed(eventType: string): void {
    MetricsService.increment('auth.customer_events.processed', { event_type: eventType });
  },

  customerEventFailed(eventType: string): void {
    MetricsService.increment('auth.customer_events.failed', { event_type: eventType });
  },
};
