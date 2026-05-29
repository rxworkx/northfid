import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Change these before running
const ADMIN_EMAIL = "admin@pipnova.com";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Admin@123456";

async function main() {
  const existing = await db.user.findFirst({
    where: { OR: [{ email: ADMIN_EMAIL }, { username: ADMIN_USERNAME }] },
  });

  if (existing) {
    // If user already exists, just promote them to admin
    await db.user.update({
      where: { id: existing.id },
      data: { role: "admin" },
    });
    console.log(`✓ Promoted existing user "${existing.email}" to admin`);
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const user = await db.user.create({
    data: {
      firstName: "Admin",
      lastName: "User",
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      password: hashed,
      role: "admin",
      referralCode: "ADMIN",
      emailVerified: true,
      wallet: { create: { balance: 0 } },
    },
  });

  console.log(`✓ Admin created`);
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Username: ${ADMIN_USERNAME}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`\n  → Change the password after first login via /admin/users/${user.id}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
