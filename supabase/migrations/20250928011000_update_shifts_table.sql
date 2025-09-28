-- Update shifts table to match the new structure

-- Add new columns
ALTER TABLE shift ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE shift ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE shift ADD COLUMN IF NOT EXISTS break_start TIMESTAMPTZ;
ALTER TABLE shift ADD COLUMN IF NOT EXISTS break_end TIMESTAMPTZ;
ALTER TABLE shift ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE shift ADD COLUMN IF NOT EXISTS report_text TEXT;
ALTER TABLE shift ADD COLUMN IF NOT EXISTS problems TEXT;

-- Remove old columns that are not needed
-- We'll keep them for now to avoid data loss, but they won't be used in the new structure

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shift_date ON shift(date);
CREATE INDEX IF NOT EXISTS idx_shift_user_date ON shift(employee_id, date);

-- Update existing data to populate date column from planned_start_at
UPDATE shift 
SET date = planned_start_at::date 
WHERE date IS NULL;

-- Add constraints
ALTER TABLE shift 
ALTER COLUMN date SET NOT NULL;

-- Update the status check constraint to include new statuses if needed
-- ALTER TABLE shift DROP CONSTRAINT IF EXISTS shift_status_check;
-- ALTER TABLE shift ADD CONSTRAINT shift_status_check 
-- CHECK (status IN ('planned', 'active', 'done', 'missed', 'absent'));