import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.user.update({
    where: { email: 'guranshsinnovations9@gmail.com' },
    data: { failedLoginCount: 0, lockedUntil: null },
  });
  console.log('Unlocked:', u.email);
  await prisma.$disconnect();
}
main();