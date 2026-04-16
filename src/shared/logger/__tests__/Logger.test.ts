import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../Logger.js';

describe('Logger', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  const captured = (spy: typeof stdoutSpy): Record<string, unknown> => {
    const [[line]] = spy.mock.calls;
    return JSON.parse(String(line));
  };

  it('emits JSON to stdout for info', () => {
    Logger.info('test.event', { foo: 'bar' });
    const entry = captured(stdoutSpy);
    expect(entry.level).toBe('info');
    expect(entry.message).toBe('test.event');
    expect(entry.foo).toBe('bar');
    expect(entry.timestamp).toBeDefined();
    expect(entry.service).toBeDefined();
  });

  it('emits JSON to stderr for error', () => {
    Logger.error('test.failure');
    expect(stderrSpy).toHaveBeenCalledOnce();
    expect(stdoutSpy).not.toHaveBeenCalled();
    const entry = captured(stderrSpy);
    expect(entry.level).toBe('error');
  });

  it('emits warn and debug to stdout', () => {
    Logger.warn('w');
    Logger.debug('d');
    expect(stdoutSpy).toHaveBeenCalledTimes(2);
  });

  it('serializes context fields alongside standard fields', () => {
    Logger.info('http.request', { method: 'GET', path: '/x', status: 200 });
    const entry = captured(stdoutSpy);
    expect(entry.method).toBe('GET');
    expect(entry.path).toBe('/x');
    expect(entry.status).toBe(200);
  });
});
