/**
 * reset-admin.ts
 * Run anytime to reset the super-admin credentials.
 *
 * Usage:
 *   npx ts-node reset-admin.ts
 *
 * Reads SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD from .env.
 * If not set, falls back to the defaults below.
 */
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@yourstore.example';
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    console.error('ERROR: SEED_ADMIN_PASSWORD env var is not set. Aborting.');
    process.exit(1);
    }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      isActive: true,
      failedLoginCount: 0,
      lockedUntil: null,
      role: Role.SUPER_ADMIN,
    },
    create: {
      email,
      passwordHash,
      firstName: 'Store',
      lastName: 'Owner',
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log('\n✅ Admin ready:');
  console.log('   Email   :', user.email);
  console.log('   Password:', password);
  console.log('   Role    :', user.role);
  console.log('\nYou can now log in at http://localhost:5173\n');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});