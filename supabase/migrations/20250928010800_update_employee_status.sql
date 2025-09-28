-- Update employee status constraint to include additional status values

-- First, drop the existing constraint
ALTER TABLE employee DROP CONSTRAINT IF EXISTS employee_status_check;

-- Add the new constraint with all allowed values
ALTER TABLE employee ADD CONSTRAINT employee_status_check 
CHECK (status IN ('active', 'inactive', 'vacation', 'sick', 'trip', 'dayoff'));