-- Replace the LAWYER role with DESIGNER. Verified 0 rows reference LAWYER before this migration.
CREATE TYPE "UserRole_new" AS ENUM ('CLIENT', 'AGENT', 'DESIGNER', 'DEVELOPER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "roles" TYPE "UserRole_new"[] USING ("roles"::text[]::"UserRole_new"[]);
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
