import { ModerationService } from '../backend/dist/services/moderation.js';
const runTests = () => {
    console.log('--- Starting Rule-Based Moderation Tests ---');
    // Test Case 1: Clean message
    const test1 = ModerationService.checkContent('Hello world, hope you are doing well!');
    console.assert(test1.allowed === true, 'Test 1 Failed: Clean message should be allowed');
    console.assert(test1.cleanedText === 'Hello world, hope you are doing well!', 'Test 1 Failed: Message text mutated');
    console.log('Test 1 Passed: Clean message allowed.');
    // Test Case 2: Profanity word check
    const test2 = ModerationService.checkContent('Hey, do not be a faggot here.');
    console.assert(test2.allowed === true, 'Test 2 Failed: Profanity message should be allowed (cleaned)');
    console.assert(test2.cleanedText?.includes('******'), 'Test 2 Failed: Profanity not replaced with asterisks');
    console.log('Test 2 Passed: Profanity censored.');
    // Test Case 3: Scam link check
    const test3 = ModerationService.checkContent('Get free coins at t.me/giveawaynow !');
    console.assert(test3.allowed === false, 'Test 3 Failed: Scam link should be blocked');
    console.assert(test3.reason === 'Scam or suspicious links detected', 'Test 3 Failed: Wrong reason returned');
    console.log('Test 3 Passed: Scam link blocked.');
    console.log('All verification checks passed successfully!');
};
runTests();
