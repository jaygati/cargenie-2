/*
  # CarGenie Database Schema

  1. New Tables
    - `car_models`
      - `id` (uuid, primary key)
      - `make` (text) - Car manufacturer (e.g., Toyota, Honda)
      - `model` (text) - Model name (e.g., Camry, Accord)
      - `year_min` (integer) - Minimum production year
      - `year_max` (integer) - Maximum production year
      - `body_type` (text) - sedan, suv, truck, coupe, hatchback, etc.
      - `seats` (integer) - Number of seats
      - `fuel_type` (text) - gas, electric, hybrid, diesel
      - `mpg_city` (integer) - City fuel economy
      - `mpg_highway` (integer) - Highway fuel economy
      - `description` (text) - Why this car is a good match
      - `specs` (jsonb) - Additional specs (horsepower, cargo space, etc.)
      - `created_at` (timestamp)

    - `listing_instances`
      - `id` (uuid, primary key)
      - `car_model_id` (uuid, foreign key) - References car_models
      - `price` (integer) - Listing price in dollars
      - `year` (integer) - Specific year of this listing
      - `mileage` (integer) - Miles on odometer
      - `seller` (text) - Seller name or dealership
      - `location` (text) - City, State or address
      - `lat` (numeric) - Latitude
      - `lon` (numeric) - Longitude
      - `source_url` (text) - Original listing URL
      - `source_platform` (text) - e.g., CarGurus, AutoTrader, etc.
      - `scraped_at` (timestamp) - When data was collected
      - `status` (text) - active, sold, expired
      - `images` (jsonb) - Array of image URLs
      - `created_at` (timestamp)

    - `leads`
      - `id` (uuid, primary key)
      - `listing_instance_id` (uuid, foreign key) - References listing_instances
      - `user_email` (text) - User contact
      - `user_phone` (text) - User phone
      - `user_name` (text) - User name
      - `tracked_url` (text) - Tracked link for analytics
      - `status` (text) - new, contacted, closed, dead
      - `notes` (text) - Admin notes
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `partners`
      - `id` (uuid, primary key)
      - `name` (text) - Partner name (dealership, platform)
      - `type` (text) - dealership, platform, affiliate
      - `commission_rate` (numeric) - Commission percentage
      - `api_key` (text) - API credentials if applicable
      - `contact_email` (text)
      - `active` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - car_models: public read access
    - listing_instances: public read access for active listings
    - leads: authenticated users can create, admins can view all
    - partners: admin-only access

  3. Important Notes
    - Primary matching uses car_models table only
    - listing_instances are queried only on user demand
    - Location-based queries use lat/lon for distance calculations
    - All timestamps use timestamptz for proper timezone handling
*/

-- Car Models table (canonical car data)
CREATE TABLE IF NOT EXISTS car_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  year_min integer NOT NULL,
  year_max integer NOT NULL,
  body_type text NOT NULL,
  seats integer NOT NULL DEFAULT 5,
  fuel_type text NOT NULL DEFAULT 'gas',
  mpg_city integer,
  mpg_highway integer,
  description text,
  specs jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Listing Instances (actual inventory from scrapers)
CREATE TABLE IF NOT EXISTS listing_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_model_id uuid REFERENCES car_models(id) ON DELETE CASCADE,
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

-- Leads (user inquiries)
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_instance_id uuid REFERENCES listing_instances(id) ON DELETE SET NULL,
  user_email text,
  user_phone text,
  user_name text,
  tracked_url text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Partners (dealerships, platforms, affiliates)
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'dealership',
  commission_rate numeric DEFAULT 0,
  api_key text,
  contact_email text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- car_models: public read access
CREATE POLICY "Anyone can view car models"
  ON car_models FOR SELECT
  USING (true);

-- listing_instances: public read access for active listings
CREATE POLICY "Anyone can view active listings"
  ON listing_instances FOR SELECT
  USING (status = 'active');

-- leads: anyone can create, no read access (admin will need separate policy)
CREATE POLICY "Anyone can create leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_car_models_make_model ON car_models(make, model);
CREATE INDEX IF NOT EXISTS idx_car_models_body_type ON car_models(body_type);
CREATE INDEX IF NOT EXISTS idx_car_models_seats ON car_models(seats);
CREATE INDEX IF NOT EXISTS idx_listing_instances_car_model ON listing_instances(car_model_id);
CREATE INDEX IF NOT EXISTS idx_listing_instances_status ON listing_instances(status);
CREATE INDEX IF NOT EXISTS idx_listing_instances_location ON listing_instances(lat, lon);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);