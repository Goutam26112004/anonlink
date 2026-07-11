const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export async function verifyCaptcha(token: string): Promise<{ valid: boolean; error?: string }> {
  if (!token) return { valid: false, error: 'Missing captcha token' };

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: TURNSTILE_SECRET, response: token })
    });

    const data: TurnstileResponse = await res.json();

    if (!data.success) {
      return { valid: false, error: (data['error-codes'] || ['unknown']).join(', ') };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Captcha verification failed' };
  }
}

export function requireCaptcha(req: any, res: any, next: any) {
  const captchaToken = req.body?.captchaToken || req.headers['x-captcha-token'];

  if (!captchaToken) {
    return res.status(400).json({ error: 'CAPTCHA verification required.' });
  }

  verifyCaptcha(captchaToken).then((result) => {
    if (!result.valid) {
      return res.status(400).json({ error: `CAPTCHA verification failed: ${result.error}` });
    }
    next();
  }).catch(() => {
    return res.status(500).json({ error: 'CAPTCHA verification error.' });
  });
}
