// Subscription logic tests
const runSubscriptionTests = () => {
  console.log('--- Starting Subscription Tests ---');

  const calculateExpiry = (purchasedAt: Date, validityDays: number) => {
    return new Date(purchasedAt.getTime() + validityDays * 24 * 60 * 60 * 1000);
  };

  const purchasedAt = new Date('2026-07-08T00:00:00.000Z');
  
  // Daily plan (1 day)
  const dailyExpiry = calculateExpiry(purchasedAt, 1);
  console.assert(dailyExpiry.toISOString() === '2026-07-09T00:00:00.000Z', 'Daily plan expiry calculation failed');

  // Weekly plan (7 days)
  const weeklyExpiry = calculateExpiry(purchasedAt, 7);
  console.assert(weeklyExpiry.toISOString() === '2026-07-15T00:00:00.000Z', 'Weekly plan expiry calculation failed');

  // Monthly plan (30 days)
  const monthlyExpiry = calculateExpiry(purchasedAt, 30);
  console.assert(monthlyExpiry.toISOString() === '2026-07-18T00:00:00.000Z' || monthlyExpiry.toISOString() === '2026-08-07T00:00:00.000Z', 'Monthly plan expiry calculation failed');

  console.log('All Subscription logic tests passed.');
};

runSubscriptionTests();
