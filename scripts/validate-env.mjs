#!/usr/bin/env node
const REQUIRED_ENV_VARS = [
  { name: 'NEXT_PUBLIC_BACKEND_URL', allowLocalhost: false },
  { name: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID', allowLocalhost: false },
];

const FORBIDDEN_PLACEHOLDERS = ['CHANGE_ME', 'your-', 'mock-'];
const FORBIDDEN_LOCALHOST = ['localhost', '127.0.0.1'];

let exitCode = 0;

for (const { name, allowLocalhost } of REQUIRED_ENV_VARS) {
  const value = process.env[name];

  if (!value) {
    console.error(`[ENV VALIDATION] FAIL: ${name} is not set`);
    exitCode = 1;
    continue;
  }

  if (!allowLocalhost) {
    for (const pattern of FORBIDDEN_LOCALHOST) {
      if (value.includes(pattern)) {
        console.error(`[ENV VALIDATION] FAIL: ${name}="${value}" contains "${pattern}" — production build must not use localhost`);
        exitCode = 1;
      }
    }
  }

  if (value.startsWith('http:')) {
    console.error(`[ENV VALIDATION] FAIL: ${name}="${value}" uses HTTP — production build must use HTTPS`);
    exitCode = 1;
  }

  for (const placeholder of FORBIDDEN_PLACEHOLDERS) {
    if (value.includes(placeholder)) {
      console.error(`[ENV VALIDATION] FAIL: ${name}="${value}" still contains placeholder "${placeholder}"`);
      exitCode = 1;
    }
  }

  if (exitCode === 0) {
    console.log(`[ENV VALIDATION] PASS: ${name}=${value}`);
  }
}

if (exitCode === 0) {
  console.log('[ENV VALIDATION] All checks passed.');
} else {
  console.error('[ENV VALIDATION] One or more environment variables are invalid. Aborting build.');
}

process.exit(exitCode);
