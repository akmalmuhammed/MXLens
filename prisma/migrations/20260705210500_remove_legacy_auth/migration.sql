-- Remove legacy NextAuth/Auth.js and password-token persistence after Clerk migration.
DROP TABLE IF EXISTS "Account";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "VerificationToken";

ALTER TABLE "User" DROP COLUMN IF EXISTS "hashedPassword";
