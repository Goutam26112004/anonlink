import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyCaptcha } from './captcha.js';

describe('verifyCaptcha', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should reject empty token', async () => {
    const result = await verifyCaptcha('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing captcha token');
  });

  it('should reject null/undefined token', async () => {
    const result = await verifyCaptcha(null as any);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing captcha token');
  });

  it('should handle network error gracefully', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
    const result = await verifyCaptcha('some-token');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Captcha verification failed');
  });

  it('should return valid true on successful verification', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ success: true, score: 0.9 })
    } as Response);

    const result = await verifyCaptcha('valid-token');
    expect(result.valid).toBe(true);
    expect(result.score).toBe(0.9);
  });

  it('should return error on failed verification', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({
        success: false,
        'error-codes': ['invalid-input-response']
      })
    } as Response);

    const result = await verifyCaptcha('invalid-token');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid-input-response');
  });
});
