import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
try {
  const rows = await db.$queryRawUnsafe(`
    SELECT 'User' AS table_name, COUNT(*)::int AS rows FROM "User"
    UNION ALL SELECT 'Profile', COUNT(*)::int FROM "Profile"
    UNION ALL SELECT 'FamilyMember', COUNT(*)::int FROM "FamilyMember"
  `);
  const duplicates = await db.$queryRawUnsafe(`
    SELECT 'User.email' AS key, COUNT(*)::int AS groups FROM (SELECT email FROM "User" WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1) x
    UNION ALL SELECT 'Profile.userId', COUNT(*)::int FROM (SELECT "userId" FROM "Profile" GROUP BY "userId" HAVING COUNT(*) > 1) x
    UNION ALL SELECT 'FamilyMember.ownerId,email', COUNT(*)::int FROM (SELECT "ownerId", email FROM "FamilyMember" GROUP BY "ownerId", email HAVING COUNT(*) > 1) x
  `);
  console.log(JSON.stringify({rows,duplicates},null,2));
} finally { await db.$disconnect(); }
