import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Creating subscription plans...');

  await prisma.subscriptionPlan.upsert({
    where: { type: 'DAILY' },
    create: { type: 'DAILY', priceInr: 29, validityDays: 1, isVoiceEnabled: true, isVideoEnabled: true },
    update: { priceInr: 29, validityDays: 1, isVoiceEnabled: true, isVideoEnabled: true, isActive: true }
  });

  await prisma.subscriptionPlan.upsert({
    where: { type: 'WEEKLY' },
    create: { type: 'WEEKLY', priceInr: 149, validityDays: 7, isVoiceEnabled: true, isVideoEnabled: true },
    update: { priceInr: 149, validityDays: 7, isVoiceEnabled: true, isVideoEnabled: true, isActive: true }
  });

  await prisma.subscriptionPlan.upsert({
    where: { type: 'MONTHLY' },
    create: { type: 'MONTHLY', priceInr: 399, validityDays: 30, isVoiceEnabled: true, isVideoEnabled: true },
    update: { priceInr: 399, validityDays: 30, isVoiceEnabled: true, isVideoEnabled: true, isActive: true }
  });

  console.log('[Seed] Subscription plans created successfully.');
  console.log('[Seed]   Daily:   INR 29  / 1 day');
  console.log('[Seed]   Weekly:  INR 149 / 7 days');
  console.log('[Seed]   Monthly: INR 399 / 30 days');
}

main()
  .catch((e) => { console.error('[Seed] Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
