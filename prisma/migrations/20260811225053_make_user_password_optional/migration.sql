-- Social-only accounts (Google OAuth) have no password.
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
