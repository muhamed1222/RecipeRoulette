# Инструкция по настройке базы outTime

## Основной способ: миграции Supabase

1. Убедитесь, что установлены Supabase CLI и Postgres utilities (`brew install supabase/tap/supabase` и `brew install libpq`).
2. Экспортируйте пароль БД:
   ```bash
   export SUPABASE_DB_PASSWORD=gcj0NpI7ApXVqhqJ
   ```
3. Авторизуйтесь и привяжите проект (выполняется один раз):
   ```bash
   supabase login              # если ещё не выполнялось
   supabase link --project-ref lmpmkszgwwwqvbdhxest --password "$SUPABASE_DB_PASSWORD"
   ```
4. Примените миграции из `supabase/migrations`:
   ```bash
   supabase db push --password "$SUPABASE_DB_PASSWORD"
   ```
   CLI пройдётся по файлам:
   - `20250928010100_init_schema.sql`
   - `20250928010200_storage.sql`
   - `20250928010300_storage_ttl.sql`
   - `20250928010400_reminders.sql`
   - `20250928010500_audit_logging.sql`

## Альтернатива: ручной запуск SQL через SQL Editor

Если CLI недоступен, можно выбрать нужные файлы из `supabase/migrations` и запускать их по очереди в SQL Editor. Все скрипты идемпотентны: допускается повторный запуск без побочных эффектов.

Для хранения в `setup-*.sql` сохранены те же версии скриптов, чтобы их можно было просмотреть/отредактировать локально, но основным способом деплоя остаются миграции и `supabase db push`.
