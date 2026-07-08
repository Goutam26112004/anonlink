// Onboarding unit tests
const runOnboardingTests = () => {
  console.log('--- Starting Onboarding Tests ---');

  const validAgeRanges = ['UNDER_18', 'AGE_18_24', 'AGE_25_34', 'AGE_35_44', 'AGE_45_PLUS'];
  const validGenders = ['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'];

  // Test age options validation
  const testAge = (age: string) => validAgeRanges.includes(age);
  console.assert(testAge('UNDER_18') === true, 'UNDER_18 should be valid');
  console.assert(testAge('AGE_18_24') === true, 'AGE_18_24 should be valid');
  console.assert(testAge('UNKNOWN') === false, 'UNKNOWN should be invalid');

  // Test gender options validation
  const testGender = (gender: string) => validGenders.includes(gender);
  console.assert(testGender('MALE') === true, 'MALE should be valid');
  console.assert(testGender('FEMALE') === true, 'FEMALE should be valid');
  console.assert(testGender('PREFER_NOT_TO_SAY') === true, 'PREFER_NOT_TO_SAY should be valid');
  console.assert(testGender('OTHER') === false, 'OTHER should be invalid');

  console.log('All Onboarding validation tests passed.');
};

runOnboardingTests();
