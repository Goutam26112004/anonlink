import { prisma } from './config/db.js';

async function main() {
  console.log("=== USERS ===");
  const users = await prisma.user.findMany({
    select: { id: true, username: true, displayName: true, registrationType: true }
  });
  console.log(users);

  console.log("=== FRIEND REQUESTS ===");
  const requests = await prisma.friendRequest.findMany();
  console.log(requests);
}

main().catch(console.error).finally(() => prisma.$disconnect());
