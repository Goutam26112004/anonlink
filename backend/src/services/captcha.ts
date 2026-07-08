const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

interface CaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export async function verifyCaptcha(token: string, expectedAction?: string): Promise<{ valid: boolean; score?: number; error?: string }> {
  if (!token) return { valid: false, error: 'Missing captcha token' };

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token })
    });

    const data: CaptchaResponse = await res.json();

    if (!data.success) {
      return { valid: false, error: (data['error-codes'] || ['unknown']).join(', ') };
    }

    return { valid: true, score: data.score };
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
