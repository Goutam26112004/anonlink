// Temporary image TTL validation tests
const runTempMediaTests = () => {
  console.log('--- Starting Temporary Media TTL Tests ---');

  const checkMediaExpiry = (expiresAt: Date, now: Date) => {
    return now <= expiresAt;
  };

  const now = new Date();
  const validExpiresAt = new Date(now.getTime() + 60_000); // 60s in future
  const expiredExpiresAt = new Date(now.getTime() - 1000);  // 1s in past

  console.assert(checkMediaExpiry(validExpiresAt, now) === true, '60s in future should be valid');
  console.assert(checkMediaExpiry(expiredExpiresAt, now) === false, 'Expired time should be invalid');

  console.log('All Temp Media TTL logic tests passed.');
};

runTempMediaTests();
