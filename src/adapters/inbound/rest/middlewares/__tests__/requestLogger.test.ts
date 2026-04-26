import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import type { Request, Response } from 'express';
import { requestLogger } from '../requestLogger.js';

describe('requestLogger', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it('logs an http.request entry with method, path, status and duration', () => {
    const req = { method: 'GET', path: '/health' } as Request;
    const res = new EventEmitter() as unknown as Response;
    (res as unknown as { statusCode: number }).statusCode = 200;

    const next = vi.fn();
    requestLogger(req, res, next);
    expect(next).toHaveBeenCalledOnce();

    (res as unknown as EventEmitter).emit('finish');

    const [[line]] = stdoutSpy.mock.calls;
    const entry = JSON.parse(String(line));
    expect(entry.message).toBe('http.request');
    expect(entry.method).toBe('GET');
    expect(entry.path).toBe('/health');
    expect(entry.status).toBe(200);
    expect(entry.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('does not log before the response finishes', () => {
    const req = { method: 'POST', path: '/login' } as Request;
    const res = new EventEmitter() as unknown as Response;
    (res as unknown as { statusCode: number }).statusCode = 401;

    requestLogger(req, res, vi.fn());
    expect(stdoutSpy).not.toHaveBeenCalled();
  });
});
