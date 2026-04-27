-- Add email_sent column if it doesn't exist
ALTER TABLE feedback ADD COLUMN email_sent INTEGER DEFAULT 0;
