-- Setup Supabase Storage with TTL policies for outTime system

-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for reports bucket if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Employees can upload reports'
  ) THEN
    CREATE POLICY "Employees can upload reports"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'reports');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can read reports'
  ) THEN
    CREATE POLICY "Admins can read reports"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'reports'
      AND EXISTS (
        SELECT 1 FROM admin_user
        WHERE admin_user.id = auth.uid()
      )
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Employees can update their own reports'
  ) THEN
    CREATE POLICY "Employees can update their own reports"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'reports'
      AND owner = auth.uid()
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Employees can delete their own reports'
  ) THEN
    CREATE POLICY "Employees can delete their own reports"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'reports'
      AND owner = auth.uid()
    );
  END IF;
END;
$$;

-- Set up TTL policy for report attachments (90 days)
-- This would typically be handled by a cron job or external service
-- For Supabase, we'll create a function to clean up old attachments

-- Create function to delete old attachments
CREATE OR REPLACE FUNCTION delete_old_attachments()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete attachments older than 90 days
  DELETE FROM storage.objects 
  WHERE bucket_id = 'reports' 
  AND created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- To set up automatic cleanup, you would need to schedule this function
-- This can be done with Supabase cron jobs or external services

-- Example of how to manually call the function:
-- SELECT delete_old_attachments();

-- Note: In a production environment, you would set up a cron job to run this function daily
-- For Supabase, this would be done through the Supabase dashboard or CLI
