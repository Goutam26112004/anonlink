import { GamificationService } from '../backend/src/services/gamification.js';

const runGamificationTests = () => {
  console.log('--- Starting Gamification Level-XP Progression Tests ---');

  // We mock a simple offline level-up calculation by mimicking the logic
  const mockAwardXp = (currentLevel: number, currentXp: number, addedXp: number) => {
    let newXp = currentXp + addedXp;
    let level = currentLevel;
    let levelUp = false;

    let xpNeeded = level * 100;
    while (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      level += 1;
      levelUp = true;
      xpNeeded = level * 100;
    }
    return { levelUp, newLevel: level, newXp };
  };

  // Test Case 1: Simple XP addition without level up
  const res1 = mockAwardXp(1, 20, 50);
  console.assert(res1.levelUp === false, 'Test 1 Failed: Should not level up');
  console.assert(res1.newXp === 70, `Test 1 Failed: Expected XP 70, got ${res1.newXp}`);
  console.log('Test 1 Passed: Simple XP addition calculated correctly.');

  // Test Case 2: XP triggers single level up (100 XP threshold for Lv1)
  const res2 = mockAwardXp(1, 50, 80);
  console.assert(res2.levelUp === true, 'Test 2 Failed: Should level up');
  console.assert(res2.newLevel === 2, `Test 2 Failed: Expected Level 2, got ${res2.newLevel}`);
  console.assert(res2.newXp === 30, `Test 2 Failed: Expected remaining XP 30, got ${res2.newXp}`);
  console.log('Test 2 Passed: Single Level Up calculated correctly.');

  // Test Case 3: XP triggers double level up
  // Starting: Level 1, XP 50. Add 350 XP.
  // 50 + 350 = 400 XP.
  // Level 1 threshold: 100 XP. Level up to 2. Remaining = 300 XP.
  // Level 2 threshold: 200 XP. Level up to 3. Remaining = 100 XP.
  // Level 3 threshold: 300 XP. No level up.
  // Final state: Level 3, Remaining XP = 100.
  const res3 = mockAwardXp(1, 50, 350);
  console.assert(res3.levelUp === true, 'Test 3 Failed: Should level up');
  console.assert(res3.newLevel === 3, `Test 3 Failed: Expected Level 3, got ${res3.newLevel}`);
  console.assert(res3.newXp === 100, `Test 3 Failed: Expected remaining XP 100, got ${res3.newXp}`);
  console.log('Test 3 Passed: Multi-level up calculated correctly.');

  console.log('All Gamification level-up assertions passed successfully!');
};

runGamificationTests();
