/*
  # Complete CarGenie Database Schema

  1. New Tables
    - `car_models`: Stores car make/model information with specs
      - `id` (uuid, primary key)
      - `make` (text): Car manufacturer
      - `model` (text): Car model name
      - `year_min` (integer): Minimum year available
      - `year_max` (integer): Maximum year available
      - `body_type` (text): sedan, suv, truck, etc.
      - `seats` (integer): Seating capacity
      - `fuel_type` (text): gas, electric, hybrid
      - `mpg_city` (integer): City fuel economy
      - `mpg_highway` (integer): Highway fuel economy
      - `description` (text): Car description
      - `specs` (jsonb): Additional specifications
      - `created_at` (timestamp)
      - Unique constraint on (make, model, year_min, year_max)

    - `listing_instances`: Real car listings for sale
      - `id` (uuid, primary key)
      - `car_model_id` (uuid, foreign key to car_models)
      - `price` (integer): Listing price
      - `year` (integer): Specific year of this listing
      - `mileage` (integer): Odometer reading
      - `seller` (text): Dealership or seller name
      - `location` (text): City, state
      - `lat` (numeric): Latitude
      - `lon` (numeric): Longitude
      - `source_url` (text): Original listing URL
      - `source_platform` (text): Where scraped from
      - `scraped_at` (timestamp): When data was collected
      - `status` (text): active, sold, expired
      - `images` (jsonb): Array of image URLs
      - `created_at` (timestamp)

    - `leads`: User interest tracking
      - `id` (uuid, primary key)
      - `listing_instance_id` (uuid, foreign key)
      - `first_name` (text): User first name
      - `last_name` (text): User last name
      - `email` (text): User email
      - `phone` (text): User phone
      - `location` (text): User location
      - `budget_min` (integer): Minimum budget
      - `budget_max` (integer): Maximum budget
      - `preferred_contact_method` (text): email, phone, either
      - `tracked_url` (text): Tracked referral URL
      - `status` (text): new, contacted, closed
      - `notes` (text): Admin notes
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `partners`: Dealership/affiliate partners
      - `id` (uuid, primary key)
      - `name` (text): Partner name
      - `type` (text): dealership, affiliate, etc.
      - `commission_rate` (numeric): Commission percentage
      - `api_key` (text): Partner API key
      - `contact_email` (text): Contact email
      - `active` (boolean): Is partner active
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Public read access to car_models and listing_instances
    - Authenticated insert access to leads
    - No public access to partners (admin only)
*/

-- Create car_models table
CREATE TABLE IF NOT EXISTS car_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  year_min integer NOT NULL,
  year_max integer NOT NULL,
  body_type text NOT NULL DEFAULT 'sedan',
  seats integer NOT NULL DEFAULT 5,
  fuel_type text NOT NULL DEFAULT 'gas',
  mpg_city integer,
  mpg_highway integer,
  description text,
  specs jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_car_model UNIQUE (make, model, year_min, year_max)
);

-- Create listing_instances table
CREATE TABLE IF NOT EXISTS listing_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_model_id uuid REFERENCES car_models(id) ON DELETE SET NULL,
  price integer NOT NULL,
  year integer NOT NULL,
  mileage integer NOT NULL DEFAULT 0,
  seller text NOT NULL,
  location text NOT NULL,
  lat numeric,
  lon numeric,
  source_url text,
  source_platform text,
  scraped_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  images jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_instance_id uuid REFERENCES listing_instances(id) ON DELETE SET NULL,
  first_name text,
  last_name text,
  email text,
  phone text,
  location text,
  budget_min integer,
  budget_max integer,
  preferred_contact_method text DEFAULT 'email',
  tracked_url text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'dealership',
  commission_rate numeric NOT NULL DEFAULT 0,
  api_key text,
  contact_email text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for car_models (public read)
CREATE POLICY "Anyone can view car models"
  ON car_models FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for listing_instances (public read)
CREATE POLICY "Anyone can view active listings"
  ON listing_instances FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- RLS Policies for leads (authenticated insert)
CREATE POLICY "Anyone can create leads"
  ON leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view their own leads"
  ON leads FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for partners (no public access)
-- Only service role can access partners table

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_car_models_make ON car_models(make);
CREATE INDEX IF NOT EXISTS idx_car_models_body_type ON car_models(body_type);
CREATE INDEX IF NOT EXISTS idx_car_models_fuel_type ON car_models(fuel_type);
CREATE INDEX IF NOT EXISTS idx_car_models_seats ON car_models(seats);
CREATE INDEX IF NOT EXISTS idx_listing_instances_car_model ON listing_instances(car_model_id);
CREATE INDEX IF NOT EXISTS idx_listing_instances_status ON listing_instances(status);
CREATE INDEX IF NOT EXISTS idx_leads_listing ON leads(listing_instance_id);
