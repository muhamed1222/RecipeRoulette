-- Seed initial company record for development/demo

DO $$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT id INTO v_company_id
  FROM company
  WHERE name = 'Demo Company';

  IF v_company_id IS NULL THEN
    INSERT INTO company (name, timezone, locale)
    VALUES ('Demo Company', 'Europe/Amsterdam', 'ru');
  END IF;
END $$;
