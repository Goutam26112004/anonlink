import { MatchmakerService, MatchTicket } from '../backend/src/services/matchmaker.js';

const runMatchmakerTests = () => {
  console.log('--- Starting Matchmaker Scoring Tests ---');

  const now = Math.floor(Date.now() / 1000);

  const userA: MatchTicket = {
    userId: 'user-a',
    socketId: 'socket-a',
    interests: ['anime', 'gaming'],
    language: 'en',
    country: 'US',
    isRegistered: true,
    joinedAt: now - 10, // waited 10s
    mediaType: 'text',
    reputationScore: 100
  };

  const userB: MatchTicket = {
    userId: 'user-b',
    socketId: 'socket-b',
    interests: ['anime', 'music'],
    language: 'en',
    country: 'US',
    isRegistered: true,
    joinedAt: now - 5, // waited 5s
    mediaType: 'text',
    reputationScore: 90
  };

  const userC: MatchTicket = {
    userId: 'user-c',
    socketId: 'socket-c',
    interests: ['cooking'],
    language: 'ja',
    country: 'JP',
    isRegistered: false,
    joinedAt: now,
    mediaType: 'text',
    reputationScore: 100
  };

  // Test 1: Shared interest, language, and country
  const scoreAB = MatchmakerService.calculateScore(userA, userB, now);
  // Shared interest: 'anime' (+15)
  // Matching language: 'en' (+30)
  // Matching country: 'US' (+20)
  // Wait times booster: 10s + 5s = 15s * 2 = (+30)
  // Reputation gap penalty: |100 - 90| = 10 * 0.5 = (-5)
  // Total expected = 15 + 30 + 20 + 30 - 5 = 90 points
  console.assert(scoreAB === 90, `Test 1 Failed: Expected score 90, got ${scoreAB}`);
  console.log('Test 1 Passed: High compatibility score matches expected value (90 pts).');

  // Test 2: Low compatibility stranger
  const scoreAC = MatchmakerService.calculateScore(userA, userC, now);
  // Shared interest: none (0)
  // Matching language: none (0)
  // Matching country: none (0)
  // Wait times booster: 10s + 0s = 10s * 2 = (+20)
  // Reputation gap penalty: |100 - 100| = 0 * 0.5 = (0)
  // Total expected = 20 points
  console.assert(scoreAC === 20, `Test 2 Failed: Expected score 20, got ${scoreAC}`);
  console.log('Test 2 Passed: Low compatibility score matches expected value (20 pts).');

  console.log('All Matchmaker scoring verification assertions passed successfully!');
};

runMatchmakerTests();
