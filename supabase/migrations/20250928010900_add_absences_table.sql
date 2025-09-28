-- Add absences table for tracking employee absences

-- Create absences table
CREATE TABLE IF NOT EXISTS absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('absent', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_absences_user_date ON absences(user_id, date);

-- Enable RLS on absences table
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

-- Absences policies
DROP POLICY IF EXISTS read_absences_same_company ON absences;
CREATE POLICY read_absences_same_company
ON absences FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = absences.user_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS write_absences_same_company ON absences;
CREATE POLICY write_absences_same_company
ON absences FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = absences.user_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS update_absences_same_company ON absences;
CREATE POLICY update_absences_same_company
ON absences FOR UPDATE
USING (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = absences.user_id
    AND a.id = auth.uid()
));