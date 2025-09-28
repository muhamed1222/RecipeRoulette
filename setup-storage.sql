-- Storage setup script for outTime system

-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for reports bucket
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
