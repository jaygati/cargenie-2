/*
  # Add Unique Constraint to Car Models

  1. Changes
    - Add unique constraint on (make, model) to prevent duplicates
    
  2. Details
    - Ensures only one entry per make/model combination
    - Prevents duplicate car models in database
*/

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS car_models_make_model_unique 
ON car_models(make, model);