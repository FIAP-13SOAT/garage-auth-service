import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('dd-trace', () => ({
  default: {
    dogstatsd: {
      increment: vi.fn(),
      gauge: vi.fn(),
      histogram: vi.fn(),
      distribution: vi.fn(),
    },
  },
}));

const { AuthMetrics } = await import('../AuthMetrics.js');
const tracer = (await import('dd-trace')).default;

describe('AuthMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('increments auth.login.success with audience tag', () => {
    AuthMetrics.loginSuccess('customer');
    expect(tracer.dogstatsd.increment).toHaveBeenCalledWith(
      'auth.login.success',
      1,
      expect.arrayContaining(['audience:customer']),
    );
  });

  it('increments auth.login.failure with audience and reason', () => {
    AuthMetrics.loginFailure('admin', 'invalid_password');
    expect(tracer.dogstatsd.increment).toHaveBeenCalledWith(
      'auth.login.failure',
      1,
      expect.arrayContaining(['audience:admin', 'reason:invalid_password']),
    );
  });

  it('increments customer_events.processed with event_type', () => {
    AuthMetrics.customerEventProcessed('CUSTOMER_CRIADO');
    expect(tracer.dogstatsd.increment).toHaveBeenCalledWith(
      'auth.customer_events.processed',
      1,
      expect.arrayContaining(['event_type:CUSTOMER_CRIADO']),
    );
  });

  it('increments customer_events.failed with event_type', () => {
    AuthMetrics.customerEventFailed('CUSTOMER_REMOVIDO');
    expect(tracer.dogstatsd.increment).toHaveBeenCalledWith(
      'auth.customer_events.failed',
      1,
      expect.arrayContaining(['event_type:CUSTOMER_REMOVIDO']),
    );
  });
});
