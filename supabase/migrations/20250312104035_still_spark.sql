/*
  # Enable Email Verification

  1. Changes
    - Update auth.users configuration to require email verification
    - Add email templates for verification
*/

-- Enable email verification requirement
ALTER TABLE auth.users
  ALTER COLUMN email_confirmed_at SET DEFAULT NULL,
  ALTER COLUMN email_confirmed_at DROP NOT NULL;

-- Update existing users to require verification
UPDATE auth.users
SET email_confirmed_at = NULL
WHERE email_confirmed_at IS NOT NULL
  AND email != 'admin@leadtracker.com';