/*
  # Add User Profile Fields to Leads Table

  1. Changes
    - Add user profile fields to leads table for lead capture
    - Fields include: first_name, last_name, email, phone, location, budget_min, budget_max
    - Add preferred_contact_method field
    
  2. Details
    - All new fields are optional to allow flexible lead capture
    - Location field stores user's city/state or zip code
    - Budget range helps qualify leads
    - Email is indexed for faster lookups
*/

-- Add user profile fields to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE leads 
      ADD COLUMN first_name text,
      ADD COLUMN last_name text,
      ADD COLUMN email text,
      ADD COLUMN phone text,
      ADD COLUMN location text,
      ADD COLUMN budget_min integer,
      ADD COLUMN budget_max integer,
      ADD COLUMN preferred_contact_method text DEFAULT 'email';
  END IF;
END $$;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);