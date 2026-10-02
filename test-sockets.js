// Final definitive integration test for friend request flow
// Clears Redis queue first to ensure clean state

const { io } = require('socket.io-client');
const API_URL = 'http://localhost:4000';

async function apiFetch(path, token, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const s = io(API_URL, { auth: { token }, transports: ['websocket'], reconnection: false, forceNew: true });
    s.on('connect', () => resolve(s));
    s.on('connect_error', e => reject(e));
  });
}

function waitFor(socket, event, ms = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout waiting for: ${event}`)), ms);
    socket.once(event, d => { clearTimeout(t); resolve(d); });
  });
}

function doUpgrade(socket, token) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('auth:upgrade timeout')), 4000);
    socket.emit('auth:upgrade', { token }, ack => {
      clearTimeout(t);
      ack?.success ? resolve(ack) : reject(new Error(ack?.error || 'upgrade failed'));
    });
  });
}

async function main() {
  const ts = Date.now();

  // Step 1: Create accounts
  console.log('Step 1: Creating guest accounts...');
  const gA = await apiFetch('/api/v1/auth/guest', null, { method: 'POST' });
  const gB = await apiFetch('/api/v1/auth/guest', null, { method: 'POST' });
  console.log('A:', gA.user.userId, '  B:', gB.user.userId);

  // Step 2: Connect  
  console.log('\nStep 2: Connecting sockets...');
  const sA = await connectSocket(gA.token);
  const sB = await connectSocket(gB.token);
  console.log('Connected. Sockets status: A connected =', sA.connected, ', B connected =', sB.connected);

  sA.on('match:searching', d => console.log('A got match:searching', d));
  sB.on('match:searching', d => console.log('B got match:searching', d));
  sA.on('match:found', d => console.log('A got match:found', d.roomId));
  sB.on('match:found', d => console.log('B got match:found', d.roomId));

  // Step 3: Match — B joins first, then A joins (so B is in queue when A calls findMatch)
  console.log('\nStep 3: Matchmaking...');
  const matchA = waitFor(sA, 'match:found', 15000);
  const matchB = waitFor(sB, 'match:found', 15000);

  // B joins first
  console.log('B emitting match:join...');
  sB.emit('match:join', { interests: ['coding', 'music', 'sports'], language: 'en', mediaType: 'text' });
  // Wait 1000ms to ensure B's ticket is in Redis and processed
  await new Promise(r => setTimeout(r, 1000));
  
  // A joins - findMatch should find B
  console.log('A emitting match:join...');
  sA.emit('match:join', { interests: ['coding', 'music', 'sports'], language: 'en', mediaType: 'text' });

  try {
    const [mA, mB] = await Promise.all([matchA, matchB]);
    console.log('✓ Matched! Room:', mA.roomId);
  } catch(e) {
    console.error('❌ Match failed:', e.message);
    console.log('Check if backend is running and Redis is clean.');
    sA.disconnect(); sB.disconnect(); process.exit(1);
  }

  // Step 4: A registers and upgrades
  console.log('\nStep 4: A registers...');
  const regA = await apiFetch('/api/v1/auth/convert-guest', gA.token, {
    method: 'POST',
    body: JSON.stringify({ username: `testA${ts}`, password: 'password123' })
  });
  await doUpgrade(sA, regA.token);
  console.log('✓ A upgraded:', regA.user.username);

  // Step 5: A sends friend request
  console.log('\nStep 5: A sends friend request...');
  const recvP = waitFor(sB, 'friend:request_received_in_chat', 4000);
  sA.emit('friend:request_in_chat');
  let recv;
  try {
    recv = await recvP;
    console.log('✓ B received friend request, id:', recv.id);
  } catch(e) {
    console.error('❌ B did not receive friend request:', e.message);
    sA.disconnect(); sB.disconnect(); process.exit(1);
  }

  // Step 6: B registers and upgrades
  console.log('\nStep 6: B registers...');
  const regB = await apiFetch('/api/v1/auth/convert-guest', gB.token, {
    method: 'POST',
    body: JSON.stringify({ username: `testB${ts}`, password: 'password123' })
  });
  await doUpgrade(sB, regB.token);
  console.log('✓ B upgraded:', regB.user.username);

  // Step 7: B accepts
  console.log('\nStep 7: B accepts friend request...');
  const accA = waitFor(sA, 'friend:request_accepted_in_chat', 4000);
  const accB = waitFor(sB, 'friend:request_accepted_in_chat', 4000);
  sB.emit('friend:accept_in_chat', { requestId: recv.id });

  try {
    const [aA, aB] = await Promise.all([accA, accB]);
    console.log('\n✅✅✅ TEST PASSED!');
    console.log('A notified:', aA.friendName, '| chatRoom:', aA.chatRoomId);
    console.log('B notified:', aB.friendName, '| chatRoom:', aB.chatRoomId);
  } catch(e) {
    console.log('\n❌ TEST FAILED:', e.message);
  }

  sA.disconnect();
  sB.disconnect();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
