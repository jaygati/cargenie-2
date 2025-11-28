/*
  # Deduplicate Car Models and Add Constraints

  1. Changes
    - Remove duplicate car models, keeping only one per make/model combination
    - Add unique constraint on (make, model) to prevent future duplicates
    
  2. Details
    - Delete duplicate rows, keeping the first entry for each make/model
    - Add unique index on make and model columns
    - This ensures database integrity going forward
*/

-- Delete duplicates, keeping only the first entry for each make/model combination
DELETE FROM car_models
WHERE id NOT IN (
  SELECT DISTINCT ON (make, model) id
  FROM car_models
  ORDER BY make, model, created_at
);

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS car_models_make_model_unique 
ON car_models(make, model);